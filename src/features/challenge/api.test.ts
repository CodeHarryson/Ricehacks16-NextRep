import assert from 'node:assert/strict';
import test from 'node:test';
import { listChallenges } from './api';

test('challenge client parses challenge lists and surfaces API errors', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ challenges: [{ challengeId: 'c', status: 'pending' }] }), { status: 200 });
  await assert.doesNotReject(async () => { assert.equal((await listChallenges('demo')).length, 1); });
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'outside radius' }), { status: 409 });
  await assert.rejects(listChallenges('demo'), /outside radius/);
  globalThis.fetch = originalFetch;
});
