import ActivityKit
import Foundation

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
