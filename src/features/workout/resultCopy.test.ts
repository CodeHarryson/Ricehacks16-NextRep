import test from 'node:test';
import assert from 'node:assert/strict';
import { challengeScoreResolutionCopy } from './resultCopy';

test('challenge score copy distinguishes pending and resolved server states', () => {
  assert.equal(challengeScoreResolutionCopy('pending'), 'Waiting for server resolution.');
  assert.equal(challengeScoreResolutionCopy('resolved'), 'Server resolution complete.');
  assert.equal(challengeScoreResolutionCopy('cancelled'), 'Challenge cancelled — opponent did not submit.');
});
