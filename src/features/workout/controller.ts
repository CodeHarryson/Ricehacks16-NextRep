import type { AttemptResult } from '../../contracts/attempt';
import { attemptKey } from '../../contracts/attempt';

export interface WorkoutState {
  sessionId: string;
  setId: string;
  reps: number;
  processedAttemptKeys: readonly string[];
  lastAttempt: AttemptResult | null;
}

/** Foundation only: the controller will own sets, rest and serialized XP saves.
 * Replay and foreign-session events cannot alter totals. Tracking health never
 * resets completed totals. No reward policy is implemented. */
export function acceptAttempt(state: WorkoutState, attempt: AttemptResult): WorkoutState {
  const key = attemptKey(attempt);
  if (attempt.sessionId !== state.sessionId || attempt.setId !== state.setId ||
      state.processedAttemptKeys.includes(key)) return state;
  return {
    ...state, reps: state.reps + attempt.countDelta,
    processedAttemptKeys: [...state.processedAttemptKeys, key], lastAttempt: attempt,
  };
}
