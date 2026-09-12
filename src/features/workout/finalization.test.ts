import assert from 'node:assert/strict';
import test from 'node:test';
import { resultStatusAfter } from './finalization';

test('finalization state never reports submitted before server confirmation', () => {
  let status = resultStatusAfter('not_started', 'begin');
  status = resultStatusAfter(status, 'local_saved');
  assert.equal(status, 'saved');
  status = resultStatusAfter(status, 'submission_started');
  assert.equal(status, 'submission_pending');
  assert.equal(resultStatusAfter(status, 'submitted'), 'submitted');
  assert.equal(resultStatusAfter('failed', 'begin'), 'saving');
});

test('duplicate completion/timeout events do not change a submitted result', () => {
  assert.equal(resultStatusAfter('submitted', 'begin'), 'submitted');
  assert.equal(resultStatusAfter('submitted', 'failed'), 'submitted');
});
