import type { SessionClock } from './sessionClock';

/** Network latency means every challenge device opens slightly after startedAt; ignore that much. */
export const LATE_JOIN_GRACE_MS = 1_000;

export type CountdownPhase = 'countdown' | 'active' | 'expired';
export interface CountdownView {
  phase: CountdownPhase;
  /** Whole seconds until reps start counting; 0 once the countdown has elapsed. */
  secondsUntilStart: number;
  /** Whole seconds left in the match (the full match length during the countdown). */
  secondsRemaining: number;
  /** The device opened the session after the shared countdown had already begun. */
  joinedLate: boolean;
  /** The device opened the session after the countdown ended, so tracking started immediately. */
  skippedCountdown: boolean;
  /** The device opened the session after the match deadline; nothing can be counted. */
  joinedAfterDeadline: boolean;
}

/**
 * Presentation-ready countdown state. Phase follows the clock's own started/expired flags so the UI
 * never disagrees with canAcceptSessionAttempt about whether reps are being counted.
 */
export function countdownView(clock: SessionClock, now: number, joinedAt: number, countdownSeconds: number): CountdownView {
  const countdownStartedAt = clock.countdownEndsAt - countdownSeconds * 1000;
  return {
    phase: clock.expired ? 'expired' : clock.started ? 'active' : 'countdown',
    secondsUntilStart: clock.started ? 0 : Math.max(0, Math.ceil((clock.countdownEndsAt - now) / 1000)),
    secondsRemaining: clock.remainingSeconds,
    joinedLate: joinedAt - countdownStartedAt >= LATE_JOIN_GRACE_MS,
    skippedCountdown: joinedAt >= clock.countdownEndsAt && joinedAt < clock.deadline,
    joinedAfterDeadline: joinedAt >= clock.deadline,
  };
}

export function countdownMessage(view: CountdownView, isChallenge: boolean, opponentName?: string): string {
  const opponent = opponentName ?? 'your opponent';
  if (view.phase === 'expired') return isChallenge && view.joinedAfterDeadline ?'You joined after the challenge deadline — no reps can be counted.' : 'Session expired — no new reps are accepted.';
  if (view.phase === 'active') return isChallenge && view.skippedCountdown ? `Joined after the shared countdown — tracking started immediately. ${view.secondsRemaining}s left.` : `Time remaining: ${view.secondsRemaining}s`;
  if (!isChallenge) return 'Get ready. Pose tracking starts when the countdown reaches zero.';
  return view.joinedLate
    ? `You joined late — countdown synced with ${opponent}. Reps count only after zero.`
    : `Shared countdown with ${opponent}. Reps count only after zero.`;
}
