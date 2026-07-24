import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useGymStore } from '@/store/useGymStore';
import {
  buildSupplementReminders,
  countScheduledSupplementNotifications,
  getNotificationStatus,
  notificationsSupported,
  syncSupplementNotifications,
} from '@/utils/supplementNotifications';

let synchronization: Promise<unknown> = Promise.resolve();

function queueSync() {
  const state = useGymStore.getState();
  synchronization = synchronization
    .then(() => syncSupplementNotifications(state.supplements, state.settings))
    .catch(() => undefined);
  return synchronization;
}

/** Планирует напоминания и при возврате в приложение сверяется с системой. */
export function useSupplementNotifications() {
  const supplements = useGymStore((state) => state.supplements);
  const settings = useGymStore((state) => state.settings);
  const hasHydrated = useGymStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    void queueSync();
  }, [hasHydrated, supplements, settings]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && useGymStore.getState().hasHydrated) void queueSync();
    });
    return () => subscription.remove();
  }, []);
}

/** Число реально запланированных в системе напоминаний — для строки статуса в Настройках. */
export function useScheduledSupplementCount() {
  const supplements = useGymStore((state) => state.supplements);
  const settings = useGymStore((state) => state.settings);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    if (!notificationsSupported) {
      setCount(buildSupplementReminders(supplements, settings).length);
      return;
    }
    // Эффекты детей срабатывают раньше родительских, поэтому считаем не «после чужой» синхронизации,
    // а после собственной — иначе строка статуса отставала бы на одно изменение.
    void queueSync()
      .then(countScheduledSupplementNotifications)
      .then((value) => { if (active) setCount(value); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [supplements, settings]);

  return count;
}

/** Разрешения системы: проверяем при открытии экрана и при возврате из системных настроек. */
export function useNotificationsGranted() {
  const [granted, setGranted] = useState(true);

  useEffect(() => {
    if (!notificationsSupported) return;
    let active = true;
    const refresh = () => {
      void getNotificationStatus()
        .then((status) => { if (active) setGranted(status.granted && status.allowsSound); })
        .catch(() => undefined);
    };
    refresh();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refresh();
    });
    return () => { active = false; subscription.remove(); };
  }, []);

  return granted;
}
