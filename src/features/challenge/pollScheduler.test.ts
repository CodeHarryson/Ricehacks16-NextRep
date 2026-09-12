import assert from 'node:assert/strict';
import test from 'node:test';
import { PollScheduler, type TimerApi } from './pollScheduler';
import { ChallengeResultPoller, type ChallengeResultSnapshot } from './resultPolling';
import { SyncPoller } from './syncPoller';
import { resultFixture } from './testFixtures';

function fakeTimers() {
  let nextId = 1;
  const intervals = new Map<number, () => void>();
  const api: TimerApi = { setInterval: (callback) => { const id = nextId++; intervals.set(id, callback); return id; }, clearInterval: (handle) => { intervals.delete(handle as number); } };
  return { api, fire: () => [...intervals.values()].forEach((callback) => callback()), get active() { return intervals.size; } };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));

test('polling pauses in the background and refreshes immediately when the app returns to the foreground', async () => {
  let calls = 0;
  const poller = new SyncPoller(async () => { calls += 1; return calls; }, () => undefined);
  const timers = fakeTimers();
  const scheduler = new PollScheduler(poller, 5_000, timers.api);
  scheduler.start();
  await flush();
  assert.equal(calls, 1);
  timers.fire(); await flush();
  assert.equal(calls, 2);
  scheduler.setAppActive(false);
  assert.equal(timers.active, 0);
  timers.fire(); await flush();
  assert.equal(calls, 2);
  scheduler.setAppActive(true);
  await flush();
  assert.equal(calls, 3);
  assert.equal(timers.active, 1);
  scheduler.stop();
  assert.equal(timers.active, 0);
});

test('scheduled polling stops after a final resolution, including after a foreground return', async () => {
  const resolved: ChallengeResultSnapshot = { results: [resultFixture('me'), resultFixture('them')], resolution: { status: 'resolved', winnerId: 'me', winningScore: 320 } };
  let calls = 0;
  const poller = new ChallengeResultPoller(async () => { calls += 1; return resolved; }, () => undefined);
  const timers = fakeTimers();
  const scheduler = new PollScheduler(poller, 5_000, timers.api);
  scheduler.start();
  await flush();
  assert.equal(calls, 1);
  assert.equal(timers.active, 0);
  scheduler.setAppActive(false);
  scheduler.setAppActive(true);
  await flush();
  assert.equal(calls, 1);
  assert.equal(scheduler.isScheduled, false);
});

test('a slow request is never overlapped by interval ticks or retries', async () => {
  let calls = 0;
  let release: (() => void) | null = null;
  const poller = new SyncPoller(() => { calls += 1; return new Promise<number>((resolve) => { release = () => resolve(calls); }); }, () => undefined);
  const timers = fakeTimers();
  const scheduler = new PollScheduler(poller, 5_000, timers.api);
  scheduler.start();
  timers.fire(); timers.fire();
  void poller.poll(); void poller.poll();
  scheduler.setAppActive(false); scheduler.setAppActive(true);
  assert.equal(calls, 1);
  (release as (() => void) | null)?.();
  await flush();
  timers.fire(); await flush();
  assert.equal(calls, 2);
  scheduler.stop();
});
