import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  GymbarLiveActivity,
  LiveActivityState,
} from '@/modules/gymbar-live-activity';
import { ActiveWorkoutSession } from '@/types/workout';

const NATIVE_REST_NOTIFICATION_ID = 'gymbar-rest-done';
const REST_SOUND = 'rest-done.wav';

let activitySessionId: string | null = null;
let scheduledRestEndsAt: number | null = null;
let scheduledNotificationId: string | null = null;

if (Platform.OS === 'ios') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
  });
}

function createLiveActivityState(session: ActiveWorkoutSession): LiveActivityState | null {
  const exercise = session.exercises[session.currentExerciseIndex];
  if (!exercise) return null;

  const upcomingExerciseNames = session.exercises
    .slice(session.currentExerciseIndex + 1)
    .filter((item) => item.status === 'pending')
    .map((item) => item.exerciseName);
  const upcomingExerciseSetTotals = session.exercises
    .slice(session.currentExerciseIndex + 1)
    .filter((item) => item.status === 'pending')
    .map((item) => item.plannedSets);

  return {
    sessionId: session.id,
    dayName: session.dayName,
    exerciseName: exercise.exerciseName,
    setCurrent: Math.min(exercise.plannedSets, exercise.completedSets + 1),
    setTotal: exercise.plannedSets,
    exerciseCurrent: session.currentExerciseIndex + 1,
    exerciseTotal: session.exercises.length,
    phase: session.phase,
    restEndsAt: session.restEndsAt ?? undefined,
    upcomingExerciseNames,
    upcomingExerciseSetTotals,
    canCompleteSet: session.phase === 'active' && exercise.status === 'pending',
  };
}

async function cancelRestNotification() {
  const identifiers = [scheduledNotificationId, NATIVE_REST_NOTIFICATION_ID].filter(
    (identifier): identifier is string => Boolean(identifier),
  );
  await Promise.all(identifiers.map((identifier) =>
    Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
  ));
  scheduledNotificationId = null;
  scheduledRestEndsAt = null;
  GymbarLiveActivity?.setRestNotificationIdentifier(null);
}

async function scheduleRestNotification(restEndsAt: number) {
  if (scheduledRestEndsAt === restEndsAt) return;
  await cancelRestNotification();
  if (restEndsAt <= Date.now()) return;

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Отдых окончен',
      body: 'Пора начинать следующий подход',
      sound: REST_SOUND,
      interruptionLevel: 'timeSensitive',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: restEndsAt,
    },
  });
  scheduledNotificationId = identifier;
  scheduledRestEndsAt = restEndsAt;
  GymbarLiveActivity?.setRestNotificationIdentifier(identifier);
}

export async function requestWorkoutNotificationPermission() {
  if (Platform.OS !== 'ios') return;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return;
  if (current.canAskAgain) {
    await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
  }
}

export async function syncWorkoutLiveActivity(
  session: ActiveWorkoutSession | null,
  soundEnabled: boolean,
) {
  if (Platform.OS !== 'ios') return;
  GymbarLiveActivity?.setSharedSoundEnabled(soundEnabled);

  if (!session) {
    activitySessionId = null;
    await Promise.all([
      GymbarLiveActivity?.endLiveActivity(),
      cancelRestNotification(),
    ]);
    return;
  }

  const state = createLiveActivityState(session);
  if (!state) return;

  if (activitySessionId !== session.id) {
    await requestWorkoutNotificationPermission().catch(() => undefined);
    await GymbarLiveActivity?.startLiveActivity(state);
    activitySessionId = session.id;
  } else {
    await GymbarLiveActivity?.updateLiveActivity(state);
  }

  if (session.phase === 'rest' && session.restEndsAt && soundEnabled) {
    await scheduleRestNotification(session.restEndsAt);
  } else {
    await cancelRestNotification();
  }
}

export function addCompleteSetListener(listener: () => void) {
  return GymbarLiveActivity?.addListener('onCompleteSet', listener) ?? { remove: () => undefined };
}

export async function consumeCompleteSetEvents() {
  if (Platform.OS !== 'ios') return [];
  return await GymbarLiveActivity?.consumeCompleteSetEvents() ?? [];
}
