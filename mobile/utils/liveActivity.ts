import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  GymbarLiveActivity,
  LiveActivityState,
} from '@/modules/gymbar-live-activity';
import { ActiveWorkoutSession } from '@/types/workout';

const REST_SOON_NOTIFICATION_ID = 'gymbar-rest-soon';
const REST_DONE_NOTIFICATION_ID = 'gymbar-rest-done';
const REST_SOON_SOUND = 'rest-soon.wav';
const REST_DONE_SOUND = 'rest-done.wav';

let activitySessionId: string | null = null;
let scheduledKey: string | null = null;

if (Platform.OS === 'ios') {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const kind = notification.request.content.data?.kind;
      const isRestNotification = kind === 'rest_soon' || kind === 'rest_done';
      return {
        shouldPlaySound: !isRestNotification,
        shouldSetBadge: false,
        shouldShowBanner: !isRestNotification,
        shouldShowList: !isRestNotification,
      };
    },
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
  await Promise.all([REST_SOON_NOTIFICATION_ID, REST_DONE_NOTIFICATION_ID].map((identifier) =>
    Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
  ));
  scheduledKey = null;
  GymbarLiveActivity?.setRestNotificationIdentifier(null);
}

async function scheduleRestNotification(restEndsAt: number, preSignalSeconds: number) {
  const nextScheduledKey = `${restEndsAt}:${preSignalSeconds}`;
  if (scheduledKey === nextScheduledKey) return;
  await cancelRestNotification();
  if (restEndsAt <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: REST_DONE_NOTIFICATION_ID,
    content: {
      title: 'Отдых окончен',
      body: 'Пора начинать следующий подход',
      sound: REST_DONE_SOUND,
      interruptionLevel: 'timeSensitive',
      data: { kind: 'rest_done' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: restEndsAt,
    },
  });

  const restSoonAt = restEndsAt - preSignalSeconds * 1_000;
  if (preSignalSeconds > 0 && restSoonAt > Date.now()) {
    await Notifications.scheduleNotificationAsync({
      identifier: REST_SOON_NOTIFICATION_ID,
      content: {
        title: 'Скоро подход',
        body: 'Приготовься',
        sound: REST_SOON_SOUND,
        interruptionLevel: 'timeSensitive',
        data: { kind: 'rest_soon' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: restSoonAt,
      },
    });
  }

  scheduledKey = nextScheduledKey;
  GymbarLiveActivity?.setRestNotificationIdentifier(REST_DONE_NOTIFICATION_ID);
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
  preSignalSeconds: number,
) {
  if (Platform.OS !== 'ios') return;
  GymbarLiveActivity?.setSharedSoundEnabled(soundEnabled);
  GymbarLiveActivity?.setPreSignalSeconds(preSignalSeconds);

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
    await scheduleRestNotification(session.restEndsAt, preSignalSeconds);
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
