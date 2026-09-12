import assert from 'node:assert/strict';
import test from 'node:test';
import { countdownMessage, countdownView } from './countdown';
import { advanceSessionClock, canAcceptSessionAttempt, createSessionClock } from './sessionClock';

const COUNTDOWN = 10;

test('challenge countdown runs from the shared server start and counts no reps until zero', () => {
  const startedAt = 100_000;
  const joinedAt = startedAt + 400; // normal network delay, not a late join
  const clock = createSessionClock(joinedAt, 60, COUNTDOWN, startedAt);
  const during = countdownView(advanceSessionClock(clock, startedAt + 3_200), startedAt + 3_200, joinedAt, COUNTDOWN);
  assert.equal(during.phase, 'countdown');
  assert.equal(during.secondsUntilStart, 7);
  assert.equal(during.joinedLate, false);
  assert.equal(canAcceptSessionAttempt(advanceSessionClock(clock, startedAt + 9_999), startedAt + 9_999), false);
  const started = advanceSessionClock(clock, startedAt + 10_000);
  assert.equal(countdownView(started, startedAt + 10_000, joinedAt, COUNTDOWN).phase, 'active');
  assert.equal(canAcceptSessionAttempt(started, startedAt + 10_001), true);
});

test('late join mid-countdown only waits for the remaining shared countdown', () => {
  const startedAt = 100_000;
  const joinedAt = startedAt + 6_500;
  const clock = createSessionClock(joinedAt, 60, COUNTDOWN, startedAt);
  const view = countdownView(clock, joinedAt, joinedAt, COUNTDOWN);
  assert.equal(view.phase, 'countdown');
  assert.equal(view.secondsUntilStart, 4);
  assert.equal(view.joinedLate, true);
  assert.equal(view.skippedCountdown, false);
  assert.match(countdownMessage(view, true, 'Riley'), /joined late — countdown synced with Riley/);
});

test('late join after the countdown starts tracking immediately with the shared deadline', () => {
  const startedAt = 100_000;
  const joinedAt = startedAt + 25_000;
  const clock = createSessionClock(joinedAt, 60, COUNTDOWN, startedAt);
  assert.equal(canAcceptSessionAttempt(clock, joinedAt), true);
  const view = countdownView(clock, joinedAt, joinedAt, COUNTDOWN);
  assert.equal(view.phase, 'active');
  assert.equal(view.secondsUntilStart, 0);
  assert.equal(view.secondsRemaining, 45);
  assert.equal(view.skippedCountdown, true);
  assert.match(countdownMessage(view, true), /tracking started immediately\. 45s left/);
});

test('joining after the shared deadline is expired and says so', () => {
  const startedAt = 100_000;
  const joinedAt = startedAt + 90_000;
  const clock = createSessionClock(joinedAt, 60, COUNTDOWN, startedAt);
  const view = countdownView(clock, joinedAt, joinedAt, COUNTDOWN);
  assert.equal(view.phase, 'expired');
  assert.equal(view.joinedAfterDeadline, true);
  assert.equal(canAcceptSessionAttempt(clock, joinedAt), false);
  assert.match(countdownMessage(view, true), /after the challenge deadline/);
});

test('solo countdown keeps its local reference and solo copy', () => {
  const joinedAt = 5_000;
  const clock = createSessionClock(joinedAt, 300, COUNTDOWN);
  const view = countdownView(clock, joinedAt, joinedAt, COUNTDOWN);
  assert.equal(view.phase, 'countdown');
  assert.equal(view.secondsUntilStart, 10);
  assert.equal(view.joinedLate, false);
  assert.equal(countdownMessage(view, false), 'Get ready. Pose tracking starts when the countdown reaches zero.');
  const active = advanceSessionClock(clock, joinedAt + 10_000);
  assert.equal(countdownMessage(countdownView(active, joinedAt + 10_000, joinedAt, COUNTDOWN), false), 'Time remaining: 300s');
});
