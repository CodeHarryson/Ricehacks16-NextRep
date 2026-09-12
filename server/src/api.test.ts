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

const challengeRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  challenge_id: 'c1', sender_id: 'sender', receiver_id: 'receiver', sender_display_name: 'Sender', receiver_display_name: 'Receiver', status: 'pending',
  created_at: new Date('2026-09-12T12:00:00Z'), expires_at: new Date('2026-09-12T12:02:00Z'), accepted_at: null, proximity_meters: 42, ...overrides,
});

test('challenge creation validates identity, active presence, radius, and duplicate pending requests', async () => {
  const invalid = createApp({ query: async () => ({ rows: [], rowCount: 0 }) });
  assert.equal((await invalid.request('http://local/challenges', { method: 'POST', body: JSON.stringify({ receiverId: 'r' }) })).status, 400);
  const missingPresence = createApp({ query: async () => ({ rows: [], rowCount: 0 }) });
  const noPresence = await missingPresence.request('http://local/challenges', { method: 'POST', headers: { 'x-user-id': 's', 'x-display-name': 'S' }, body: JSON.stringify({ receiverId: 'r' }) });
  assert.equal(noPresence.status, 409);
  const outside = createApp({ query: async <T>() => ({ rows: [{ receiver_display_name: 'R', proximity_meters: 251 } as T], rowCount: 1 }) });
  const outsideResponse = await outside.request('http://local/challenges', { method: 'POST', headers: { 'x-user-id': 's', 'x-display-name': 'S' }, body: JSON.stringify({ receiverId: 'r' }) });
  assert.equal(outsideResponse.status, 409);
  let call = 0;
  const duplicate = createApp({ query: async <T>() => { call += 1; return call === 1 ? { rows: [{ receiver_display_name: 'R', proximity_meters: 20 } as T], rowCount: 1 } : { rows: [{ challenge_id: 'existing' } as T], rowCount: 1 }; } });
  const duplicateResponse = await duplicate.request('http://local/challenges', { method: 'POST', headers: { 'x-user-id': 's', 'x-display-name': 'S' }, body: JSON.stringify({ receiverId: 'r' }) });
  assert.equal(duplicateResponse.status, 409);
});

test('challenge creation, listing, receiver-only responses, expiry, and retries are safe', async () => {
  let mode = 'create';
  const db = { query: async <T>(sql: string) => {
    if (mode === 'create' && sql.includes('INSERT INTO challenges')) return { rows: [challengeRow() as T], rowCount: 1 };
    if (mode === 'create' && sql.includes('presence_events')) return { rows: [{ receiver_display_name: 'Receiver', proximity_meters: 42 } as T], rowCount: 1 };
    if (mode === 'create') return { rows: [], rowCount: 0 };
    if (mode === 'list' && sql.startsWith('UPDATE')) return { rows: [], rowCount: 0 };
    if (mode === 'list') return { rows: [challengeRow() as T], rowCount: 1 };
    if (mode === 'accepted' && sql.includes("status = 'accepted'")) return { rows: [challengeRow({ status: 'accepted', accepted_at: new Date('2026-09-12T12:01:00Z') }) as T], rowCount: 1 };
    if (mode === 'accepted') return { rows: [challengeRow({ status: 'accepted' }) as T], rowCount: 1 };
    if (mode === 'declined' && sql.includes("status = 'declined'")) return { rows: [challengeRow({ status: 'declined' }) as T], rowCount: 1 };
    if (mode === 'declined') return { rows: [challengeRow({ status: 'declined' }) as T], rowCount: 1 };
    if (mode === 'expired' && sql.startsWith('UPDATE')) return { rows: [], rowCount: 0 };
    return { rows: [challengeRow({ status: 'expired' }) as T], rowCount: 1 };
  } };
  const app = createApp(db);
  const created = await app.request('http://local/challenges', { method: 'POST', headers: { 'x-user-id': 'sender', 'x-display-name': 'Sender' }, body: JSON.stringify({ receiverId: 'receiver' }) });
  assert.equal(created.status, 201);
  assert.equal((await created.json()).challenge.proximityMeters, 42);
  mode = 'list';
  const listed = await app.request('http://local/challenges', { headers: { 'x-user-id': 'receiver' } });
  assert.equal((await listed.json()).challenges.length, 1);
  const unauthorized = await app.request('http://local/challenges/c1/accept', { method: 'POST', headers: { 'x-user-id': 'other' } });
  assert.equal(unauthorized.status, 409);
  mode = 'accepted';
  const accepted = await app.request('http://local/challenges/c1/accept', { method: 'POST', headers: { 'x-user-id': 'receiver' } });
  assert.equal((await accepted.json()).challenge.status, 'accepted');
  const acceptedRetry = await app.request('http://local/challenges/c1/accept', { method: 'POST', headers: { 'x-user-id': 'receiver' } });
  assert.equal(acceptedRetry.status, 200);
  mode = 'declined';
  const declined = await app.request('http://local/challenges/c1/decline', { method: 'POST', headers: { 'x-user-id': 'receiver' } });
  assert.equal((await declined.json()).challenge.status, 'declined');
  const declinedRetry = await app.request('http://local/challenges/c1/decline', { method: 'POST', headers: { 'x-user-id': 'receiver' } });
  assert.equal(declinedRetry.status, 200);
  mode = 'expired';
  const expired = await app.request('http://local/challenges/c1/accept', { method: 'POST', headers: { 'x-user-id': 'receiver' } });
  assert.equal(expired.status, 409);
});
