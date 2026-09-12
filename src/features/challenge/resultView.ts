import type { ChallengeResolution, ChallengeResult } from './api';
import { BATTLE_REWARDS, type BattleOutcome } from './rewards';
import { canGrantBattleReward } from '../workout/resultCopy';
import type { WorkoutScore } from '../workout/scoring';

export type ChallengeOutcome = 'pending' | 'win' | 'loss' | 'draw' | 'cancelled';
export interface ScoreBreakdown { totalScore: number; countedReps: number; greenReps: number; yellowReps: number; redAttempts: number; }
export interface ChallengeResultView {
  outcome: ChallengeOutcome;
  headline: string;
  detail: string;
  /** Server-validated score when available; the local estimate is only a placeholder until then. */
  local: (ScoreBreakdown & { source: 'server' | 'local' }) | null;
  opponent: ScoreBreakdown | null;
  opponentName: string;
  /** Reward for this outcome under battle-reward-v1; null when no reward applies. */
  reward: { xp: number; coins: number } | null;
}

/** Only a resolved server result with an explicit winnerId (string or null for a draw) maps to a reward. */
export function battleOutcomeFor(resolution: ChallengeResolution, userId: string): BattleOutcome | null {
  if (!canGrantBattleReward(resolution.status)) return null;
  if (resolution.winnerId === null) return 'draw';
  if (typeof resolution.winnerId !== 'string') return null;
  return resolution.winnerId === userId ? 'winner' : 'loser';
}

export function challengeOutcome(resolution: ChallengeResolution, userId: string | null): ChallengeOutcome {
  if (resolution.status === 'cancelled') return 'cancelled';
  const battle = userId ? battleOutcomeFor(resolution, userId) : null;
  return battle === 'winner' ? 'win' : battle === 'loser' ? 'loss' : battle === 'draw' ? 'draw' : 'pending';
}

const breakdown = (source: ChallengeResult | WorkoutScore): ScoreBreakdown => ({ totalScore: source.totalScore, countedReps: source.countedReps, greenReps: source.greenReps, yellowReps: source.yellowReps, redAttempts: source.redAttempts });

export function buildChallengeResultView(input: { userId: string | null; results: readonly ChallengeResult[]; resolution: ChallengeResolution; localScore: WorkoutScore | null; opponentName?: string }): ChallengeResultView {
  const { userId, results, resolution, localScore } = input;
  const opponentName = input.opponentName ?? 'Your opponent';
  const mine = userId ? results.find((item) => item.participantId === userId) ?? null : null;
  const theirs = userId ? results.find((item) => item.participantId !== userId) ?? null : null;
  const outcome = challengeOutcome(resolution, userId);
  const battle = userId ? battleOutcomeFor(resolution, userId) : null;
  const local = mine ? { ...breakdown(mine), source: 'server' as const } : localScore ? { ...breakdown(localScore), source: 'local' as const } : null;
  const copy: Record<ChallengeOutcome, { headline: string; detail: string }> = {
    win: { headline: 'Victory', detail: `You outscored ${opponentName}.` },
    loss: { headline: 'Defeat', detail: `${opponentName} scored higher this time.` },
    draw: { headline: 'Draw', detail: `You and ${opponentName} finished with the same score.` },
    cancelled: { headline: 'Challenge cancelled', detail: mine ? `No-show: ${opponentName} did not submit before the deadline. No winner and no battle rewards.` : 'Your result was not submitted before the deadline. No winner and no battle rewards.' },
    pending: { headline: theirs ? 'Resolving result…' : 'Waiting for opponent result', detail: theirs ? 'Both results are in — waiting for the server to confirm the winner.' : `Your result is in. The winner appears when ${opponentName} submits or the match deadline passes.` },
  };
  return { outcome, ...copy[outcome], local, opponent: theirs ? breakdown(theirs) : null, opponentName, reward: battle ? { ...BATTLE_REWARDS[battle] } : null };
}
