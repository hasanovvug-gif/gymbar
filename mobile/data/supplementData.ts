import { Supplement, SupplementLog } from '@/types/supplement';

export const INITIAL_SUPPLEMENTS: Supplement[] = [
  { id: 'd3', name: 'Витамин D3', dose: '2000 МЕ', stock: 58, capacity: 90, stockUnit: 'капс', unitsPerDose: 1, schedule: ['morning'] },
  { id: 'omega', name: 'Омега-3', dose: '2 капс', stock: 9, capacity: 90, stockUnit: 'капс', unitsPerDose: 2, schedule: ['morning'] },
  { id: 'creatine', name: 'Креатин', dose: '5 г', stock: 4, capacity: 60, stockUnit: 'порции', unitsPerDose: 1, schedule: ['pre_workout'] },
  { id: 'caffeine', name: 'Кофеин', dose: '200 мг', stock: 45, capacity: 80, stockUnit: 'табл', unitsPerDose: 1, schedule: ['pre_workout'] },
  { id: 'magnesium', name: 'Магний', dose: '400 мг', stock: 34, capacity: 90, stockUnit: 'капс', unitsPerDose: 1, schedule: ['evening'] },
  { id: 'zinc', name: 'Цинк', dose: '25 мг', stock: 80, capacity: 90, stockUnit: 'табл', unitsPerDose: 1, schedule: ['evening'] },
];

export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createInitialSupplementLogs(): SupplementLog[] {
  const logs: SupplementLog[] = [];
  for (let offset = 14; offset >= 1; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const taken: Record<string, boolean> = {};
    INITIAL_SUPPLEMENTS.forEach((supplement) => {
      supplement.schedule.forEach((slot) => {
        taken[`${supplement.id}:${slot}`] = true;
      });
    });
    logs.push({ date: dateKey(date), taken });
  }
  logs.push({
    date: dateKey(),
    taken: { 'd3:morning': true, 'omega:morning': true, 'creatine:pre_workout': true },
  });
  return logs;
}
