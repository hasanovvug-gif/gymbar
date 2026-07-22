export const REASON_TAGS = ['Устал', 'Отвлёкся', 'Не хватило времени', 'Дискомфорт'] as const;

export type ReasonTag = (typeof REASON_TAGS)[number];
export type ExerciseStatus = 'pending' | 'completed' | 'skipped' | 'ended_early';
export type WorkoutPhase = 'active' | 'rest' | 'paused';

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  plannedSets: number;
  reps: number;
  weight: number;
  isTimeBased: boolean;
  secondsPerSet?: number;
};

export type WorkoutDay = {
  id: string;
  order: number;
  name: string;
  exercises: Exercise[];
};

export type ExerciseLog = {
  exerciseId: string;
  exerciseName: string;
  plannedSets: number;
  completedSets: number;
  reps: number;
  weight: number;
  isTimeBased: boolean;
  secondsPerSet?: number;
  status: ExerciseStatus;
  reasonTag?: ReasonTag;
};

export type PauseRecord = {
  startedAt: number;
  durationSeconds: number;
  reasonTag?: ReasonTag;
};

export type WorkoutSession = {
  id: string;
  date: string;
  dayId: string;
  dayName: string;
  activeSeconds: number;
  pausedSeconds: number;
  pauseCount: number;
  pauseRecords: PauseRecord[];
  exercises: ExerciseLog[];
  totalVolume: number;
};

export type ActiveWorkoutSession = {
  id: string;
  dayId: string;
  dayName: string;
  startedAt: number;
  activeStartedAt: number;
  activeSeconds: number;
  pausedSeconds: number;
  pauseCount: number;
  pauseStartedAt: number | null;
  pauseRecords: PauseRecord[];
  currentPauseReason?: ReasonTag;
  currentExerciseIndex: number;
  phase: WorkoutPhase;
  phaseBeforePause?: Exclude<WorkoutPhase, 'paused'>;
  restEndsAt: number | null;
  restSecondsOnPause?: number;
  exercises: ExerciseLog[];
};
