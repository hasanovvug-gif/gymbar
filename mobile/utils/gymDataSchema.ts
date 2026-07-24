import { CompositionItem, Supplement, SupplementForm, SupplementLog, SupplementSlot, SUPPLEMENT_FORMS } from '@/types/supplement';
import { Exercise, ExerciseLog, PauseRecord, WorkoutDay, WorkoutSession } from '@/types/workout';

// Время приёма живёт глобально на слот, а не у каждой добавки: pre_workout привязан к старту
// тренировки, поэтому часов не имеет.
export type ReminderSlot = 'morning' | 'evening';

export type Settings = {
  language: 'RU' | 'UA' | 'EN';
  theme: 'light' | 'dark';
  onboardingSeen: boolean;
  notificationsPrimerSeen: boolean;
  preSignalSeconds: number;
  slotTimes: Record<ReminderSlot, string>;
  notifications: Record<'workout' | 'supplements' | 'sound', boolean>;
};

export type GymData = {
  workoutDays: WorkoutDay[];
  history: WorkoutSession[];
  supplements: Supplement[];
  supplementLogs: SupplementLog[];
  settings: Settings;
};

export const initialSettings: Settings = {
  language: 'RU',
  theme: 'dark',
  onboardingSeen: false,
  notificationsPrimerSeen: false,
  preSignalSeconds: 15,
  slotTimes: { morning: '08:00', evening: '21:00' },
  notifications: { workout: true, supplements: true, sound: true },
};

const validSlots = new Set<SupplementSlot>(['morning', 'pre_workout', 'evening']);
const validForms = new Set<SupplementForm>(SUPPLEMENT_FORMS);
const validStatuses = new Set(['pending', 'completed', 'skipped', 'ended_early']);
const validReasons = new Set(['Устал', 'Отвлёкся', 'Не хватило времени', 'Дискомфорт']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const optionalString = (value: unknown) => value === undefined || isString(value);
const optionalNumber = (value: unknown) => value === undefined || isNumber(value);

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const isSlotTime = (value: unknown): value is string => isString(value) && TIME_PATTERN.test(value);

function isExercise(value: unknown): value is Exercise {
  if (!isRecord(value)) return false;
  return isString(value.id) && isString(value.name) && optionalString(value.nameKey)
    && isString(value.muscleGroup) && optionalString(value.muscleGroupKey)
    && isNumber(value.plannedSets) && isNumber(value.reps) && isNumber(value.weight)
    && isBoolean(value.isTimeBased) && optionalNumber(value.secondsPerSet);
}

function isWorkoutDay(value: unknown): value is WorkoutDay {
  return isRecord(value) && isString(value.id) && isNumber(value.order) && isString(value.name)
    && optionalString(value.nameKey) && Array.isArray(value.exercises) && value.exercises.every(isExercise);
}

function isExerciseLog(value: unknown): value is ExerciseLog {
  if (!isRecord(value)) return false;
  return isString(value.exerciseId) && isString(value.exerciseName) && optionalString(value.exerciseNameKey)
    && isNumber(value.plannedSets) && isNumber(value.completedSets) && isNumber(value.reps)
    && isNumber(value.weight) && isBoolean(value.isTimeBased) && optionalNumber(value.secondsPerSet)
    && isString(value.status) && validStatuses.has(value.status)
    && (value.reasonTag === undefined || (isString(value.reasonTag) && validReasons.has(value.reasonTag)));
}

function isPauseRecord(value: unknown): value is PauseRecord {
  return isRecord(value) && isNumber(value.startedAt) && isNumber(value.durationSeconds)
    && (value.reasonTag === undefined || (isString(value.reasonTag) && validReasons.has(value.reasonTag)));
}

function isWorkoutSession(value: unknown): value is WorkoutSession {
  if (!isRecord(value)) return false;
  return isString(value.id) && isString(value.date) && isString(value.dayId) && isString(value.dayName)
    && optionalString(value.dayNameKey) && isNumber(value.activeSeconds) && isNumber(value.pausedSeconds)
    && isNumber(value.pauseCount) && (value.pauseRecords === undefined
      || (Array.isArray(value.pauseRecords) && value.pauseRecords.every(isPauseRecord)))
    && Array.isArray(value.exercises) && value.exercises.every(isExerciseLog) && isNumber(value.totalVolume);
}

function isCompositionItem(value: unknown): value is CompositionItem {
  return isRecord(value) && isString(value.name) && optionalNumber(value.amount)
    && optionalString(value.unit) && (value.perServing === undefined || isBoolean(value.perServing));
}

function isSupplement(value: unknown): value is Supplement {
  if (!isRecord(value)) return false;
  return isString(value.id) && isString(value.name) && optionalString(value.nameKey)
    && isString(value.dose) && optionalString(value.doseKey) && isNumber(value.stock)
    && isNumber(value.capacity) && isString(value.stockUnit) && optionalString(value.stockUnitKey)
    && (value.unitsPerDose === undefined || isNumber(value.unitsPerDose))
    && Array.isArray(value.schedule) && value.schedule.every((slot) => isString(slot) && validSlots.has(slot as SupplementSlot))
    // Аддитивные поля AI-ввода
    && optionalString(value.brand) && optionalString(value.seller) && optionalString(value.sourceUrl)
    && optionalString(value.note) && optionalNumber(value.servingsPerContainer)
    && (value.form === undefined || (isString(value.form) && validForms.has(value.form as SupplementForm)))
    && (value.composition === undefined || (Array.isArray(value.composition) && value.composition.every(isCompositionItem)))
    && (value.photos === undefined || (Array.isArray(value.photos) && value.photos.every(isString)))
    && (value.createdBy === undefined || value.createdBy === 'manual' || value.createdBy === 'ai');
}

function isSupplementLog(value: unknown): value is SupplementLog {
  return isRecord(value) && isString(value.date) && isRecord(value.taken)
    && Object.values(value.taken).every(isBoolean);
}

function isSettings(value: unknown): value is Partial<Settings> {
  if (!isRecord(value)) return false;
  const notifications = value.notifications;
  const slotTimes = value.slotTimes;
  return (value.language === undefined || value.language === 'RU' || value.language === 'UA' || value.language === 'EN')
    && (value.theme === undefined || value.theme === 'light' || value.theme === 'dark')
    && (value.onboardingSeen === undefined || isBoolean(value.onboardingSeen))
    && (value.notificationsPrimerSeen === undefined || isBoolean(value.notificationsPrimerSeen))
    && (value.preSignalSeconds === undefined || isNumber(value.preSignalSeconds))
    && (slotTimes === undefined || (isRecord(slotTimes)
      && (slotTimes.morning === undefined || isString(slotTimes.morning))
      && (slotTimes.evening === undefined || isString(slotTimes.evening))))
    && (notifications === undefined || (isRecord(notifications)
      && (notifications.workout === undefined || isBoolean(notifications.workout))
      && (notifications.supplements === undefined || isBoolean(notifications.supplements))
      && (notifications.sound === undefined || isBoolean(notifications.sound))));
}

export function normalizeSettings(settings: Partial<Settings> | undefined): Settings {
  const preSignalSeconds = settings?.preSignalSeconds;
  const slotTimes = settings?.slotTimes;
  return {
    ...initialSettings,
    ...settings,
    preSignalSeconds: preSignalSeconds !== undefined && [0, 10, 15, 20].includes(preSignalSeconds)
      ? preSignalSeconds
      : initialSettings.preSignalSeconds,
    slotTimes: {
      morning: isSlotTime(slotTimes?.morning) ? slotTimes.morning : initialSettings.slotTimes.morning,
      evening: isSlotTime(slotTimes?.evening) ? slotTimes.evening : initialSettings.slotTimes.evening,
    },
    notifications: { ...initialSettings.notifications, ...settings?.notifications },
  };
}

export function normalizeGymData(data: Omit<GymData, 'settings'> & { settings: Partial<Settings> }): GymData {
  return {
    workoutDays: data.workoutDays,
    history: data.history.map((session) => ({ ...session, pauseRecords: session.pauseRecords ?? [] })),
    supplements: data.supplements.map((supplement) => ({ ...supplement, unitsPerDose: supplement.unitsPerDose ?? 1 })),
    supplementLogs: data.supplementLogs,
    settings: normalizeSettings(data.settings),
  };
}

export function parseGymData(value: unknown): GymData | null {
  if (!isRecord(value) || !Array.isArray(value.workoutDays) || !Array.isArray(value.history)
    || !Array.isArray(value.supplements) || !Array.isArray(value.supplementLogs) || !isSettings(value.settings)
    || !value.workoutDays.every(isWorkoutDay) || !value.history.every(isWorkoutSession)
    || !value.supplements.every(isSupplement) || !value.supplementLogs.every(isSupplementLog)) return null;

  return normalizeGymData({
    workoutDays: value.workoutDays,
    history: value.history,
    supplements: value.supplements,
    supplementLogs: value.supplementLogs,
    settings: value.settings,
  });
}

export function parseCloudConfig(value: unknown): Pick<GymData, 'settings' | 'supplements' | 'workoutDays'> | null {
  if (!isRecord(value) || !isSettings(value.settings) || !Array.isArray(value.supplements)
    || !Array.isArray(value.workoutDays) || !value.supplements.every(isSupplement) || !value.workoutDays.every(isWorkoutDay)) return null;
  const normalized = normalizeGymData({
    settings: value.settings,
    supplements: value.supplements,
    workoutDays: value.workoutDays,
    history: [],
    supplementLogs: [],
  });
  return { settings: normalized.settings, supplements: normalized.supplements, workoutDays: normalized.workoutDays };
}
