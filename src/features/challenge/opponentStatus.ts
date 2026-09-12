import type { Challenge, ChallengeResolution, ChallengeResult } from './api';

export type OpponentStatus = 'waiting_for_opponent' | 'opponent_ready' | 'both_working_out' | 'opponent_working_out' | 'opponent_submitted' | 'resolved' | 'cancelled';

export const OPPONENT_STATUS_COPY: Record<OpponentStatus, { label: string; detail: string }> = {
  waiting_for_opponent: { label: 'Waiting for opponent', detail: 'Your opponent has not accepted yet.' },
  opponent_ready: { label: 'Opponent ready', detail: 'Your opponent is ready to go.' },
  both_working_out: { label: 'Both players working out', detail: 'Reps are being counted on both devices.' },
  opponent_working_out: { label: 'Opponent still working out', detail: 'Your result is in. Waiting for your opponent to finish.' },
  opponent_submitted: { label: 'Opponent submitted', detail: 'Your opponent has finished and submitted a result.' },
  resolved: { label: 'Challenge resolved', detail: 'The server has decided the result.' },
  cancelled: { label: 'Challenge cancelled', detail: 'This challenge ended without a winner.' },
};

/** Pre-workout status from the challenge list poll. */
export function opponentStatusFromChallenge(challenge: Challenge, userId: string): OpponentStatus {
  if (challenge.status === 'declined' || challenge.status === 'expired' || challenge.status === 'cancelled') return 'cancelled';
  if (challenge.status === 'active') return 'both_working_out';
  if (challenge.status === 'ready') return 'opponent_ready';
  const isSender = challenge.senderId === userId;
  // A pending challenge was sent by its sender, so the sender is ready and the receiver has not answered.
  if (challenge.status === 'pending') return isSender ? 'waiting_for_opponent' : 'opponent_ready';
  const opponentAcceptedAt = isSender ? challenge.acceptance.receiverAcceptedAt : challenge.acceptance.senderAcceptedAt;
  return opponentAcceptedAt ? 'opponent_ready' : 'waiting_for_opponent';
}

/** In-workout status from the result poll. The server resolution always wins over submission state. */
export function opponentStatusFromResults(input: { userId: string; results: readonly ChallengeResult[]; resolution: ChallengeResolution; localSubmitted: boolean }): OpponentStatus {
  if (input.resolution.status === 'resolved') return 'resolved';
  if (input.resolution.status === 'cancelled') return 'cancelled';
  if (input.results.some((item) => item.participantId !== input.userId)) return 'opponent_submitted';
  const localSubmitted = input.localSubmitted || input.results.some((item) => item.participantId === input.userId);
  return localSubmitted ? 'opponent_working_out' : 'both_working_out';
}
