import type { ResultPollState } from './resultPolling';
import { isFinalResolution } from './resultPolling';

export type ChallengeEntryPhase = 'checking' | 'workout' | 'submitted' | 'final';
export interface ChallengeEntryState {
  phase: ChallengeEntryPhase;
  showCamera: boolean;
  showResultPanel: boolean;
  /** The result could not be checked, so the player is warned that the server keeps any earlier submission. */
  unverified: boolean;
}

/**
 * Decides what (re)opening the workout screen shows. A challenge camera session only starts once the server
 * confirms this player has not submitted yet; submitted challenges show the waiting result panel and resolved
 * or cancelled challenges show the final result.
 */
export function challengeEntryState(input: { isChallenge: boolean; userId: string | null; identityError: boolean; poll: ResultPollState; localSubmitted: boolean }): ChallengeEntryState {
  if (!input.isChallenge) return { phase: 'workout', showCamera: true, showResultPanel: false, unverified: false };
  const snapshot = input.poll.snapshot;
  if (isFinalResolution(snapshot)) return { phase: 'final', showCamera: false, showResultPanel: true, unverified: false };
  const serverHasMine = input.userId !== null && (snapshot?.results.some((item) => item.participantId === input.userId) ?? false);
  if (serverHasMine || input.localSubmitted) return { phase: 'submitted', showCamera: false, showResultPanel: true, unverified: false };
  if (snapshot) return { phase: 'workout', showCamera: true, showResultPanel: false, unverified: false };
  // No snapshot yet. Without an identity or with a failed first request the status cannot be checked; the
  // workout proceeds (the countdown is time-critical) and server idempotency keeps any earlier result.
  if (input.identityError || input.poll.status === 'error') return { phase: 'workout', showCamera: true, showResultPanel: false, unverified: true };
  return { phase: 'checking', showCamera: false, showResultPanel: false, unverified: false };
}
