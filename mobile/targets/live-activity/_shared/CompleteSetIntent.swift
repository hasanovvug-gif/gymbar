// Лежит в targets/live-activity/_shared/ — @bacons/apple-targets кладёт этот файл
// ОДНОВРЕМЕННО в app-таргет и в widget-таргет. Это обязательно для LiveActivityIntent:
// iOS исполняет perform() в процессе ПРИЛОЖЕНИЯ, поэтому App Intents metadata должна быть
// в самом .app, а не только в расширении. Не перемещать отсюда.
import ActivityKit
import AppIntents
import Foundation
import UserNotifications

private let appGroupId = "group.com.gymbar.app"
private let completeSetEventsKey = "gymbar.completeSetEvents"
private let completeSetNotification = "com.gymbar.app.completeSet"
private let restSoonNotificationId = "gymbar-rest-soon"
private let restDoneNotificationId = "gymbar-rest-done"
private let restNotificationIdKey = "gymbar.restNotificationId"
private let soundEnabledKey = "gymbar.soundEnabled"
private let preSignalSecondsKey = "gymbar.preSignalSeconds"
private let defaultRestSeconds: TimeInterval = 90

@available(iOS 17.0, *)
struct CompleteSetIntent: LiveActivityIntent {
  static let title: LocalizedStringResource = "Завершить подход"
  static let description = IntentDescription("Засчитывает подход и запускает отдых.")
  static let isDiscoverable = false
  static let openAppWhenRun = false

  func perform() async throws -> some IntentResult {
    guard let activity = Activity<GymbarActivityAttributes>.activities.first else {
      return .result()
    }

    // Кнопка «Готово» видна и в активном подходе (canCompleteSet), и когда отдых уже истёк
    // (phase=="rest", restEndsAt<=now). На locked screen приложение спит и не может вернуть
    // карточку в активное состояние, поэтому тап по истёкшему отдыху обязан приниматься здесь.
    let current = activity.content.state
    guard current.phase != "paused", canAdvance(current) else {
      return .result()
    }
    guard let defaults = UserDefaults(suiteName: appGroupId) else {
      return .result()
    }

    let next = nextState(from: current)
    // staleDate = момент конца отдыха → система сама ре-рендерит карточку и показывает кнопку,
    // когда отдых истечёт (приложение в этот момент спит и апдейт прислать не может).
    let staleDate = next.phase == "rest" ? next.restEndsAt : nil
    await activity.update(ActivityContent(state: next, staleDate: staleDate))
    enqueueCompleteSet(defaults: defaults)
    try await syncRestNotification(for: next)
    return .result()
  }

  // Новый подход можно засчитать, если идёт активный подход, либо если отдых уже истёк.
  // После валидного тапа next-состояние получает restEndsAt в будущем → повторные тапы
  // отсекаются естественно (кнопка снова прячется до конца нового отдыха) — отдельный
  // pending-флаг для дебаунса не нужен.
  private func canAdvance(_ state: GymbarActivityAttributes.ContentState) -> Bool {
    if state.canCompleteSet { return true }
    if state.phase == "rest", let end = state.restEndsAt { return end <= Date() }
    return false
  }

  private func nextState(
    from current: GymbarActivityAttributes.ContentState
  ) -> GymbarActivityAttributes.ContentState {
    if current.setCurrent < current.setTotal {
      var next = current
      next.setCurrent += 1
      next.phase = "rest"
      next.restEndsAt = Date().addingTimeInterval(defaultRestSeconds)
      next.canCompleteSet = false
      return next
    }

    guard let nextExercise = current.upcomingExerciseNames.first else {
      var next = current
      next.phase = "active"
      next.restEndsAt = nil
      next.canCompleteSet = false
      return next
    }

    var next = current
    next.exerciseName = nextExercise
    next.setCurrent = 1
    next.setTotal = current.upcomingExerciseSetTotals.first ?? current.setTotal
    next.exerciseCurrent = min(current.exerciseTotal, current.exerciseCurrent + 1)
    next.phase = "active"
    next.restEndsAt = nil
    next.upcomingExerciseNames.removeFirst()
    if !next.upcomingExerciseSetTotals.isEmpty {
      next.upcomingExerciseSetTotals.removeFirst()
    }
    next.canCompleteSet = false
    return next
  }

  private func enqueueCompleteSet(defaults: UserDefaults) {
    var events = defaults.array(forKey: completeSetEventsKey) as? [Double] ?? []
    events.append(Date().timeIntervalSince1970 * 1_000)
    defaults.set(events, forKey: completeSetEventsKey)
    defaults.synchronize()

    CFNotificationCenterPostNotification(
      CFNotificationCenterGetDarwinNotifyCenter(),
      CFNotificationName(completeSetNotification as CFString),
      nil,
      nil,
      true
    )
  }

  private func syncRestNotification(
    for state: GymbarActivityAttributes.ContentState
  ) async throws {
    let center = UNUserNotificationCenter.current()
    let defaults = UserDefaults(suiteName: appGroupId)
    let previousId = defaults?.string(forKey: restNotificationIdKey)
    center.removePendingNotificationRequests(
      withIdentifiers: [previousId, restSoonNotificationId, restDoneNotificationId].compactMap { $0 }
    )
    defaults?.removeObject(forKey: restNotificationIdKey)

    guard
      state.phase == "rest",
      defaults?.bool(forKey: soundEnabledKey) == true,
      let restEndsAt = state.restEndsAt
    else { return }

    let doneContent = UNMutableNotificationContent()
    doneContent.title = "Отдых окончен"
    doneContent.body = "Пора начинать следующий подход"
    doneContent.sound = UNNotificationSound(
      named: UNNotificationSoundName(rawValue: "rest-done.wav")
    )
    doneContent.interruptionLevel = .timeSensitive
    doneContent.userInfo = ["kind": "rest_done"]

    let doneInterval = max(1, restEndsAt.timeIntervalSinceNow)
    let doneTrigger = UNTimeIntervalNotificationTrigger(timeInterval: doneInterval, repeats: false)
    let doneRequest = UNNotificationRequest(
      identifier: restDoneNotificationId,
      content: doneContent,
      trigger: doneTrigger
    )
    try await center.add(doneRequest)

    let preSignalSeconds = defaults?.integer(forKey: preSignalSecondsKey) ?? 0
    let soonInterval = restEndsAt.timeIntervalSinceNow - TimeInterval(preSignalSeconds)
    if preSignalSeconds > 0, soonInterval > 0 {
      let soonContent = UNMutableNotificationContent()
      soonContent.title = "Скоро подход"
      soonContent.body = "Приготовься"
      soonContent.sound = UNNotificationSound(
        named: UNNotificationSoundName(rawValue: "rest-soon.wav")
      )
      soonContent.interruptionLevel = .timeSensitive
      soonContent.userInfo = ["kind": "rest_soon"]

      let soonTrigger = UNTimeIntervalNotificationTrigger(
        timeInterval: max(1, soonInterval),
        repeats: false
      )
      let soonRequest = UNNotificationRequest(
        identifier: restSoonNotificationId,
        content: soonContent,
        trigger: soonTrigger
      )
      try await center.add(soonRequest)
    }

    defaults?.set(restDoneNotificationId, forKey: restNotificationIdKey)
  }
}
