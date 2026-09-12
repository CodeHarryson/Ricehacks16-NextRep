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
