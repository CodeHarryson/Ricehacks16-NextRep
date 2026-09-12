import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceSessionClock, canAcceptSessionAttempt, createSessionClock } from './sessionClock';

test('countdown blocks attempts and timer starts at zero', () => {
  const clock = createSessionClock(0, 300);
  assert.equal(canAcceptSessionAttempt(clock, 9_999), false);
  const started = advanceSessionClock(clock, 10_000);
  assert.equal(started.started, true);
  assert.equal(started.remainingSeconds, 300);
  assert.equal(canAcceptSessionAttempt(started, 10_001), true);
});
test('deadline blocks attempts while preserving the pre-timeout session boundary', () => {
  const clock = createSessionClock(0, 30);
  const beforeDeadline = advanceSessionClock(clock, 39_999);
  assert.equal(beforeDeadline.remainingSeconds, 1);
  assert.equal(canAcceptSessionAttempt(beforeDeadline, 39_999), true);
  const expired = advanceSessionClock(clock, 40_000);
  assert.equal(expired.expired, true);
  assert.equal(canAcceptSessionAttempt(expired, 40_001), false);
});
test('synchronized devices share a future countdown and deadline', () => {
  const future = createSessionClock(1_000, 30, 10, 5_000);
  assert.equal(future.countdownEndsAt, 15_000);
  assert.equal(advanceSessionClock(future, 9_000).started, false);
  const joined = advanceSessionClock(future, 16_000);
  assert.equal(joined.started, true);
  assert.equal(joined.remainingSeconds, 29);
});
test('a device joining after the shared deadline is immediately expired', () => {
  const late = createSessionClock(50_000, 30, 10, 5_000);
  assert.equal(late.started, true);
  assert.equal(late.expired, true);
  assert.equal(canAcceptSessionAttempt(late, 50_000), false);
});
test('solo sessions use a local countdown reference', () => {
  const solo = createSessionClock(1_000, 300);
  assert.equal(solo.countdownEndsAt, 11_000);
  assert.equal(advanceSessionClock(solo, 10_999).started, false);
  assert.equal(advanceSessionClock(solo, 11_000).started, true);
});
