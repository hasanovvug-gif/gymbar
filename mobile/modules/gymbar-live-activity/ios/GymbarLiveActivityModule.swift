import ActivityKit
import ExpoModulesCore

private let appGroupId = "group.com.gymbar.app"
private let completeSetEventsKey = "gymbar.completeSetEvents"
private let completeSetPendingKey = "gymbar.completeSetPending"
private let completeSetNotification = "com.gymbar.app.completeSet"
private let restNotificationIdKey = "gymbar.restNotificationId"
private let soundEnabledKey = "gymbar.soundEnabled"

struct GymbarActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var exerciseName: String
    var setCurrent: Int
    var setTotal: Int
    var exerciseCurrent: Int
    var exerciseTotal: Int
    var phase: String
    var restEndsAt: Date?
    var upcomingExerciseNames: [String]
    var upcomingExerciseSetTotals: [Int]
    var canCompleteSet: Bool
  }

  var sessionId: String
  var dayName: String
}

struct GymbarLiveActivityStateRecord: Record {
  @Field var sessionId = ""
  @Field var dayName = ""
  @Field var exerciseName = ""
  @Field var setCurrent = 1
  @Field var setTotal = 1
  @Field var exerciseCurrent = 1
  @Field var exerciseTotal = 1
  @Field var phase = "active"
  @Field var restEndsAt: Double?
  @Field var upcomingExerciseNames: [String] = []
  @Field var upcomingExerciseSetTotals: [Int] = []
  @Field var canCompleteSet = true
}

private func contentState(from record: GymbarLiveActivityStateRecord) -> GymbarActivityAttributes.ContentState {
  GymbarActivityAttributes.ContentState(
    exerciseName: record.exerciseName,
    setCurrent: record.setCurrent,
    setTotal: record.setTotal,
    exerciseCurrent: record.exerciseCurrent,
    exerciseTotal: record.exerciseTotal,
    phase: record.phase,
    restEndsAt: record.restEndsAt.map { Date(timeIntervalSince1970: $0 / 1_000) },
    upcomingExerciseNames: record.upcomingExerciseNames,
    upcomingExerciseSetTotals: record.upcomingExerciseSetTotals,
    canCompleteSet: record.canCompleteSet
  )
}

private func activityContent(from record: GymbarLiveActivityStateRecord) -> ActivityContent<GymbarActivityAttributes.ContentState> {
  let state = contentState(from: record)
  // staleDate = конец отдыха: система ре-рендерит карточку в этот момент, и виджет
  // сам покажет кнопку «Готово» по времени, пока приложение спит на locked screen.
  let staleDate = state.phase == "rest" ? state.restEndsAt : nil
  return ActivityContent(state: state, staleDate: staleDate)
}

private func completeSetDarwinCallback(
  _: CFNotificationCenter?,
  observer: UnsafeMutableRawPointer?,
  _: CFNotificationName?,
  _: UnsafeRawPointer?,
  _: CFDictionary?
) {
  guard let observer else { return }
  let module = Unmanaged<GymbarLiveActivityModule>.fromOpaque(observer).takeUnretainedValue()
  module.emitCompleteSet()
}

public final class GymbarLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("GymbarLiveActivity")
    Events("onCompleteSet")

    AsyncFunction("startLiveActivity") { (record: GymbarLiveActivityStateRecord) async throws -> String in
      guard ActivityAuthorizationInfo().areActivitiesEnabled else { return "" }
      let content = activityContent(from: record)

      if let current = Activity<GymbarActivityAttributes>.activities.first(
        where: { $0.attributes.sessionId == record.sessionId }
      ) {
        await current.update(content)
        return current.id
      }

      for activity in Activity<GymbarActivityAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }

      let attributes = GymbarActivityAttributes(sessionId: record.sessionId, dayName: record.dayName)
      let activity = try Activity.request(attributes: attributes, content: content)
      return activity.id
    }

    AsyncFunction("updateLiveActivity") { (record: GymbarLiveActivityStateRecord) async in
      let content = activityContent(from: record)
      guard let activity = Activity<GymbarActivityAttributes>.activities.first(
        where: { $0.attributes.sessionId == record.sessionId }
      ) else { return }
      await activity.update(content)
    }

    AsyncFunction("endLiveActivity") { () async in
      for activity in Activity<GymbarActivityAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }

    AsyncFunction("consumeCompleteSetEvents") { () -> [Double] in
      guard let defaults = UserDefaults(suiteName: appGroupId) else { return [] }
      let events = defaults.array(forKey: completeSetEventsKey) as? [Double] ?? []
      defaults.removeObject(forKey: completeSetEventsKey)
      defaults.removeObject(forKey: completeSetPendingKey)
      return events
    }

    Function("setSharedSoundEnabled") { (isEnabled: Bool) in
      UserDefaults(suiteName: appGroupId)?.set(isEnabled, forKey: soundEnabledKey)
    }

    Function("setRestNotificationIdentifier") { (identifier: String?) in
      let defaults = UserDefaults(suiteName: appGroupId)
      if let identifier {
        defaults?.set(identifier, forKey: restNotificationIdKey)
      } else {
        defaults?.removeObject(forKey: restNotificationIdKey)
      }
    }

    OnStartObserving {
      CFNotificationCenterAddObserver(
        CFNotificationCenterGetDarwinNotifyCenter(),
        Unmanaged.passUnretained(self).toOpaque(),
        completeSetDarwinCallback,
        completeSetNotification as CFString,
        nil,
        .deliverImmediately
      )
    }

    OnStopObserving {
      CFNotificationCenterRemoveObserver(
        CFNotificationCenterGetDarwinNotifyCenter(),
        Unmanaged.passUnretained(self).toOpaque(),
        CFNotificationName(completeSetNotification as CFString),
        nil
      )
    }
  }

  fileprivate func emitCompleteSet() {
    DispatchQueue.main.async { [weak self] in
      self?.sendEvent("onCompleteSet")
    }
  }
}
