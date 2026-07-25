import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { translate } from '@/i18n';
import { resolveDose, resolveName } from '@/i18n/displayName';
import { Supplement } from '@/types/supplement';
import { ReminderSlot, Settings } from '@/utils/gymDataSchema';

const REMINDER_SLOTS: ReminderSlot[] = ['morning', 'evening'];
const IDENTIFIER_PREFIX = 'gymbar-supplement-';
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

export type SupplementReminder = {
  slot: ReminderSlot;
  identifier: string;
  time: string;
  hour: number;
  minute: number;
  title: string;
  body: string;
};

export type NotificationStatus = {
  granted: boolean;
  allowsSound: boolean;
  canAskAgain: boolean;
};

/**
 * Одно уведомление на слот со списком «что + сколько» — так лимит iOS (~64 pending)
 * не зависит от количества добавок.
 */
export function buildSupplementReminders(
  supplements: Supplement[],
  settings: Settings,
): SupplementReminder[] {
  if (!settings.notifications.supplements) return [];
  const t = (key: Parameters<typeof translate>[1]) => translate(settings.language, key);

  return REMINDER_SLOTS.flatMap((slot) => {
    const items = supplements.filter((supplement) => supplement.schedule.includes(slot));
    if (items.length === 0) return [];

    const time = settings.slotTimes[slot];
    const [hour, minute] = time.split(':').map(Number);
    const body = items.map((item) => `${resolveName(item, t)} ${resolveDose(item, t)}`).join(', ');

    return [{
      slot,
      identifier: `${IDENTIFIER_PREFIX}${slot}`,
      time,
      hour,
      minute,
      // Время iOS показывает рядом сам, поэтому в заголовке важнее «о чём напоминание».
      title: `${t('supplements.title')} — ${t(slot === 'morning' ? 'supplements.morning' : 'supplements.evening').toLowerCase()}`,
      body,
    }];
  });
}

async function cancelSupplementNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled
    .filter((item) => item.content.data?.kind === 'supplement')
    .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier).catch(() => undefined)));
}

export async function getNotificationStatus(): Promise<NotificationStatus> {
  if (!supported) return { granted: false, allowsSound: false, canAskAgain: false };
  const permissions = await Notifications.getPermissionsAsync();
  const provisional = permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  return {
    granted: permissions.granted || provisional,
    allowsSound: permissions.ios?.allowsSound ?? permissions.granted,
    canAskAgain: permissions.canAskAgain,
  };
}

export async function requestNotificationPermission() {
  if (!supported) return false;
  const current = await getNotificationStatus();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const result = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return result.granted;
}

/**
 * Пересчёт целиком: снимаем все свои pending и планируем заново. Надёжнее хранения id —
 * расхождение с системой (переустановка, ручная отмена, смена языка) чинится само.
 */
export async function syncSupplementNotifications(supplements: Supplement[], settings: Settings) {
  if (!supported) return [];
  const reminders = buildSupplementReminders(supplements, settings);
  await cancelSupplementNotifications();

  if (reminders.length === 0) return [];
  const { granted } = await getNotificationStatus();
  if (!granted) return [];

  for (const reminder of reminders) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.identifier,
      content: {
        title: reminder.title,
        body: reminder.body,
        // Тумблер «Звук rest-таймера» — про сигнал отдыха, напоминание о добавках звучит всегда.
        sound: true,
        data: { kind: 'supplement', slot: reminder.slot },
      },
      // DAILY = wall-clock, без фиксированной таймзоны: переезд и переход на DST не сдвигают приём.
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
      },
    }).catch(() => undefined);
  }
  return reminders;
}

export async function countScheduledSupplementNotifications() {
  if (!supported) return 0;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  return scheduled.filter((item) => item.content.data?.kind === 'supplement').length;
}

export const notificationsSupported = supported;

export function shiftSlotTime(time: string, deltaMinutes: number) {
  const [hour, minute] = time.split(':').map(Number);
  const total = (hour * 60 + minute + deltaMinutes + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
