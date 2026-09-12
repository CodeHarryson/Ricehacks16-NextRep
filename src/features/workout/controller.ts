import type { AttemptResult } from '../../contracts/attempt';
import { attemptKey } from '../../contracts/attempt';
import { WORKOUT_TARGET_REPS } from '../../config/workout';

export type SetStatus = 'active' | 'complete';
export type RewardStatus = 'pending' | 'granted' | 'failed';

export interface SetCompleted {
  completionId: string;
  rewardId: string;
  sessionId: string;
  setId: string;
  completedAt: number;
}

export interface WorkoutState {
  sessionId: string;
  setId: string;
  reps: number;
  targetReps: number;
  status: SetStatus;
  rewardStatus: RewardStatus;
  processedAttemptKeys: readonly string[];
  processedAttemptIds: readonly string[];
  lastAttempt: AttemptResult | null;
}

export interface AttemptAcceptance {
  state: WorkoutState;
  completion: SetCompleted | null;
}

export function createWorkoutState(sessionId: string, setId: string, targetReps = WORKOUT_TARGET_REPS): WorkoutState {
  if (!sessionId || !setId || !Number.isSafeInteger(targetReps) || targetReps < 1) {
    throw new Error('Workout requires non-empty IDs and a positive integer target.');
  }
  return {
    sessionId,
    setId,
    reps: 0,
    targetReps,
    status: 'active',
    rewardStatus: 'pending',
    processedAttemptKeys: [],
    processedAttemptIds: [],
    lastAttempt: null,
  };
}

const completionFor = (state: WorkoutState, completedAt: number): SetCompleted => {
  const completionId = `completion:${state.sessionId}:${state.setId}`;
  return {
    completionId,
    rewardId: `reward:${completionId}`,
    sessionId: state.sessionId,
    setId: state.setId,
    completedAt,
  };
};

const countsAsRep = (attempt: AttemptResult): boolean =>
  attempt.countDelta === 1 && attempt.assessable && attempt.completed &&
  (attempt.rating === 'green' || attempt.rating === 'yellow');

/**
 * Owns set-local attempt identity and completion. It deliberately has no storage
 * dependency: callers persist only the resulting SetCompleted event.
 */
export function acceptAttempt(state: WorkoutState, attempt: AttemptResult): AttemptAcceptance {
  const key = attemptKey(attempt);
  if (
    state.status === 'complete' ||
    !attempt.attemptId ||
    attempt.sessionId !== state.sessionId ||
    attempt.setId !== state.setId ||
    state.processedAttemptKeys.includes(key) ||
    state.processedAttemptIds.includes(attempt.attemptId)
  ) {
    return { state, completion: null };
  }

  const reps = countsAsRep(attempt) ? Math.min(state.targetReps, state.reps + 1) : state.reps;
  const next: WorkoutState = {
    ...state,
    reps,
    processedAttemptKeys: [...state.processedAttemptKeys, key],
    processedAttemptIds: [...state.processedAttemptIds, attempt.attemptId],
    lastAttempt: attempt,
  };
  if (reps !== state.targetReps || state.reps === state.targetReps) {
    return { state: next, completion: null };
  }
  const complete = { ...next, status: 'complete' as const };
  return { state: complete, completion: completionFor(complete, attempt.endedAt) };
}

export function setRewardStatus(state: WorkoutState, rewardStatus: RewardStatus): WorkoutState {
  return state.status === 'complete' ? { ...state, rewardStatus } : state;
}
