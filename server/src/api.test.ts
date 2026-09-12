import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from './api.js';

test('health and presence input errors are handled without a database write', async () => {
  const queries: string[] = [];
  const app = createApp({ query: async (sql: string) => { queries.push(sql); return { rows: [], rowCount: 0 }; } });
  assert.deepEqual(await (await app.request('http://local/health', { method: 'POST' })).json(), { ok: true });
  const response = await app.request('http://local/presence', { method: 'POST', body: JSON.stringify({ latitude: 200 }) });
  assert.equal(response.status, 400);
  assert.equal(queries.length, 0);
});

test('nearby response returns quantized server distances and excludes self in the SQL contract', async () => {
  let queryText = '';
  const app = createApp({ query: async <T>(sql: string) => {
    queryText = sql;
    return { rows: [{ user_id: 'other', display_name: 'Other', latitude: 29.760234, longitude: -95.369876, captured_at: new Date(1_700_000_000_000), distance_meters: 123.6 } as T], rowCount: 1 };
  } });
  const response = await app.request('http://local/presence/nearby?latitude=29.76&longitude=-95.37', { headers: { 'x-user-id': 'self' } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { users: [{ userId: 'other', displayName: 'Other', position: { latitude: 29.7602, longitude: -95.3699 }, distanceMeters: 124, lastSeenAt: '2023-11-14T22:13:20.000Z' }] });
  assert.match(queryText, /DISTINCT ON \(user_id\)/);
  assert.match(queryText, /user_id <> \$3/);
  assert.match(queryText, /ST_DWithin/);
});
