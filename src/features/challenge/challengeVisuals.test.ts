import assert from 'node:assert/strict';
import test from 'node:test';
import { CHALLENGE_STATUS_VISUALS, ENDED_REASON_TONES, OPPONENT_STATUS_TONES, OUTCOME_VISUALS } from './components/challengeVisuals';

test('waiting, ready, active, expired, declined, and cancelled challenge states are visually distinct', () => {
  assert.equal(CHALLENGE_STATUS_VISUALS.pending.tone, 'warning');
  assert.equal(CHALLENGE_STATUS_VISUALS.ready.tone, 'info');
  assert.equal(CHALLENGE_STATUS_VISUALS.active.tone, 'success');
  assert.equal(CHALLENGE_STATUS_VISUALS.declined.tone, 'danger');
  assert.equal(CHALLENGE_STATUS_VISUALS.expired.label, 'Expired');
  assert.equal(CHALLENGE_STATUS_VISUALS.cancelled.label, 'Cancelled');
  assert.equal(ENDED_REASON_TONES.declined, 'danger');
});

test('every opponent status and result outcome has a visual treatment', () => {
  for (const status of ['waiting_for_opponent', 'opponent_ready', 'both_working_out', 'opponent_working_out', 'opponent_submitted', 'resolved', 'cancelled'] as const) assert.ok(OPPONENT_STATUS_TONES[status]);
  assert.deepEqual(Object.keys(OUTCOME_VISUALS).sort(), ['cancelled', 'draw', 'loss', 'pending', 'win']);
  assert.notEqual(OUTCOME_VISUALS.win.tone, OUTCOME_VISUALS.loss.tone);
});
