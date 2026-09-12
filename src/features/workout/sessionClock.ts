export interface SessionClock { countdownEndsAt: number; deadline: number; started: boolean; expired: boolean; remainingSeconds: number; }
export function createSessionClock(now: number, matchTimeLimitSeconds: number, countdownSeconds = 10, sharedStartAt?: number): SessionClock {
  const countdownEndsAt = (sharedStartAt ?? now) + countdownSeconds * 1000;
  return { countdownEndsAt, deadline: countdownEndsAt + matchTimeLimitSeconds * 1000, started: now >= countdownEndsAt, expired: now >= countdownEndsAt + matchTimeLimitSeconds * 1000, remainingSeconds: Math.max(0, Math.ceil((countdownEndsAt + matchTimeLimitSeconds * 1000 - Math.max(now, countdownEndsAt)) / 1000)) };
}
export function advanceSessionClock(clock: SessionClock, now: number): SessionClock {
  if (!clock.started && now < clock.countdownEndsAt) return clock;
  const started = true;
  const remainingSeconds = Math.max(0, Math.ceil((clock.deadline - now) / 1000));
  return { ...clock, started, expired: remainingSeconds === 0, remainingSeconds };
}
export function canAcceptSessionAttempt(clock: SessionClock, now: number): boolean {
  return clock.started && !clock.expired && now < clock.deadline;
}
