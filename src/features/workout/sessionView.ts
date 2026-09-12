import type { WorkoutSessionConfig } from './session';

export const EXERCISE_LABELS: Record<WorkoutSessionConfig['exercise'], string> = { bodyweight_squat: 'Bodyweight squat' };

export interface SessionDetailRow { key: 'exercise' | 'sets' | 'targetReps' | 'rest' | 'matchDuration' | 'opponent'; label: string; value: string; }
export interface WorkoutSessionView {
  isChallenge: boolean;
  eyebrow: string;
  heading: string;
  configRows: SessionDetailRow[];
  /** Non-null only for challenges: both players agreed to this configuration and it cannot change. */
  lockedNotice: string | null;
  opponentName: string | null;
  /** Shown as a small debug line so two-device testing can match sessions. */
  challengeId: string | null;
  showOpponentStatus: boolean;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder === 0 ? `${minutes} min` : `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function workoutSessionView(session: WorkoutSessionConfig): WorkoutSessionView {
  const isChallenge = session.mode === 'challenge';
  const opponentName = isChallenge ? session.opponentName ?? null : null;
  const configRows: SessionDetailRow[] = [
    { key: 'exercise', label: 'Exercise', value: EXERCISE_LABELS[session.exercise] },
    { key: 'sets', label: 'Sets', value: String(session.setCount) },
    { key: 'targetReps', label: 'Target reps', value: `${session.targetReps} per set` },
    { key: 'rest', label: 'Rest', value: session.restSeconds === 0 ? 'No rest' : formatDuration(session.restSeconds) },
    { key: 'matchDuration', label: 'Match duration', value: formatDuration(session.matchTimeLimitSeconds) },
  ];
  if (opponentName) configRows.push({ key: 'opponent', label: 'Opponent', value: opponentName });
  return {
    isChallenge,
    eyebrow: isChallenge ? 'CHALLENGE / SHARED SQUATS' : 'SETUP / BODYWEIGHT SQUATS',
    heading: isChallenge ? 'Challenge workout' : 'Solo workout',
    configRows,
    lockedNotice: isChallenge ? 'Configuration locked — both players agreed to these settings.' : null,
    opponentName,
    challengeId: isChallenge ? session.challengeId ?? null : null,
    showOpponentStatus: isChallenge,
  };
}
