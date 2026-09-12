import type { Tone } from '../../../theme/tokens';
import type { ChallengeStatus } from '../api';
import type { EndedChallengeReason } from '../challengeState';
import type { OpponentStatus } from '../opponentStatus';
import type { ChallengeOutcome } from '../resultView';

/** Presentation-only mapping from server/challenge state to chip label + tone. No behaviour lives here. */
export const CHALLENGE_STATUS_VISUALS: Record<ChallengeStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Waiting', tone: 'warning' },
  accepted: { label: 'Accepted', tone: 'info' },
  configuring: { label: 'Configuring', tone: 'warning' },
  ready: { label: 'Ready', tone: 'info' },
  active: { label: 'Active', tone: 'success' },
  declined: { label: 'Declined', tone: 'danger' },
  expired: { label: 'Expired', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export const ENDED_REASON_TONES: Record<EndedChallengeReason, Tone> = { expired: 'neutral', declined: 'danger', cancelled: 'neutral' };

export const OPPONENT_STATUS_TONES: Record<OpponentStatus, Tone> = {
  waiting_for_opponent: 'warning',
  opponent_ready: 'info',
  both_working_out: 'success',
  opponent_working_out: 'info',
  opponent_submitted: 'reward',
  resolved: 'success',
  cancelled: 'neutral',
};

export const OUTCOME_VISUALS: Record<ChallengeOutcome, { tone: Tone; badge: string; emoji: string }> = {
  win: { tone: 'success', badge: 'WINNER', emoji: '👑' },
  loss: { tone: 'danger', badge: 'DEFEATED', emoji: '💥' },
  draw: { tone: 'reward', badge: 'DRAW', emoji: '🤝' },
  cancelled: { tone: 'neutral', badge: 'CANCELLED', emoji: '⏱' },
  pending: { tone: 'info', badge: 'PENDING', emoji: '⏳' },
};
