import assert from 'node:assert/strict';
import test from 'node:test';
import type { Challenge } from './api';
import { clearChallengeCacheForTesting, readChallengeCache, writeChallengeCache } from './challengeListCache';
import { detectEndedChallenges } from './challengeState';
import { connectionCopy, connectionStatus, formatSyncTime, UNAVAILABLE_AFTER_FAILURES } from './connectionStatus';
import { initialSyncState, SyncPoller, type SyncState } from './syncPoller';
import { challengeFixture } from './testFixtures';

test('temporary network failures keep the last known challenge list and report reconnecting, then unavailable', async () => {
  const known = [challengeFixture({ status: 'configuring' })];
  const responses: (Challenge[] | Error)[] = [known, new Error('Challenge API request timed out after 8 seconds'), new Error('Network request failed'), new Error('Network request failed'), [challengeFixture({ status: 'ready' })]];
  let index = 0; let clock = 1_000;
  const states: SyncState<Challenge[]>[] = [];
  const poller = new SyncPoller<Challenge[]>(async () => { const next = responses[index++]; if (next instanceof Error) throw next; return next as Challenge[]; }, (state) => states.push(state), { now: () => clock });
  assert.equal(connectionStatus(poller.current), 'connecting');
  await poller.poll();
  assert.equal(connectionStatus(poller.current), 'connected');
  clock = 6_000; await poller.poll();
  assert.equal(connectionStatus(poller.current), 'reconnecting');
  assert.deepEqual(poller.current.snapshot, known);
  assert.equal(poller.current.lastUpdatedAt, 1_000);
  await poller.poll(); await poller.poll();
  assert.equal(poller.current.consecutiveFailures, UNAVAILABLE_AFTER_FAILURES);
  assert.equal(connectionStatus(poller.current), 'unavailable');
  assert.deepEqual(poller.current.snapshot, known, 'last known state survives repeated failures');
  clock = 20_000; await poller.poll();
  assert.equal(connectionStatus(poller.current), 'connected');
  assert.equal(poller.current.snapshot?.[0]?.status, 'ready');
  assert.equal(poller.current.lastUpdatedAt, 20_000);
});

test('retry actions join the in-flight request instead of duplicating it', async () => {
  let calls = 0;
  const poller = new SyncPoller(async () => { calls += 1; await new Promise((resolve) => setImmediate(resolve)); return calls; }, () => undefined);
  await Promise.all([poller.poll(), poller.poll(), poller.tick(), poller.poll()]);
  assert.equal(calls, 1);
  await poller.poll();
  assert.equal(calls, 2);
});

test('connection copy shows the last synced time and offers retry only while degraded', () => {
  const at = new Date(2026, 8, 12, 9, 5, 7).getTime();
  assert.equal(formatSyncTime(at), '09:05:07');
  assert.deepEqual(connectionCopy('connected', at), { label: 'Connected', detail: 'Last synced 09:05:07', tone: 'success', showRetry: false });
  assert.equal(connectionCopy('reconnecting', at).showRetry, true);
  assert.match(connectionCopy('unavailable', null).detail, /Not synced yet · showing last known state/);
  assert.equal(connectionCopy('unavailable', at).label, 'Server unavailable');
});

test('re-entering the challenge screen restores the cached list and detects expiry while away', () => {
  clearChallengeCacheForTesting();
  const pending = challengeFixture({ challengeId: 'waiting', status: 'pending' });
  writeChallengeCache('me', [pending], 5_000);
  assert.equal(readChallengeCache('someone-else'), null);
  const cached = readChallengeCache('me');
  assert.deepEqual(initialSyncState(cached), { status: 'ready', snapshot: [pending], error: null, consecutiveFailures: 0, lastUpdatedAt: 5_000 });
  // The first live poll after re-entry no longer contains it: the server hides expired challenges.
  assert.deepEqual(detectEndedChallenges(cached?.snapshot ?? [], [], 'me').map((notice) => notice.reason), ['expired']);
  clearChallengeCacheForTesting();
});
