import type { AttemptResult } from '../../contracts/attempt';
import { attemptKey } from '../../contracts/attempt';

export const SCORE_POLICY_VERSION = 'score-v1';
export interface WorkoutScore { countedReps: number; greenReps: number; yellowReps: number; redAttempts: number; neutralAttempts: number; cappedTargetReps: number; totalScore: number; scorePolicyVersion: string; }
export function scoreAttempts(attempts: readonly AttemptResult[], targetReps: number): WorkoutScore {
  const seen = new Set<string>(); let greenReps = 0; let yellowReps = 0; let redAttempts = 0; let neutralAttempts = 0;
  for (const attempt of attempts) {
    const key = attemptKey(attempt); if (seen.has(key)) continue; seen.add(key);
    if (attempt.rating === 'green' && attempt.completed && attempt.countDelta === 1) greenReps += 1;
    else if (attempt.rating === 'yellow' && attempt.completed && attempt.countDelta === 1) yellowReps += 1;
    else if (attempt.rating === 'red') redAttempts += 1;
    else if (attempt.rating === null) neutralAttempts += 1;
  }
  const cappedTargetReps = Math.max(0, Math.floor(targetReps));
  const countedReps = Math.min(cappedTargetReps, greenReps + yellowReps);
  const countedGreen = Math.min(greenReps, countedReps);
  const countedYellow = Math.min(yellowReps, countedReps - countedGreen);
  return { countedReps, greenReps: countedGreen, yellowReps: countedYellow, redAttempts, neutralAttempts, cappedTargetReps, totalScore: countedGreen * 110 + countedYellow * 100, scorePolicyVersion: SCORE_POLICY_VERSION };
}
