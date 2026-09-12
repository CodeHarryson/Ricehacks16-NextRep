import assert from 'node:assert/strict';
import test from 'node:test';
import { buildChallengeWorkoutSession, challengeSendBlock, detectEndedChallenges, openChallengeBetween, findActiveChallenge, mergeNotices, shouldAutoLaunchWorkout } from './challengeState';
import { describeChallengeError } from './errors';
import { challengeFixture } from './testFixtures';

const active = challengeFixture({ status: 'active', locked: true, startedAt: '2026-09-12T12:01:00.000Z', configuration: { exercise: 'bodyweight_squat', setCount: 2, targetReps: 6, restSeconds: 20, matchTimeLimitSeconds: 120, configVersion: 4 } });

test('active challenges build a locked session with the shared start and opponent name', () => {
  assert.deepEqual(buildChallengeWorkoutSession(active, 'me'), { mode: 'challenge', exercise: 'bodyweight_squat', setCount: 2, targetReps: 6, restSeconds: 20, matchTimeLimitSeconds: 120, configVersion: 4, challengeId: 'c1', startedAt: '2026-09-12T12:01:00.000Z', opponentName: 'Riley' });
  assert.equal(buildChallengeWorkoutSession(active, 'them')?.opponentName, 'Me');
  assert.equal(buildChallengeWorkoutSession({ ...active, startedAt: null }, 'me'), null);
  assert.equal(findActiveChallenge([challengeFixture(), active], 'me'), active);
  assert.equal(findActiveChallenge([active], 'stranger'), undefined);
});

test('a challenge auto-launches once, so returning to the map cannot relaunch it', () => {
  assert.equal(shouldAutoLaunchWorkout(active, new Set()), true);
  assert.equal(shouldAutoLaunchWorkout(active, new Set(['c1'])), false);
  assert.equal(shouldAutoLaunchWorkout({ ...active, status: 'ready' }, new Set()), false);
  assert.equal(shouldAutoLaunchWorkout({ ...active, startedAt: null }, new Set()), false);
  assert.equal(shouldAutoLaunchWorkout(undefined, new Set()), false);
});

test('ended challenges surface as expired, declined, or cancelled notices', () => {
  const previous = [challengeFixture({ challengeId: 'gone' }), challengeFixture({ challengeId: 'declined' }), challengeFixture({ challengeId: 'cancelled', status: 'active' }), challengeFixture({ challengeId: 'still-open' }), challengeFixture({ challengeId: 'already-declined', status: 'declined' })];
  const next = [challengeFixture({ challengeId: 'declined', status: 'declined' }), challengeFixture({ challengeId: 'cancelled', status: 'cancelled' }), challengeFixture({ challengeId: 'still-open' }), challengeFixture({ challengeId: 'already-declined', status: 'declined' })];
  assert.deepEqual(detectEndedChallenges(previous, next, 'me').map((notice) => [notice.challengeId, notice.reason, notice.opponentName]), [['gone', 'expired', 'Riley'], ['declined', 'declined', 'Riley'], ['cancelled', 'cancelled', 'Riley']]);
  // The receiver declined it themselves, so they get no notice.
  assert.deepEqual(detectEndedChallenges(previous, next, 'them').map((notice) => notice.reason), ['expired', 'cancelled']);
  const once = detectEndedChallenges(previous, next, 'me');
  assert.equal(mergeNotices(once, once).length, 3);
});

test('network failures get readable retry copy; server errors keep their message', () => {
  assert.equal(describeChallengeError(new Error('Challenge API request timed out after 8 seconds'), 'x').kind, 'network');
  assert.equal(describeChallengeError(new TypeError('Network request failed'), 'x').kind, 'network');
  assert.deepEqual(describeChallengeError(new Error('user is outside the challenge radius'), 'x'), { kind: 'server', message: 'user is outside the challenge radius' });
  assert.deepEqual(describeChallengeError('boom', 'Could not load challenges.'), { kind: 'server', message: 'Could not load challenges.' });
});

test('duplicate challenges are blocked until the list loads, while busy, and while any open challenge exists', () => {
  const base = { userId: 'me', hasLoaded: true, busy: false, challenges: [] as ReturnType<typeof challengeFixture>[], opponentId: 'them' };
  assert.equal(challengeSendBlock(base), null);
  assert.equal(challengeSendBlock({ ...base, userId: null }), 'no_identity');
  assert.equal(challengeSendBlock({ ...base, hasLoaded: false }), 'loading');
  assert.equal(challengeSendBlock({ ...base, busy: true }), 'busy');
  for (const status of ['pending', 'accepted', 'configuring', 'ready', 'active'] as const) {
    assert.equal(challengeSendBlock({ ...base, challenges: [challengeFixture({ status })] }), 'open_challenge', status);
  }
  // Re-entry sees the receiver side too, and finished challenges do not block a rematch.
  assert.ok(openChallengeBetween([challengeFixture({ senderId: 'them', receiverId: 'me' })], 'me', 'them'));
  for (const status of ['declined', 'expired', 'cancelled'] as const) assert.equal(challengeSendBlock({ ...base, challenges: [challengeFixture({ status })] }), null, status);
  // A challenge with a different player does not block this one.
  assert.equal(challengeSendBlock({ ...base, challenges: [challengeFixture({ receiverId: 'someone-else' })] }), null);
});

test('a started challenge that leaves the list is not reported as expired', () => {
  assert.deepEqual(detectEndedChallenges([challengeFixture({ status: 'active' })], [], 'me'), []);
});
