import { WorkoutDay, WorkoutSession } from '@/types/workout';

/**
 * Программа под набор массы, 4 дня: Пн грудь · Вт ноги · Чт спина · Пт плечи.
 * Повторы = верх диапазона: держим вес, пока все подходы не выйдут по этой цифре
 * два занятия подряд, затем добавляем вес и повторы просаживаются к низу — двойная прогрессия.
 */
export const INITIAL_WORKOUT_DAYS: WorkoutDay[] = [
  {
    id: 'day-chest',
    order: 0,
    name: 'Грудь и трицепс',
    nameKey: 'seed.dayChestTriceps',
    exercises: [
      { id: 'bench', name: 'Жим лёжа', nameKey: 'seed.exerciseBenchPress', muscleGroup: 'Грудь', muscleGroupKey: 'seed.muscleChest', plannedSets: 4, reps: 10, weight: 60, isTimeBased: false },
      { id: 'incline-barbell', name: 'Жим в наклоне, штанга', nameKey: 'seed.exerciseInclineBarbellPress', muscleGroup: 'Грудь', muscleGroupKey: 'seed.muscleChest', plannedSets: 3, reps: 12, weight: 40, isTimeBased: false },
      { id: 'flyes', name: 'Разводка гантелей', nameKey: 'seed.exerciseDumbbellFlyes', muscleGroup: 'Грудь', muscleGroupKey: 'seed.muscleChest', plannedSets: 3, reps: 15, weight: 8, isTimeBased: false },
      { id: 'cable-chest-press', name: 'Жим на низ груди, блок', nameKey: 'seed.exerciseCableChestPress', muscleGroup: 'Грудь', muscleGroupKey: 'seed.muscleChest', plannedSets: 2, reps: 15, weight: 30, isTimeBased: false },
      { id: 'french', name: 'Французский жим', nameKey: 'seed.exerciseFrenchPress', muscleGroup: 'Трицепс', muscleGroupKey: 'seed.muscleTriceps', plannedSets: 3, reps: 12, weight: 15, isTimeBased: false },
      { id: 'pushdown', name: 'Разгибание на блоке', nameKey: 'seed.exerciseCablePushdown', muscleGroup: 'Трицепс', muscleGroupKey: 'seed.muscleTriceps', plannedSets: 3, reps: 15, weight: 20, isTimeBased: false },
      { id: 'crunch', name: 'Скручивания', nameKey: 'seed.exerciseCrunch', muscleGroup: 'Пресс', muscleGroupKey: 'seed.muscleAbs', plannedSets: 3, reps: 20, weight: 0, isTimeBased: false },
    ],
  },
  {
    id: 'day-legs',
    order: 1,
    name: 'Ноги',
    nameKey: 'seed.dayLegs',
    exercises: [
      { id: 'squat', name: 'Приседания', nameKey: 'seed.exerciseSquat', muscleGroup: 'Ноги', muscleGroupKey: 'seed.muscleLegs', plannedSets: 4, reps: 10, weight: 60, isTimeBased: false },
      { id: 'rdl', name: 'Румынская тяга', nameKey: 'seed.exerciseRomanianDeadlift', muscleGroup: 'Задняя поверхность бедра', muscleGroupKey: 'seed.muscleHamstrings', plannedSets: 3, reps: 10, weight: 40, isTimeBased: false },
      { id: 'leg-curl', name: 'Сгибание ног', nameKey: 'seed.exerciseLegCurl', muscleGroup: 'Задняя поверхность бедра', muscleGroupKey: 'seed.muscleHamstrings', plannedSets: 3, reps: 15, weight: 10, isTimeBased: false },
      { id: 'leg-extension', name: 'Разгибание ног', nameKey: 'seed.exerciseLegExtension', muscleGroup: 'Ноги', muscleGroupKey: 'seed.muscleLegs', plannedSets: 3, reps: 15, weight: 30, isTimeBased: false },
      { id: 'calves', name: 'Подъём на носки', nameKey: 'seed.exerciseCalfRaise', muscleGroup: 'Икры', muscleGroupKey: 'seed.muscleCalves', plannedSets: 4, reps: 20, weight: 60, isTimeBased: false },
      { id: 'plank', name: 'Планка', nameKey: 'seed.exercisePlank', muscleGroup: 'Кор', muscleGroupKey: 'seed.muscleCore', plannedSets: 3, reps: 1, weight: 0, isTimeBased: true, secondsPerSet: 60 },
    ],
  },
  {
    id: 'day-back',
    order: 2,
    name: 'Спина и бицепс',
    nameKey: 'seed.dayBackBiceps',
    exercises: [
      { id: 'deadlift', name: 'Становая тяга', nameKey: 'seed.exerciseDeadlift', muscleGroup: 'Спина', muscleGroupKey: 'seed.muscleBack', plannedSets: 3, reps: 8, weight: 60, isTimeBased: false },
      { id: 'barbell-row', name: 'Тяга штанги в наклоне', nameKey: 'seed.exerciseBentOverBarbellRow', muscleGroup: 'Спина', muscleGroupKey: 'seed.muscleBack', plannedSets: 3, reps: 12, weight: 40, isTimeBased: false },
      { id: 'lat-pulldown', name: 'Тяга верхнего блока', nameKey: 'seed.exerciseLatPulldown', muscleGroup: 'Спина', muscleGroupKey: 'seed.muscleBack', plannedSets: 3, reps: 12, weight: 35, isTimeBased: false },
      { id: 'seated-row', name: 'Тяга к поясу сидя', nameKey: 'seed.exerciseSeatedCableRow', muscleGroup: 'Спина', muscleGroupKey: 'seed.muscleBack', plannedSets: 3, reps: 12, weight: 35, isTimeBased: false },
      { id: 'barbell-curl', name: 'Подъём штанги на бицепс', nameKey: 'seed.exerciseBarbellCurl', muscleGroup: 'Бицепс', muscleGroupKey: 'seed.muscleBiceps', plannedSets: 3, reps: 12, weight: 15, isTimeBased: false },
      { id: 'cable-curl', name: 'Сгибание на бицепс, блок', nameKey: 'seed.exerciseCableCurl', muscleGroup: 'Бицепс', muscleGroupKey: 'seed.muscleBiceps', plannedSets: 3, reps: 15, weight: 20, isTimeBased: false },
    ],
  },
  {
    id: 'day-shoulders',
    order: 3,
    name: 'Плечи и пресс',
    nameKey: 'seed.dayShouldersAbs',
    exercises: [
      { id: 'shoulder-press', name: 'Жим над головой', nameKey: 'seed.exerciseOverheadPress', muscleGroup: 'Плечи', muscleGroupKey: 'seed.muscleShoulders', plannedSets: 4, reps: 10, weight: 40, isTimeBased: false },
      { id: 'lateral-raise', name: 'Разведение гантелей', nameKey: 'seed.exerciseLateralRaise', muscleGroup: 'Плечи', muscleGroupKey: 'seed.muscleShoulders', plannedSets: 4, reps: 20, weight: 10, isTimeBased: false },
      { id: 'rear-delt', name: 'Задняя дельта', nameKey: 'seed.exerciseRearDelt', muscleGroup: 'Плечи', muscleGroupKey: 'seed.muscleShoulders', plannedSets: 3, reps: 20, weight: 10, isTimeBased: false },
      { id: 'pushdown-friday', name: 'Разгибание на блоке', nameKey: 'seed.exerciseCablePushdown', muscleGroup: 'Трицепс', muscleGroupKey: 'seed.muscleTriceps', plannedSets: 3, reps: 15, weight: 20, isTimeBased: false },
      { id: 'hyperextension', name: 'Гиперэкстензия', nameKey: 'seed.exerciseHyperextension', muscleGroup: 'Спина', muscleGroupKey: 'seed.muscleBack', plannedSets: 3, reps: 15, weight: 0, isTimeBased: false },
      { id: 'crunch-friday', name: 'Скручивания', nameKey: 'seed.exerciseCrunch', muscleGroup: 'Пресс', muscleGroupKey: 'seed.muscleAbs', plannedSets: 3, reps: 20, weight: 0, isTimeBased: false },
    ],
  },
];

export const INITIAL_HISTORY: WorkoutSession[] = [];
