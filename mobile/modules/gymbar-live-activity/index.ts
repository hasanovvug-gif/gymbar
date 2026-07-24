import { NativeModule, requireOptionalNativeModule } from 'expo';

export type LiveActivityState = {
  sessionId: string;
  dayName: string;
  exerciseName: string;
  setCurrent: number;
  setTotal: number;
  exerciseCurrent: number;
  exerciseTotal: number;
  phase: 'active' | 'rest' | 'paused';
  restEndsAt?: number;
  upcomingExerciseNames: string[];
  upcomingExerciseSetTotals: number[];
  canCompleteSet: boolean;
};

type LiveActivityEvents = {
  onCompleteSet(): void;
};

declare class GymbarLiveActivityNativeModule extends NativeModule<LiveActivityEvents> {
  startLiveActivity(state: LiveActivityState): Promise<string>;
  updateLiveActivity(state: LiveActivityState): Promise<void>;
  endLiveActivity(): Promise<void>;
  consumeCompleteSetEvents(): Promise<number[]>;
  setSharedSoundEnabled(isEnabled: boolean): void;
  setPreSignalSeconds(seconds: number): void;
  setRestNotificationIdentifier(identifier: string | null): void;
}

export const GymbarLiveActivity =
  requireOptionalNativeModule<GymbarLiveActivityNativeModule>('GymbarLiveActivity');
