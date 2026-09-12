import assert from 'node:assert/strict';
import test from 'node:test';
import { getChallenge, listChallenges, updateChallengeConfig } from './api';

test('challenge client parses challenge lists and surfaces API errors', async () => {
  const originalFetch = globalThis.fetch;
  const challenge = { challengeId: 'c', status: 'configuring', configuration: { exercise: 'bodyweight_squat', setCount: 1, targetReps: 5, restSeconds: 30, matchTimeLimitSeconds: 300, configVersion: 1 }, acceptance: { senderAcceptedAt: null, receiverAcceptedAt: null }, locked: false };
  globalThis.fetch = async () => new Response(JSON.stringify({ challenges: [challenge] }), { status: 200 });
  await assert.doesNotReject(async () => { assert.equal((await listChallenges('demo')).length, 1); });
  globalThis.fetch = async () => new Response(JSON.stringify({ challenge }), { status: 200 });
  assert.equal((await getChallenge('demo', 'c')).configuration.configVersion, 1);
  globalThis.fetch = async () => new Response(JSON.stringify({ challenge }), { status: 200 });
  assert.equal((await updateChallengeConfig('demo', 'c', { exercise: 'bodyweight_squat', setCount: 1, targetReps: 5, restSeconds: 30, matchTimeLimitSeconds: 300 })).status, 'configuring');
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'outside radius' }), { status: 409 });
  await assert.rejects(listChallenges('demo'), /outside radius/);
  globalThis.fetch = originalFetch;
});
