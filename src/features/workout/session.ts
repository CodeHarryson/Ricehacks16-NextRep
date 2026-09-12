export type WorkoutSessionMode = 'solo' | 'challenge';
export interface WorkoutSessionConfig {
  mode: WorkoutSessionMode;
  exercise: 'bodyweight_squat';
  setCount: number;
  targetReps: number;
  restSeconds: number;
  matchTimeLimitSeconds: number;
  challengeId?: string;
  configVersion?: number;
  startedAt?: string;
}

export const DEFAULT_SOLO_SESSION: WorkoutSessionConfig = {
  mode: 'solo', exercise: 'bodyweight_squat', setCount: 1, targetReps: 5, restSeconds: 30, matchTimeLimitSeconds: 300,
};

export function isValidWorkoutSession(value: unknown): value is WorkoutSessionConfig {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<WorkoutSessionConfig>;
  const { setCount, targetReps, restSeconds, matchTimeLimitSeconds } = session;
  if ((session.mode !== 'solo' && session.mode !== 'challenge') || session.exercise !== 'bodyweight_squat' || typeof setCount !== 'number' || typeof targetReps !== 'number' || typeof restSeconds !== 'number' || typeof matchTimeLimitSeconds !== 'number') return false;
  return Number.isInteger(setCount) && setCount >= 1 && setCount <= 3 && Number.isInteger(targetReps) && targetReps >= 1 && targetReps <= 50 && Number.isInteger(restSeconds) && restSeconds >= 0 && restSeconds <= 300 && Number.isInteger(matchTimeLimitSeconds) && matchTimeLimitSeconds >= 30 && matchTimeLimitSeconds <= 1800 && (session.mode === 'solo' || typeof session.challengeId === 'string') && (session.startedAt === undefined || (typeof session.startedAt === 'string' && Number.isFinite(Date.parse(session.startedAt))));
}
