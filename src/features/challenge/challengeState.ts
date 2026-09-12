import type { Challenge, ChallengeStatus } from './api';
import { isValidWorkoutSession, type WorkoutSessionConfig } from '../workout/session';

export const OPEN_STATUSES: readonly ChallengeStatus[] = ['pending', 'accepted', 'configuring', 'ready', 'active'];
const SETUP_STATUSES: readonly ChallengeStatus[] = ['accepted', 'configuring', 'ready', 'active'];

export const isParticipant = (challenge: Challenge, userId: string): boolean => challenge.senderId === userId || challenge.receiverId === userId;
export const opponentNameFor = (challenge: Challenge, userId: string): string => challenge.senderId === userId ? challenge.receiverDisplayName : challenge.senderDisplayName;

export function findActiveChallenge(challenges: readonly Challenge[], userId: string | null): Challenge | undefined {
  if (!userId) return undefined;
  return challenges.find((item) => SETUP_STATUSES.includes(item.status) && isParticipant(item, userId));
}

/** Builds the locked camera session from server data; null when the server data is unusable. */
export function buildChallengeWorkoutSession(challenge: Challenge, userId: string): WorkoutSessionConfig | null {
  const session: unknown = { mode: 'challenge', ...challenge.configuration, challengeId: challenge.challengeId, startedAt: challenge.startedAt ?? undefined, opponentName: opponentNameFor(challenge, userId) };
  return isValidWorkoutSession(session) ? session : null;
}

/** Auto-launch once per challenge; afterwards the player re-enters explicitly, which avoids relaunch loops. */
export function shouldAutoLaunchWorkout(challenge: Challenge | undefined, launchedChallengeIds: ReadonlySet<string>): boolean {
  return challenge?.status === 'active' && challenge.startedAt !== null && !launchedChallengeIds.has(challenge.challengeId);
}

export type EndedChallengeReason = 'expired' | 'declined' | 'cancelled';
export interface EndedChallengeNotice { challengeId: string; opponentName: string; reason: EndedChallengeReason; }

export const ENDED_CHALLENGE_COPY: Record<EndedChallengeReason, { heading: string; body: (opponentName: string) => string }> = {
  expired: { heading: 'Challenge expired', body: (name) => `The challenge with ${name} expired before it finished. Send a new challenge to play again.` },
  declined: { heading: 'Challenge declined', body: (name) => `${name} declined your challenge.` },
  cancelled: { heading: 'Challenge cancelled', body: (name) => `The challenge with ${name} was cancelled.` },
};

/**
 * Compares consecutive polls. The server omits a participant's challenge only once it has expired,
 * so an open challenge that disappears is reported as expired.
 */
export function detectEndedChallenges(previous: readonly Challenge[], next: readonly Challenge[], userId: string): EndedChallengeNotice[] {
  const notices: EndedChallengeNotice[] = [];
  for (const before of previous) {
    if (!OPEN_STATUSES.includes(before.status) || !isParticipant(before, userId)) continue;
    const after = next.find((item) => item.challengeId === before.challengeId);
    const opponentName = opponentNameFor(before, userId);
    if (!after || after.status === 'expired') notices.push({ challengeId: before.challengeId, opponentName, reason: 'expired' });
    else if (after.status === 'cancelled') notices.push({ challengeId: before.challengeId, opponentName, reason: 'cancelled' });
    // The receiver chose to decline, so only the sender needs to be told.
    else if (after.status === 'declined' && before.senderId === userId) notices.push({ challengeId: before.challengeId, opponentName, reason: 'declined' });
  }
  return notices;
}

export function mergeNotices(current: readonly EndedChallengeNotice[], incoming: readonly EndedChallengeNotice[]): EndedChallengeNotice[] {
  return [...current, ...incoming.filter((notice) => !current.some((item) => item.challengeId === notice.challengeId))];
}
