import assert from 'node:assert/strict';
import test from 'node:test';
import { createDiagnosticsStore, diagnosticsEnabled, INITIAL_DIAGNOSTICS } from './diagnosticsStore';

test('diagnostics are enabled only for development builds', () => {
  assert.equal(diagnosticsEnabled(true), true);
  assert.equal(diagnosticsEnabled(false), false);
  assert.equal(diagnosticsEnabled(undefined), false);
  assert.equal(diagnosticsEnabled('true'), false);
});

test('diagnostics store merges updates and notifies only on change', () => {
  const store = createDiagnosticsStore();
  let notifications = 0;
  const unsubscribe = store.subscribe(() => { notifications += 1; });
  store.update({ userId: 'demo-1', lastChallengeSyncAt: 10 });
  store.update({ userId: 'demo-1' });
  store.update({ lastResultSyncAt: 20, challengeId: 'c1' });
  assert.equal(notifications, 2);
  assert.deepEqual(store.get(), { ...INITIAL_DIAGNOSTICS, userId: 'demo-1', lastChallengeSyncAt: 10, lastResultSyncAt: 20, challengeId: 'c1' });
  unsubscribe();
  store.update({ locationMode: 'simulated (Test Player A)' });
  assert.equal(notifications, 2);
});
