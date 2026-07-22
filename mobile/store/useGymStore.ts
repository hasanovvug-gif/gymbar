import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { createInitialSupplementLogs, dateKey, INITIAL_SUPPLEMENTS } from '@/data/supplementData';
import { INITIAL_HISTORY, INITIAL_WORKOUT_DAYS } from '@/data/workoutData';
import { Supplement, SupplementLog, SupplementSlot } from '@/types/supplement';
import {
  ActiveWorkoutSession,
  Exercise,
  ReasonTag,
  WorkoutDay,
  WorkoutSession,
} from '@/types/workout';

type Language = 'RU' | 'UA' | 'EN';
type ThemeChoice = 'light' | 'dark';
type NotificationKey = 'workout' | 'supplements' | 'sound';

type Settings = {
  language: Language;
  theme: ThemeChoice;
  notifications: Record<NotificationKey, boolean>;
};

type GymState = {
  workoutDays: WorkoutDay[];
  history: WorkoutSession[];
  activeSession: ActiveWorkoutSession | null;
  recentSessionId: string | null;
  supplements: Supplement[];
  supplementLogs: SupplementLog[];
  settings: Settings;
  startWorkout: (dayId: string) => void;
  adjustWeight: (delta: number) => void;
  completeSet: () => void;
  endRest: () => void;
  addRestTime: (seconds: number) => void;
  pauseWorkout: () => void;
  setPauseReason: (reason?: ReasonTag) => void;
  resumeWorkout: () => void;
  selectExercise: (index: number) => void;
  resolveExercise: (status: 'skipped' | 'ended_early', reason?: ReasonTag) => void;
  finishWorkout: () => string | null;
  updateDay: (dayId: string, changes: Partial<Pick<WorkoutDay, 'name'>>) => void;
  addDay: () => void;
  removeDay: (dayId: string) => void;
  moveDay: (dayId: string, direction: -1 | 1) => void;
  addExercise: (dayId: string) => void;
  updateExercise: (dayId: string, exerciseId: string, changes: Partial<Exercise>) => void;
  removeExercise: (dayId: string, exerciseId: string) => void;
  moveExercise: (dayId: string, exerciseId: string, direction: -1 | 1) => void;
  toggleSupplement: (supplementId: string, slot: SupplementSlot) => void;
  replenishSupplement: (supplementId: string, amount?: number) => void;
  toggleSupplementSlot: (supplementId: string, slot: SupplementSlot) => void;
  updateSupplement: (supplementId: string, changes: Partial<Pick<Supplement, 'name' | 'dose'>>) => void;
  addSupplement: () => void;
  removeSupplement: (supplementId: string) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeChoice) => void;
  toggleNotification: (key: NotificationKey) => void;
  resetAll: () => void;
};

type PersistedGymState = Pick<GymState,
  'workoutDays' | 'history' | 'activeSession' | 'recentSessionId' | 'supplements' | 'supplementLogs' | 'settings'
>;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const secondsSince = (timestamp: number) => Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

function normalizeOrder(days: WorkoutDay[]) {
  return days.map((day, order) => ({ ...day, order }));
}

function moveById<T extends { id: string }>(items: T[], id: string, direction: -1 | 1) {
  const index = items.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function nextExerciseIndex(session: ActiveWorkoutSession, from: number) {
  for (let index = from + 1; index < session.exercises.length; index += 1) {
    if (session.exercises[index].status === 'pending') return index;
  }
  return from;
}

const initialSettings: Settings = {
  language: 'RU',
  theme: 'dark',
  notifications: { workout: true, supplements: true, sound: true },
};

export const useGymStore = create<GymState>()((set, get) => ({
      workoutDays: clone(INITIAL_WORKOUT_DAYS),
      history: clone(INITIAL_HISTORY),
      activeSession: null,
      recentSessionId: null,
      supplements: clone(INITIAL_SUPPLEMENTS),
      supplementLogs: createInitialSupplementLogs(),
      settings: clone(initialSettings),

      startWorkout: (dayId) => {
        const day = get().workoutDays.find((item) => item.id === dayId);
        if (!day || day.exercises.length === 0) return;
        const now = Date.now();
        set({
          activeSession: {
            id: `session-${now}`,
            dayId: day.id,
            dayName: day.name,
            startedAt: now,
            activeStartedAt: now,
            activeSeconds: 0,
            pausedSeconds: 0,
            pauseCount: 0,
            pauseStartedAt: null,
            pauseRecords: [],
            currentExerciseIndex: 0,
            phase: 'active',
            restEndsAt: null,
            exercises: day.exercises.map((exercise) => ({
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              plannedSets: exercise.plannedSets,
              completedSets: 0,
              reps: exercise.reps,
              weight: exercise.weight,
              isTimeBased: exercise.isTimeBased,
              secondsPerSet: exercise.secondsPerSet,
              status: 'pending',
            })),
          },
          recentSessionId: null,
        });
      },

      adjustWeight: (delta) => set((state) => {
        if (!state.activeSession) return state;
        const index = state.activeSession.currentExerciseIndex;
        const exercises = state.activeSession.exercises.map((exercise, exerciseIndex) =>
          exerciseIndex === index ? { ...exercise, weight: Math.max(0, exercise.weight + delta) } : exercise,
        );
        return { activeSession: { ...state.activeSession, exercises } };
      }),

      completeSet: () => set((state) => {
        const session = state.activeSession;
        if (!session || session.phase !== 'active') return state;
        const index = session.currentExerciseIndex;
        const current = session.exercises[index];
        if (!current || current.status !== 'pending') return state;
        const completedSets = Math.min(current.plannedSets, current.completedSets + 1);
        const completed = completedSets >= current.plannedSets;
        const exercises = session.exercises.map((exercise, exerciseIndex) =>
          exerciseIndex === index
            ? { ...exercise, completedSets, status: completed ? 'completed' as const : 'pending' as const }
            : exercise,
        );
        if (completed) {
          return {
            activeSession: {
              ...session,
              exercises,
              currentExerciseIndex: nextExerciseIndex({ ...session, exercises }, index),
              phase: 'active',
              restEndsAt: null,
            },
          };
        }
        return {
          activeSession: {
            ...session,
            exercises,
            phase: 'rest',
            restEndsAt: Date.now() + 90_000,
          },
        };
      }),

      endRest: () => set((state) => state.activeSession
        ? { activeSession: { ...state.activeSession, phase: 'active', restEndsAt: null } }
        : state),

      addRestTime: (seconds) => set((state) => {
        if (!state.activeSession || state.activeSession.phase !== 'rest') return state;
        return {
          activeSession: {
            ...state.activeSession,
            restEndsAt: (state.activeSession.restEndsAt ?? Date.now()) + seconds * 1000,
          },
        };
      }),

      pauseWorkout: () => set((state) => {
        const session = state.activeSession;
        if (!session || session.phase === 'paused') return state;
        const restSecondsOnPause = session.phase === 'rest' && session.restEndsAt
          ? Math.max(0, Math.ceil((session.restEndsAt - Date.now()) / 1000))
          : undefined;
        return {
          activeSession: {
            ...session,
            activeSeconds: session.activeSeconds + secondsSince(session.activeStartedAt),
            pauseStartedAt: Date.now(),
            pauseCount: session.pauseCount + 1,
            phaseBeforePause: session.phase,
            restSecondsOnPause,
            phase: 'paused',
            restEndsAt: null,
          },
        };
      }),

      setPauseReason: (reason) => set((state) => state.activeSession
        ? { activeSession: { ...state.activeSession, currentPauseReason: reason } }
        : state),

      resumeWorkout: () => set((state) => {
        const session = state.activeSession;
        if (!session || session.phase !== 'paused' || !session.pauseStartedAt) return state;
        const durationSeconds = secondsSince(session.pauseStartedAt);
        const resumeRest = session.phaseBeforePause === 'rest' && (session.restSecondsOnPause ?? 0) > 0;
        return {
          activeSession: {
            ...session,
            activeStartedAt: Date.now(),
            pausedSeconds: session.pausedSeconds + durationSeconds,
            pauseStartedAt: null,
            pauseRecords: [
              ...session.pauseRecords,
              { startedAt: session.pauseStartedAt, durationSeconds, reasonTag: session.currentPauseReason },
            ],
            currentPauseReason: undefined,
            phase: resumeRest ? 'rest' : 'active',
            restEndsAt: resumeRest ? Date.now() + (session.restSecondsOnPause ?? 0) * 1000 : null,
            restSecondsOnPause: undefined,
            phaseBeforePause: undefined,
          },
        };
      }),

      selectExercise: (index) => set((state) => {
        if (!state.activeSession || index < 0 || index >= state.activeSession.exercises.length) return state;
        return { activeSession: { ...state.activeSession, currentExerciseIndex: index } };
      }),

      resolveExercise: (status, reason) => set((state) => {
        const session = state.activeSession;
        if (!session) return state;
        const index = session.currentExerciseIndex;
        const exercises = session.exercises.map((exercise, exerciseIndex) => {
          if (exerciseIndex !== index) return exercise;
          return {
            ...exercise,
            status,
            reasonTag: reason,
            completedSets: status === 'skipped' ? 0 : exercise.completedSets,
          };
        });
        return {
          activeSession: {
            ...session,
            exercises,
            currentExerciseIndex: nextExerciseIndex({ ...session, exercises }, index),
            phase: 'active',
            restEndsAt: null,
          },
        };
      }),

      finishWorkout: () => {
        const session = get().activeSession;
        if (!session) return null;
        const now = Date.now();
        let activeSeconds = session.activeSeconds;
        let pausedSeconds = session.pausedSeconds;
        if (session.phase === 'paused' && session.pauseStartedAt) {
          pausedSeconds += Math.max(0, Math.floor((now - session.pauseStartedAt) / 1000));
        } else {
          activeSeconds += Math.max(0, Math.floor((now - session.activeStartedAt) / 1000));
        }
        const exercises = session.exercises.map((exercise) => {
          if (exercise.status !== 'pending') return exercise;
          if (exercise.completedSets >= exercise.plannedSets) return { ...exercise, status: 'completed' as const };
          if (exercise.completedSets > 0) return { ...exercise, status: 'ended_early' as const };
          return { ...exercise, completedSets: 0, status: 'skipped' as const };
        });
        const totalVolume = exercises.reduce((total, exercise) => {
          if (exercise.status === 'skipped' || exercise.isTimeBased) return total;
          return total + exercise.completedSets * exercise.reps * exercise.weight;
        }, 0);
        const completed: WorkoutSession = {
          id: session.id,
          date: new Date(now).toISOString(),
          dayId: session.dayId,
          dayName: session.dayName,
          activeSeconds,
          pausedSeconds,
          pauseCount: session.pauseCount,
          pauseRecords: session.phase === 'paused' && session.pauseStartedAt
            ? [
                ...session.pauseRecords,
                {
                  startedAt: session.pauseStartedAt,
                  durationSeconds: secondsSince(session.pauseStartedAt),
                  reasonTag: session.currentPauseReason,
                },
              ]
            : session.pauseRecords,
          exercises,
          totalVolume,
        };
        set((state) => ({
          history: [completed, ...state.history],
          activeSession: null,
          recentSessionId: completed.id,
        }));
        return completed.id;
      },

      updateDay: (dayId, changes) => set((state) => ({
        workoutDays: state.workoutDays.map((day) => day.id === dayId ? { ...day, ...changes } : day),
      })),
      addDay: () => set((state) => ({
        workoutDays: [
          ...state.workoutDays,
          { id: `day-${Date.now()}`, order: state.workoutDays.length, name: 'Новый день', exercises: [] },
        ],
      })),
      removeDay: (dayId) => set((state) => ({
        workoutDays: normalizeOrder(state.workoutDays.filter((day) => day.id !== dayId)),
      })),
      moveDay: (dayId, direction) => set((state) => ({
        workoutDays: normalizeOrder(moveById(state.workoutDays, dayId, direction)),
      })),
      addExercise: (dayId) => set((state) => ({
        workoutDays: state.workoutDays.map((day) => day.id === dayId
          ? {
              ...day,
              exercises: [
                ...day.exercises,
                {
                  id: `exercise-${Date.now()}`,
                  name: 'Новое упражнение',
                  muscleGroup: 'Группа мышц',
                  plannedSets: 3,
                  reps: 10,
                  weight: 0,
                  isTimeBased: false,
                },
              ],
            }
          : day),
      })),
      updateExercise: (dayId, exerciseId, changes) => set((state) => ({
        workoutDays: state.workoutDays.map((day) => day.id === dayId
          ? { ...day, exercises: day.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, ...changes } : exercise) }
          : day),
      })),
      removeExercise: (dayId, exerciseId) => set((state) => ({
        workoutDays: state.workoutDays.map((day) => day.id === dayId
          ? { ...day, exercises: day.exercises.filter((exercise) => exercise.id !== exerciseId) }
          : day),
      })),
      moveExercise: (dayId, exerciseId, direction) => set((state) => ({
        workoutDays: state.workoutDays.map((day) => day.id === dayId
          ? { ...day, exercises: moveById(day.exercises, exerciseId, direction) }
          : day),
      })),

      toggleSupplement: (supplementId, slot) => set((state) => {
        const today = dateKey();
        const key = `${supplementId}:${slot}`;
        const existing = state.supplementLogs.find((log) => log.date === today);
        const wasTaken = existing?.taken[key] ?? false;
        const nextLog: SupplementLog = {
          date: today,
          taken: { ...(existing?.taken ?? {}), [key]: !wasTaken },
        };
        return {
          supplementLogs: existing
            ? state.supplementLogs.map((log) => log.date === today ? nextLog : log)
            : [...state.supplementLogs, nextLog],
          supplements: state.supplements.map((supplement) => supplement.id === supplementId
            ? {
                ...supplement,
                stock: Math.max(0, supplement.stock + (wasTaken ? supplement.unitsPerDose : -supplement.unitsPerDose)),
              }
            : supplement),
        };
      }),
      replenishSupplement: (supplementId, amount) => set((state) => ({
        supplements: state.supplements.map((supplement) => supplement.id === supplementId
          ? {
              ...supplement,
              stock: amount === undefined
                ? supplement.capacity
                : Math.min(supplement.capacity, supplement.stock + amount),
            }
          : supplement),
      })),
      toggleSupplementSlot: (supplementId, slot) => set((state) => ({
        supplements: state.supplements.map((supplement) => {
          if (supplement.id !== supplementId) return supplement;
          const hasSlot = supplement.schedule.includes(slot);
          return {
            ...supplement,
            schedule: hasSlot ? supplement.schedule.filter((item) => item !== slot) : [...supplement.schedule, slot],
          };
        }),
      })),
      updateSupplement: (supplementId, changes) => set((state) => ({
        supplements: state.supplements.map((supplement) => supplement.id === supplementId ? { ...supplement, ...changes } : supplement),
      })),
      addSupplement: () => set((state) => ({
        supplements: [
          ...state.supplements,
          {
            id: `supplement-${Date.now()}`,
            name: 'Новая добавка',
            dose: '1 порция',
            stock: 30,
            capacity: 30,
            stockUnit: 'порции',
            unitsPerDose: 1,
            schedule: ['morning'],
          },
        ],
      })),
      removeSupplement: (supplementId) => set((state) => ({
        supplements: state.supplements.filter((supplement) => supplement.id !== supplementId),
      })),

      setLanguage: (language) => set((state) => ({ settings: { ...state.settings, language } })),
      setTheme: (theme) => set((state) => ({ settings: { ...state.settings, theme } })),
      toggleNotification: (key) => set((state) => ({
        settings: {
          ...state.settings,
          notifications: { ...state.settings.notifications, [key]: !state.settings.notifications[key] },
        },
      })),
      resetAll: () => set({
        workoutDays: clone(INITIAL_WORKOUT_DAYS),
        history: [],
        activeSession: null,
        recentSessionId: null,
        supplements: clone(INITIAL_SUPPLEMENTS),
        supplementLogs: [],
        settings: clone(initialSettings),
      }),
}));

const STORAGE_KEY = 'gym-tracker-mobile-v2';
let storageHydrated = false;

const selectPersistedState = (state: GymState): PersistedGymState => ({
  workoutDays: state.workoutDays,
  history: state.history,
  activeSession: state.activeSession,
  recentSessionId: state.recentSessionId,
  supplements: state.supplements,
  supplementLogs: state.supplementLogs,
  settings: state.settings,
});

void AsyncStorage.getItem(STORAGE_KEY)
  .then((raw) => {
    if (!raw) return;
    const parsed = JSON.parse(raw) as { data?: Partial<PersistedGymState> } | Partial<PersistedGymState>;
    const saved: Partial<PersistedGymState> | undefined = (parsed as { data?: Partial<PersistedGymState> }).data
      ?? (parsed as Partial<PersistedGymState>);
    if (!saved) return;
    useGymStore.setState({
      ...saved,
      supplements: saved.supplements?.map((supplement) => ({ ...supplement, unitsPerDose: supplement.unitsPerDose ?? 1 })),
      history: saved.history?.map((session) => ({ ...session, pauseRecords: session.pauseRecords ?? [] })),
    });
  })
  .catch(() => undefined)
  .finally(() => {
    storageHydrated = true;
  });

useGymStore.subscribe((state) => {
  if (!storageHydrated) return;
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, data: selectPersistedState(state) }))
    .catch(() => undefined);
});
