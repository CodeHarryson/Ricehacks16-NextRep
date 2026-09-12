import assert from 'node:assert/strict';
import test from 'node:test';
import { OPPONENT_STATUS_COPY, opponentStatusFromChallenge, opponentStatusFromResults } from './opponentStatus';
import { challengeFixture, resultFixture } from './testFixtures';

test('pre-workout opponent status follows the challenge handshake for either participant', () => {
  const pending = challengeFixture({ status: 'pending' });
  assert.equal(opponentStatusFromChallenge(pending, 'me'), 'waiting_for_opponent');
  assert.equal(opponentStatusFromChallenge(pending, 'them'), 'opponent_ready');
  const configuring = challengeFixture({ status: 'configuring', acceptance: { senderAcceptedAt: '2026-09-12T12:00:30.000Z', receiverAcceptedAt: null } });
  assert.equal(opponentStatusFromChallenge(configuring, 'me'), 'waiting_for_opponent');
  assert.equal(opponentStatusFromChallenge(configuring, 'them'), 'opponent_ready');
  assert.equal(opponentStatusFromChallenge(challengeFixture({ status: 'ready' }), 'me'), 'opponent_ready');
  assert.equal(opponentStatusFromChallenge(challengeFixture({ status: 'active' }), 'me'), 'both_working_out');
  for (const status of ['declined', 'expired', 'cancelled'] as const) assert.equal(opponentStatusFromChallenge(challengeFixture({ status }), 'me'), 'cancelled');
});

test('in-workout opponent status transitions through submission to resolution', () => {
  const pending = { status: 'pending' as const };
  const steps = [
    opponentStatusFromResults({ userId: 'me', results: [], resolution: pending, localSubmitted: false }),
    opponentStatusFromResults({ userId: 'me', results: [], resolution: pending, localSubmitted: true }),
    opponentStatusFromResults({ userId: 'me', results: [resultFixture('me')], resolution: pending, localSubmitted: false }),
    opponentStatusFromResults({ userId: 'me', results: [resultFixture('me'), resultFixture('them')], resolution: pending, localSubmitted: true }),
    opponentStatusFromResults({ userId: 'me', results: [resultFixture('me'), resultFixture('them')], resolution: { status: 'resolved', winnerId: 'me', winningScore: 320 }, localSubmitted: true }),
  ];
  assert.deepEqual(steps, ['both_working_out', 'opponent_working_out', 'opponent_working_out', 'opponent_submitted', 'resolved']);
  assert.equal(opponentStatusFromResults({ userId: 'me', results: [resultFixture('them')], resolution: pending, localSubmitted: false }), 'opponent_submitted');
  assert.equal(opponentStatusFromResults({ userId: 'me', results: [resultFixture('me')], resolution: { status: 'cancelled' }, localSubmitted: true }), 'cancelled');
});

test('every opponent status has readable copy', () => {
  assert.equal(OPPONENT_STATUS_COPY.waiting_for_opponent.label, 'Waiting for opponent');
  assert.equal(OPPONENT_STATUS_COPY.opponent_ready.label, 'Opponent ready');
  assert.equal(OPPONENT_STATUS_COPY.both_working_out.label, 'Both players working out');
  assert.equal(OPPONENT_STATUS_COPY.opponent_submitted.label, 'Opponent submitted');
  assert.equal(OPPONENT_STATUS_COPY.resolved.label, 'Challenge resolved');
});
