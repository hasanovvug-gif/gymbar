import { WorkoutDay, WorkoutSession } from '@/types/workout';

export const INITIAL_WORKOUT_DAYS: WorkoutDay[] = [
  {
    id: 'day-chest',
    order: 0,
    name: 'Грудь и трицепс',
    exercises: [
      { id: 'bench', name: 'Жим лёжа', muscleGroup: 'Грудь', plannedSets: 4, reps: 10, weight: 80, isTimeBased: false },
      { id: 'incline', name: 'Жим гантелей на наклонной', muscleGroup: 'Грудь', plannedSets: 3, reps: 10, weight: 28, isTimeBased: false },
      { id: 'flyes', name: 'Разводка гантелей', muscleGroup: 'Грудь', plannedSets: 3, reps: 12, weight: 16, isTimeBased: false },
      { id: 'close-grip', name: 'Жим узким хватом', muscleGroup: 'Трицепс', plannedSets: 3, reps: 10, weight: 50, isTimeBased: false },
      { id: 'pushdown', name: 'Разгибание на блоке', muscleGroup: 'Трицепс', plannedSets: 3, reps: 12, weight: 25, isTimeBased: false },
      { id: 'french', name: 'Французский жим', muscleGroup: 'Трицепс', plannedSets: 3, reps: 10, weight: 24, isTimeBased: false },
    ],
  },
  {
    id: 'day-back',
    order: 1,
    name: 'Спина и бицепс',
    exercises: [
      { id: 'pullups', name: 'Подтягивания', muscleGroup: 'Спина', plannedSets: 4, reps: 8, weight: 0, isTimeBased: false },
      { id: 'barbell-row', name: 'Тяга штанги в наклоне', muscleGroup: 'Спина', plannedSets: 3, reps: 10, weight: 60, isTimeBased: false },
      { id: 'lat-pulldown', name: 'Тяга верхнего блока', muscleGroup: 'Спина', plannedSets: 3, reps: 12, weight: 55, isTimeBased: false },
      { id: 'barbell-curl', name: 'Подъём штанги на бицепс', muscleGroup: 'Бицепс', plannedSets: 3, reps: 10, weight: 30, isTimeBased: false },
      { id: 'hammer-curl', name: 'Молотки', muscleGroup: 'Бицепс', plannedSets: 3, reps: 12, weight: 14, isTimeBased: false },
      { id: 'plank', name: 'Планка', muscleGroup: 'Кор', plannedSets: 3, reps: 1, weight: 0, isTimeBased: true, secondsPerSet: 60 },
    ],
  },
  {
    id: 'day-legs',
    order: 2,
    name: 'Ноги',
    exercises: [
      { id: 'squat', name: 'Приседания', muscleGroup: 'Ноги', plannedSets: 4, reps: 8, weight: 90, isTimeBased: false },
      { id: 'leg-press', name: 'Жим ногами', muscleGroup: 'Ноги', plannedSets: 3, reps: 12, weight: 140, isTimeBased: false },
      { id: 'leg-extension', name: 'Разгибание ног', muscleGroup: 'Ноги', plannedSets: 3, reps: 12, weight: 45, isTimeBased: false },
      { id: 'leg-curl', name: 'Сгибание ног', muscleGroup: 'Ноги', plannedSets: 3, reps: 12, weight: 40, isTimeBased: false },
      { id: 'calves', name: 'Подъём на носки', muscleGroup: 'Икры', plannedSets: 4, reps: 15, weight: 70, isTimeBased: false },
    ],
  },
  {
    id: 'day-shoulders',
    order: 3,
    name: 'Плечи и пресс',
    exercises: [
      { id: 'shoulder-press', name: 'Жим над головой', muscleGroup: 'Плечи', plannedSets: 4, reps: 8, weight: 45, isTimeBased: false },
      { id: 'lateral-raise', name: 'Разведение гантелей', muscleGroup: 'Плечи', plannedSets: 3, reps: 15, weight: 10, isTimeBased: false },
      { id: 'rear-delt', name: 'Задняя дельта', muscleGroup: 'Плечи', plannedSets: 3, reps: 15, weight: 12, isTimeBased: false },
      { id: 'crunch', name: 'Скручивания', muscleGroup: 'Пресс', plannedSets: 3, reps: 20, weight: 0, isTimeBased: false },
      { id: 'side-plank', name: 'Боковая планка', muscleGroup: 'Кор', plannedSets: 3, reps: 1, weight: 0, isTimeBased: true, secondsPerSet: 45 },
    ],
  },
];

export const INITIAL_HISTORY: WorkoutSession[] = [
  {
    id: 'history-1',
    date: '2026-07-20T16:20:00.000Z',
    dayId: 'day-chest',
    dayName: 'Грудь и трицепс',
    activeSeconds: 38 * 60,
    pausedSeconds: 14 * 60,
    pauseCount: 2,
    pauseRecords: [
      { startedAt: Date.parse('2026-07-20T16:35:00.000Z'), durationSeconds: 6 * 60, reasonTag: 'Устал' },
      { startedAt: Date.parse('2026-07-20T16:54:00.000Z'), durationSeconds: 8 * 60 },
    ],
    totalVolume: 8340,
    exercises: [
      { exerciseId: 'bench', exerciseName: 'Жим лёжа', plannedSets: 4, completedSets: 4, reps: 10, weight: 80, isTimeBased: false, status: 'completed' },
      { exerciseId: 'incline', exerciseName: 'Жим гантелей на наклонной', plannedSets: 3, completedSets: 3, reps: 10, weight: 28, isTimeBased: false, status: 'completed' },
      { exerciseId: 'flyes', exerciseName: 'Разводка гантелей', plannedSets: 3, completedSets: 2, reps: 12, weight: 16, isTimeBased: false, status: 'ended_early', reasonTag: 'Устал' },
      { exerciseId: 'french', exerciseName: 'Французский жим', plannedSets: 3, completedSets: 0, reps: 10, weight: 24, isTimeBased: false, status: 'skipped', reasonTag: 'Не хватило времени' },
    ],
  },
  {
    id: 'history-2',
    date: '2026-07-18T16:10:00.000Z',
    dayId: 'day-shoulders',
    dayName: 'Плечи и пресс',
    activeSeconds: 47 * 60,
    pausedSeconds: 0,
    pauseCount: 0,
    pauseRecords: [],
    totalVolume: 5120,
    exercises: [],
  },
  {
    id: 'history-3',
    date: '2026-07-16T16:30:00.000Z',
    dayId: 'day-legs',
    dayName: 'Ноги',
    activeSeconds: 53 * 60,
    pausedSeconds: 5 * 60,
    pauseCount: 1,
    pauseRecords: [{ startedAt: Date.parse('2026-07-16T17:02:00.000Z'), durationSeconds: 5 * 60, reasonTag: 'Отвлёкся' }],
    totalVolume: 11200,
    exercises: [],
  },
];
