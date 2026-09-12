import assert from 'node:assert/strict';
import test from 'node:test';
import { ChallengeResultPoller, INITIAL_RESULT_POLL_STATE, resultPollSucceeded, type ChallengeResultSnapshot, type ResultPollState } from './resultPolling';
import { resultFixture } from './testFixtures';

const pending: ChallengeResultSnapshot = { results: [resultFixture('me')], resolution: { status: 'pending' } };
const resolved: ChallengeResultSnapshot = { results: [resultFixture('me'), resultFixture('them')], resolution: { status: 'resolved', winnerId: 'me', winningScore: 320 } };

function scripted(responses: (ChallengeResultSnapshot | Error)[]) {
  let calls = 0;
  const states: ResultPollState[] = [];
  const poller = new ChallengeResultPoller(async () => {
    const next = responses[Math.min(calls, responses.length - 1)]; calls += 1;
    if (next instanceof Error) throw next;
    return next as ChallengeResultSnapshot;
  }, (state) => states.push(state), () => 1_000);
  return { poller, states, calls: () => calls };
}

test('polling failures keep the last snapshot and a manual retry recovers', async () => {
  const { poller, calls } = scripted([pending, new Error('Challenge API request timed out after 8 seconds'), new Error('internal server error'), resolved]);
  await poller.tick();
  assert.equal(poller.current.status, 'ready');
  await poller.tick();
  assert.equal(poller.current.status, 'error');
  assert.equal(poller.current.error?.kind, 'network');
  assert.deepEqual(poller.current.snapshot, pending);
  await poller.tick();
  assert.equal(poller.current.consecutiveFailures, 2);
  assert.equal(poller.current.error?.kind, 'server');
  await poller.poll();
  assert.equal(poller.current.status, 'ready');
  assert.equal(poller.current.error, null);
  assert.equal(poller.current.consecutiveFailures, 0);
  assert.equal(calls(), 4);
});

test('concurrent retries share one in-flight request', async () => {
  const { poller, calls } = scripted([pending]);
  await Promise.all([poller.poll(), poller.poll(), poller.tick()]);
  assert.equal(calls(), 1);
});

test('scheduled polls stop once the server result is final; stopped pollers ignore late responses', async () => {
  const { poller, calls } = scripted([resolved]);
  await poller.tick(); await poller.tick(); await poller.tick();
  assert.equal(calls(), 1);
  const stopped = scripted([pending]);
  const inFlight = stopped.poller.poll(); stopped.poller.stop(); await inFlight;
  assert.equal(stopped.states.length, 0);
});

test('a final resolution never regresses to pending from a stale response', () => {
  const final = resultPollSucceeded(INITIAL_RESULT_POLL_STATE, resolved, 1);
  assert.deepEqual(resultPollSucceeded(final, pending, 2).snapshot, resolved);
});
