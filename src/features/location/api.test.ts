import assert from 'node:assert/strict';
import test from 'node:test';
import { checkApiHealth, fetchNearby } from './api';

const originalFetch = globalThis.fetch;

test('health and empty nearby responses remain distinct from offline errors', async () => {
  globalThis.fetch = async (input) => {
    const path = String(input);
    if (path.endsWith('/health')) return new Response(JSON.stringify({ ok: true }), { status: 200 });
    return new Response(JSON.stringify({ users: [] }), { status: 200 });
  };
  try {
    await checkApiHealth();
    assert.deepEqual(await fetchNearby('demo-a', { latitude: 1, longitude: 2 }), []);
  } finally { globalThis.fetch = originalFetch; }
});

test('health failures preserve useful server errors and timeouts are explicit', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'database unavailable' }), { status: 503 });
  try { await assert.rejects(checkApiHealth(), /database unavailable/); } finally { globalThis.fetch = originalFetch; }
  globalThis.fetch = async () => { throw Object.assign(new Error('aborted'), { name: 'AbortError' }); };
  try { await assert.rejects(fetchNearby('demo-a', { latitude: 1, longitude: 2 }), /timed out after 8 seconds/); } finally { globalThis.fetch = originalFetch; }
});
