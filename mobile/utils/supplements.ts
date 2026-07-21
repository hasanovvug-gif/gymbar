import { Supplement, SupplementLog, SupplementSlot } from '@/types/supplement';
import { dateKey } from '@/data/supplementData';

export const SLOT_LABELS: Record<SupplementSlot, string> = {
  morning: 'Утро',
  pre_workout: 'Перед тренировкой',
  evening: 'Вечер',
};

export function isDayComplete(supplements: Supplement[], log?: SupplementLog) {
  const scheduled = supplements.flatMap((supplement) => supplement.schedule.map((slot) => `${supplement.id}:${slot}`));
  return scheduled.length > 0 && scheduled.every((key) => log?.taken[key]);
}

export function calculateSupplementStreak(supplements: Supplement[], logs: SupplementLog[]) {
  let streak = 0;
  const today = new Date();
  const todayLog = logs.find((log) => log.date === dateKey(today));
  let offset = isDayComplete(supplements, todayLog) ? 0 : 1;
  while (offset < 366) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const log = logs.find((item) => item.date === dateKey(date));
    if (!isDayComplete(supplements, log)) break;
    streak += 1;
    offset += 1;
  }
  return streak;
}

export function adherenceForMonth(supplements: Supplement[], logs: SupplementLog[], year: number, month: number) {
  const today = new Date();
  const lastDay = year === today.getFullYear() && month === today.getMonth() ? today.getDate() : new Date(year, month + 1, 0).getDate();
  let planned = 0;
  let taken = 0;
  for (let day = 1; day <= lastDay; day += 1) {
    const log = logs.find((item) => item.date === dateKey(new Date(year, month, day)));
    supplements.forEach((supplement) => supplement.schedule.forEach((slot) => {
      planned += 1;
      if (log?.taken[`${supplement.id}:${slot}`]) taken += 1;
    }));
  }
  return planned === 0 ? 0 : Math.round((taken / planned) * 100);
}
