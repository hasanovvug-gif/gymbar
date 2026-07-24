import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { useGymStore } from '@/store/useGymStore';
import {
  addCompleteSetListener,
  consumeCompleteSetEvents,
  syncWorkoutLiveActivity,
} from '@/utils/liveActivity';

let reconciliation: Promise<void> = Promise.resolve();
let synchronization: Promise<void> = Promise.resolve();
const DEFAULT_REST_MS = 90_000;

async function reconcileCompleteSetEvents() {
  if (useGymStore.getState().activeSession?.phase === 'paused') return;

  const events = await consumeCompleteSetEvents();
  for (const eventAt of events) {
    const state = useGymStore.getState();
    if (state.activeSession?.phase !== 'active') continue;

    state.completeSet();
    const reconciled = useGymStore.getState();
    if (reconciled.activeSession?.phase !== 'rest' || !reconciled.activeSession.restEndsAt) continue;

    const intendedRestEndsAt = eventAt + DEFAULT_REST_MS;
    if (intendedRestEndsAt <= Date.now()) {
      reconciled.endRest();
    } else {
      reconciled.addRestTime(
        Math.round((intendedRestEndsAt - reconciled.activeSession.restEndsAt) / 1_000),
      );
    }
  }
}

function queueReconciliation() {
  reconciliation = reconciliation
    .then(reconcileCompleteSetEvents)
    .catch(() => undefined);
}

function queueSynchronization(
  activeSession: ReturnType<typeof useGymStore.getState>['activeSession'],
  soundEnabled: boolean,
  preSignalSeconds: number,
) {
  synchronization = synchronization
    .then(() => syncWorkoutLiveActivity(activeSession, soundEnabled, preSignalSeconds))
    .catch(() => undefined);
}

export function useLiveActivity() {
  const activeSession = useGymStore((state) => state.activeSession);
  const soundEnabled = useGymStore((state) => state.settings.notifications.sound);
  const preSignalSeconds = useGymStore((state) => state.settings.preSignalSeconds);

  useEffect(() => {
    queueSynchronization(activeSession, soundEnabled, preSignalSeconds);
  }, [activeSession, soundEnabled, preSignalSeconds]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    queueReconciliation();

    const intentSubscription = addCompleteSetListener(queueReconciliation);
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') queueReconciliation();
    });

    return () => {
      intentSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);
}
