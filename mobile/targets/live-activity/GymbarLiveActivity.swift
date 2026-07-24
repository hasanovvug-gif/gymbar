import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

private let gymbarBackground = Color(red: 11 / 255, green: 12 / 255, blue: 14 / 255)
private let surface = Color(red: 20 / 255, green: 22 / 255, blue: 25 / 255)
private let primaryText = Color(red: 236 / 255, green: 238 / 255, blue: 240 / 255)
private let secondaryText = Color(red: 138 / 255, green: 144 / 255, blue: 150 / 255)
private let accent = Color(red: 200 / 255, green: 240 / 255, blue: 49 / 255)
private let warning = Color(red: 240 / 255, green: 160 / 255, blue: 46 / 255)

struct GymbarLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: GymbarActivityAttributes.self) { context in
      LockScreenView(context: context)
        .activityBackgroundTint(gymbarBackground)
        .activitySystemActionForegroundColor(accent)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Label(
            "\(context.state.exerciseCurrent)/\(context.state.exerciseTotal)",
            systemImage: "dumbbell.fill"
          )
          .font(.caption.bold())
          .foregroundStyle(accent)
        }
        DynamicIslandExpandedRegion(.trailing) {
          PhaseLabel(state: context.state, compact: true)
        }
        DynamicIslandExpandedRegion(.center) {
          Text(context.state.exerciseName)
            .font(.headline)
            .foregroundStyle(primaryText)
            .lineLimit(1)
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(spacing: 10) {
            HStack {
              Text("Подход \(context.state.setCurrent)/\(context.state.setTotal)")
                .font(.caption.weight(.semibold))
                .foregroundStyle(secondaryText)
              Spacer()
              CompleteSetButton(state: context.state)
            }
            RestProgress(state: context.state)
          }
        }
      } compactLeading: {
        Image(systemName: "dumbbell.fill")
          .foregroundStyle(accent)
      } compactTrailing: {
        PhaseLabel(state: context.state, compact: true)
          .frame(maxWidth: 54)
      } minimal: {
        MinimalPhaseLabel(state: context.state)
      }
      .keylineTint(accent)
      .widgetURL(URL(string: "gymtracker://workout-session"))
    }
  }
}

private struct LockScreenView: View {
  let context: ActivityViewContext<GymbarActivityAttributes>

  var body: some View {
    VStack(alignment: .leading, spacing: 14) {
      HStack(spacing: 8) {
        Image(systemName: "dumbbell.fill")
          .foregroundStyle(accent)
        Text(context.attributes.dayName.uppercased())
          .font(.caption.weight(.bold))
          .tracking(0.8)
          .foregroundStyle(secondaryText)
          .lineLimit(1)
        Spacer()
        Text("Упражнение \(context.state.exerciseCurrent)/\(context.state.exerciseTotal)")
          .font(.caption.weight(.semibold))
          .foregroundStyle(secondaryText)
      }

      Text(context.state.exerciseName)
        .font(.title3.weight(.bold))
        .foregroundStyle(primaryText)
        .lineLimit(1)

      HStack(alignment: .center, spacing: 16) {
        VStack(alignment: .leading, spacing: 4) {
          Text("Подход \(context.state.setCurrent)/\(context.state.setTotal)")
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(primaryText)
          PhaseLabel(state: context.state, compact: false)
        }
        Spacer()
        CompleteSetButton(state: context.state)
      }

      RestProgress(state: context.state)
    }
    .padding(18)
    .background(gymbarBackground)
    .widgetURL(URL(string: "gymtracker://workout-session"))
  }
}

private struct PhaseLabel: View {
  let state: GymbarActivityAttributes.ContentState
  let compact: Bool

  var body: some View {
    if state.phase == "rest", let end = state.restEndsAt {
      Text(timerInterval: Date.now...max(end, Date.now), countsDown: true)
        .font(compact ? .caption.monospacedDigit().bold() : .title2.monospacedDigit().bold())
        .foregroundStyle(warning)
    } else if state.phase == "paused" {
      Text("Пауза")
        .font(compact ? .caption.bold() : .subheadline.bold())
        .foregroundStyle(warning)
    } else {
      Text(compact ? "•" : "Идёт подход")
        .font(compact ? .headline : .subheadline.weight(.semibold))
        .foregroundStyle(accent)
    }
  }
}

private struct MinimalPhaseLabel: View {
  let state: GymbarActivityAttributes.ContentState

  var body: some View {
    if state.phase == "rest", let end = state.restEndsAt {
      Text(timerInterval: Date.now...max(end, Date.now), countsDown: true)
        .font(.caption2.monospacedDigit().bold())
        .foregroundStyle(warning)
    } else {
      Text(state.phase == "paused" ? "Ⅱ" : "•")
        .font(.headline)
        .foregroundStyle(state.phase == "paused" ? warning : accent)
    }
  }
}

private struct RestProgress: View {
  let state: GymbarActivityAttributes.ContentState

  var body: some View {
    if state.phase == "rest", let end = state.restEndsAt {
      ProgressView(timerInterval: Date.now...max(end, Date.now), countsDown: true)
        .tint(warning)
    } else {
      ProgressView(
        value: Double(max(0, state.setCurrent - 1)),
        total: Double(max(1, state.setTotal))
      )
      .tint(accent)
    }
  }
}

private struct CompleteSetButton: View {
  let state: GymbarActivityAttributes.ContentState

  // Кнопка видна в активном подходе и когда отдых уже истёк. Date.now вычисляется в момент
  // рендера виджета; система ре-рендерит по staleDate (= restEndsAt), поэтому кнопка сама
  // появляется в конце отдыха, пока приложение спит на locked screen.
  private var canComplete: Bool {
    if state.canCompleteSet { return true }
    if state.phase == "rest", let end = state.restEndsAt { return end <= Date.now }
    return false
  }

  @ViewBuilder
  var body: some View {
    if canComplete {
      if #available(iOSApplicationExtension 17.0, *) {
        Button(intent: CompleteSetIntent()) {
          Text("Готово")
            .font(.caption.weight(.heavy))
            .foregroundStyle(gymbarBackground)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(accent, in: Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Завершить подход")
      }
    } else {
      Text(state.phase == "rest" ? "Отдых" : state.phase == "paused" ? "Пауза" : "Засчитано")
        .font(.caption.weight(.bold))
        .foregroundStyle(accent)
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(surface, in: Capsule())
    }
  }
}
