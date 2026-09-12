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

type ChallengeFixture = { challenge_id: string; sender_id: string; receiver_id: string; sender_display_name: string; receiver_display_name: string; status: string; created_at: Date; expires_at: Date; accepted_at: Date | null; proximity_meters: number; exercise?: string; set_count?: number; target_reps?: number; rest_seconds?: number; match_time_limit_seconds?: number; config_version?: number; sender_accepted_at?: Date | null; receiver_accepted_at?: Date | null; started_at?: Date | null };
const challengeRow = (overrides: Partial<ChallengeFixture> = {}): ChallengeFixture => ({
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

test('challenge listing and detail hide every expired lifecycle state', async () => {
  const future = new Date(Date.now() + 60_000);
  const db = { query: async <T>(sql: string) => {
    if (sql.startsWith('UPDATE challenges')) return { rows: [], rowCount: 0 };
    if (sql.startsWith('SELECT * FROM challenges WHERE (sender_id')) {
      assert.match(sql, /expires_at > NOW\(\)/);
      return { rows: [challengeRow({ status: 'pending', expires_at: future })] as T[], rowCount: 1 };
    }
    if (sql.startsWith('SELECT * FROM challenges WHERE challenge_id')) {
      assert.match(sql, /expires_at > NOW\(\)/);
      return { rows: [] as T[], rowCount: 0 };
    }
    return { rows: [], rowCount: 0 };
  } };
  const app = createApp(db);
  const listed = await app.request('http://local/challenges', { headers: { 'x-user-id': 'sender' } });
  assert.deepEqual((await listed.json()).challenges.map((challenge: { challengeId: string }) => challenge.challengeId), ['c1']);
  const detail = await app.request('http://local/challenges/expired', { headers: { 'x-user-id': 'sender' } });
  assert.equal(detail.status, 404);
});

test('shared configuration validates, resets acceptance, reaches ready, and starts idempotently', async () => {
  const row = challengeRow({ status: 'accepted', exercise: 'bodyweight_squat', set_count: 1, target_reps: 5, rest_seconds: 30, match_time_limit_seconds: 300, config_version: 1, sender_accepted_at: null, receiver_accepted_at: null, started_at: null });
  let current = { ...row };
  const db = { query: async <T>(sql: string) => {
    if (sql.includes('UPDATE challenges SET exercise')) { current = { ...current, status: 'configuring', set_count: 2, config_version: Number(current.config_version) + 1, sender_accepted_at: null, receiver_accepted_at: null }; return { rows: [current as T], rowCount: 1 }; }
    if (sql.includes('UPDATE challenges SET') && sql.includes('sender_accepted_at = CASE')) { const caller = 'sender'; current = { ...current, sender_accepted_at: new Date() }; if (caller === current.receiver_id || current.receiver_accepted_at) current.status = 'ready'; return { rows: [current as T], rowCount: 1 }; }
    if (sql.includes('UPDATE challenges SET') && sql.includes("status = 'active'")) { current = { ...current, status: 'active', started_at: new Date() }; return { rows: [current as T], rowCount: 1 }; }
    if (sql.startsWith('UPDATE challenges SET status = \'expired\'')) return { rows: [], rowCount: 0 };
    if (sql.startsWith('SELECT * FROM challenges')) return { rows: [current as T], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  } };
  const app = createApp(db);
  const base = 'http://local/challenges/c1';
  const get = await app.request(base, { headers: { 'x-user-id': 'sender' } });
  assert.equal((await get.json()).challenge.configuration.targetReps, 5);
  const invalid = await app.request(`${base}/config`, { method: 'PATCH', headers: { 'x-user-id': 'sender', 'content-type': 'application/json' }, body: JSON.stringify({ exercise: 'pushup', setCount: 1, targetReps: 5, restSeconds: 30, matchTimeLimitSeconds: 300 }) });
  assert.equal(invalid.status, 400);
  const updated = await app.request(`${base}/config`, { method: 'PATCH', headers: { 'x-user-id': 'sender', 'content-type': 'application/json' }, body: JSON.stringify({ exercise: 'bodyweight_squat', setCount: 2, targetReps: 5, restSeconds: 30, matchTimeLimitSeconds: 300 }) });
  assert.equal((await updated.json()).challenge.configuration.configVersion, 2);
  const senderAccept = await app.request(`${base}/accept-config`, { method: 'POST', headers: { 'x-user-id': 'sender' } });
  assert.equal((await senderAccept.json()).challenge.status, 'configuring');
  current = { ...current, receiver_accepted_at: new Date() };
  const receiverAccept = await app.request(`${base}/accept-config`, { method: 'POST', headers: { 'x-user-id': 'receiver' } });
  assert.equal((await receiverAccept.json()).challenge.status, 'ready');
  const started = await app.request(`${base}/start`, { method: 'POST', headers: { 'x-user-id': 'sender' } });
  assert.equal((await started.json()).challenge.status, 'active');
  const startRetry = await app.request(`${base}/start`, { method: 'POST', headers: { 'x-user-id': 'sender' } });
  assert.equal(startRetry.status, 200);
});

test('challenge result submission recalculates score and is retry-safe', async () => {
  const challenge = challengeRow({ status: 'active', config_version: 2, exercise: 'bodyweight_squat', set_count: 1, target_reps: 5, started_at: new Date(Date.now() - 20_000), expires_at: new Date(Date.now() + 60_000) });
  const stored = { result_id: 'r1', challenge_id: 'c1', participant_id: 'sender', config_version: 2, exercise: 'bodyweight_squat', counted_reps: 2, green_reps: 1, yellow_reps: 1, red_attempts: 1, neutral_attempts: 1, total_score: 210, score_policy_version: 'score-v1', started_at: new Date(1), ended_at: new Date(2), submitted_at: new Date(3), idempotency_key: 'k1' };
  let inserted = false;
  const db = { query: async <T>(sql: string) => {
    if (sql.includes('SELECT * FROM challenges')) return { rows: [challenge as T], rowCount: 1 };
    if (sql.includes('challenge_participant_results') && sql.startsWith('SELECT') && sql.includes('participant_id')) return { rows: inserted ? [stored as T] : [], rowCount: inserted ? 1 : 0 };
    if (sql.includes('INSERT INTO challenge_participant_results')) { inserted = true; return { rows: [], rowCount: 1 }; }
    if (sql.includes('challenge_participant_results')) return { rows: [stored as T], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  } };
  const app = createApp(db);
  const request = { configVersion: 2, exercise: 'bodyweight_squat', countedReps: 99, greenReps: 1, yellowReps: 1, redAttempts: 1, neutralAttempts: 1, totalScore: 9999, startedAt: new Date(Date.now() - 10_000).toISOString(), endedAt: new Date(Date.now() - 1_000).toISOString(), idempotencyKey: 'k1' };
  const first = await app.request('http://local/challenges/c1/result', { method: 'POST', headers: { 'x-user-id': 'sender', 'x-idempotency-key': 'k1' }, body: JSON.stringify(request) });
  assert.equal(first.status, 201); assert.equal((await first.json()).result.totalScore, 210);
  const retry = await app.request('http://local/challenges/c1/result', { method: 'POST', headers: { 'x-user-id': 'sender', 'x-idempotency-key': 'k1' }, body: JSON.stringify(request) });
  assert.equal(retry.status, 200);
});

test('challenge result timestamps are bounded by the shared server window', async () => {
  const startedAt = new Date(Date.now() - 20_000);
  const challenge = challengeRow({ status: 'active', config_version: 1, exercise: 'bodyweight_squat', set_count: 1, target_reps: 5, started_at: startedAt, match_time_limit_seconds: 30, expires_at: new Date(Date.now() + 60_000) });
  const db = { query: async <T>(sql: string) => sql.includes('SELECT * FROM challenges') ? { rows: [challenge as T], rowCount: 1 } : { rows: [], rowCount: 0 } };
  const app = createApp(db); const base = { configVersion: 1, exercise: 'bodyweight_squat', greenReps: 1, yellowReps: 0, redAttempts: 0, neutralAttempts: 0, idempotencyKey: 'window' };
  const send = (start: Date, end: Date) => app.request('http://local/challenges/c1/result', { method: 'POST', headers: { 'x-user-id': 'sender', 'x-idempotency-key': 'window' }, body: JSON.stringify({ ...base, startedAt: start.toISOString(), endedAt: end.toISOString() }) });
  assert.equal((await send(new Date(startedAt.getTime() - 1), new Date(startedAt.getTime() + 1000))).status, 400);
  assert.equal((await send(new Date(startedAt.getTime() + 11_000), new Date(startedAt.getTime() + 41_000))).status, 400);
  assert.equal((await send(new Date(startedAt.getTime() + 11_000), new Date(startedAt.getTime() + 10_000))).status, 400);
});

type ResolutionState = { resolution_status: string; winner_id: string | null; winning_score: number | null; resolved_at: Date | null };
type ResultFixture = { result_id: string; challenge_id: string; participant_id: string; config_version: number; exercise: string; counted_reps: number; green_reps: number; yellow_reps: number; red_attempts: number; neutral_attempts: number; total_score: number; score_policy_version: string; started_at: Date | string; ended_at: Date | string; submitted_at: Date | string; idempotency_key: string };

function resolutionDb(challenge: ChallengeFixture) {
  const results: ResultFixture[] = [];
  const resolution: ResolutionState = { resolution_status: 'pending', winner_id: null, winning_score: null, resolved_at: null };
  const queries: string[] = [];
  const db = { query: async <T>(sql: string, params: unknown[] = []) => {
    queries.push(sql);
    if (sql.includes('SELECT * FROM challenges') && sql.includes('(sender_id')) {
      const participant = String(params[1] ?? '');
      return ['sender', 'receiver'].includes(participant) ? { rows: [{ ...challenge, resolution_status: resolution.resolution_status } as T], rowCount: 1 } : { rows: [], rowCount: 0 };
    }
    if (sql.startsWith('SELECT * FROM challenge_participant_results WHERE challenge_id = $1 AND participant_id = $2')) {
      return { rows: results.filter((item) => item.participant_id === params[1]) as T[], rowCount: results.filter((item) => item.participant_id === params[1]).length };
    }
    if (sql.includes('INSERT INTO challenge_participant_results')) {
      const row: ResultFixture = { result_id: String(params[0]), challenge_id: String(params[1]), participant_id: String(params[2]), config_version: Number(params[3]), exercise: String(params[4]), counted_reps: Number(params[5]), green_reps: Number(params[6]), yellow_reps: Number(params[7]), red_attempts: Number(params[8]), neutral_attempts: Number(params[9]), total_score: Number(params[10]), score_policy_version: 'score-v1', started_at: new Date(String(params[11])), ended_at: new Date(String(params[12])), submitted_at: new Date(), idempotency_key: String(params[13]) };
      if (!results.some((item) => item.participant_id === row.participant_id)) results.push(row);
      return { rows: [], rowCount: 1 };
    }
    if (sql.startsWith('SELECT * FROM challenge_participant_results WHERE challenge_id = $1')) return { rows: results as T[], rowCount: results.length };
    if (sql.startsWith('UPDATE challenges SET resolution_status')) {
      if (resolution.resolution_status === 'pending') {
        resolution.resolution_status = sql.includes("= 'cancelled'") ? 'cancelled' : 'resolved';
        resolution.winner_id = resolution.resolution_status === 'cancelled' ? null : (params[1] == null ? null : String(params[1]));
        resolution.winning_score = resolution.resolution_status === 'cancelled' ? null : Number(params[2]);
        resolution.resolved_at = new Date();
      }
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes('SELECT resolution_status')) return { rows: [resolution as T], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  } };
  return { db, results, resolution, queries };
}

function resultRequest(startedAt: Date, endedAt: Date, greenReps: number, idempotencyKey: string) {
  return { configVersion: 1, exercise: 'bodyweight_squat', greenReps, yellowReps: 0, redAttempts: 0, neutralAttempts: 0, startedAt: startedAt.toISOString(), endedAt: endedAt.toISOString(), idempotencyKey };
}

test('real result routes resolve the higher score and preserve it on retries', async () => {
  const challenge = challengeRow({ status: 'active', exercise: 'bodyweight_squat', config_version: 1, set_count: 1, target_reps: 5, match_time_limit_seconds: 30, started_at: new Date(Date.now() - 20_000) });
  const { db, resolution, queries } = resolutionDb(challenge);
  const app = createApp(db);
  const start = new Date(Date.now() - 5_000); const end = new Date(Date.now() - 1_000);
  const post = (userId: string, green: number, key: string) => app.request('http://local/challenges/c1/result', { method: 'POST', headers: { 'x-user-id': userId, 'x-idempotency-key': key }, body: JSON.stringify(resultRequest(start, end, green, key)) });
  assert.equal((await post('sender', 2, 'sender-key')).status, 201);
  const second = await post('receiver', 3, 'receiver-key');
  assert.equal(second.status, 201);
  assert.equal(resolution.resolution_status, 'resolved');
  assert.equal(resolution.winner_id, 'receiver');
  assert.equal(resolution.winning_score, 330);
  assert.ok(queries.some((sql) => sql.includes('UPDATE challenges SET resolution_status')));
  const retry = await post('receiver', 1, 'receiver-key');
  assert.equal(retry.status, 200);
  assert.equal(resolution.winner_id, 'receiver');
  assert.equal(resolution.winning_score, 330);
  const resolved = await app.request('http://local/challenges/c1/results', { headers: { 'x-user-id': 'sender' } });
  assert.equal(resolved.status, 200);
  assert.deepEqual((await resolved.json()).resolution, { status: 'resolved', winnerId: 'receiver', winningScore: 330, resolvedAt: resolution.resolved_at?.toISOString() });
});

test('equal scores resolve as a draw and only participants can submit or read', async () => {
  const challenge = challengeRow({ status: 'active', exercise: 'bodyweight_squat', config_version: 1, set_count: 1, target_reps: 5, match_time_limit_seconds: 30, started_at: new Date(Date.now() - 20_000) });
  const { db, resolution } = resolutionDb(challenge); const app = createApp(db);
  const start = new Date(Date.now() - 5_000); const end = new Date(Date.now() - 1_000);
  const post = (userId: string) => app.request('http://local/challenges/c1/result', { method: 'POST', headers: { 'x-user-id': userId, 'x-idempotency-key': `${userId}-key` }, body: JSON.stringify(resultRequest(start, end, 2, `${userId}-key`)) });
  await post('sender'); await post('receiver');
  assert.equal(resolution.winner_id, null); assert.equal(resolution.winning_score, 220);
  assert.equal((await post('intruder')).status, 404);
  assert.equal((await app.request('http://local/challenges/c1/results', { headers: { 'x-user-id': 'intruder' } })).status, 404);
});

test('one result is cancelled after the deadline using the opponent no-show rule', async () => {
  const startedAt = new Date(Date.now() - 50_000);
  const challenge = challengeRow({ status: 'active', exercise: 'bodyweight_squat', config_version: 1, set_count: 1, target_reps: 5, match_time_limit_seconds: 30, started_at: startedAt });
  const { db, resolution } = resolutionDb(challenge); const app = createApp(db);
  const sessionStart = new Date(startedAt.getTime() + 10_000); const deadline = new Date(sessionStart.getTime() + 30_000);
  const response = await app.request('http://local/challenges/c1/result', { method: 'POST', headers: { 'x-user-id': 'sender', 'x-idempotency-key': 'timeout-key' }, body: JSON.stringify(resultRequest(sessionStart, deadline, 1, 'timeout-key')) });
  assert.equal(response.status, 201); assert.equal(resolution.resolution_status, 'cancelled'); assert.equal(resolution.winner_id, null); assert.equal(resolution.winning_score, null);
  const later = await app.request('http://local/challenges/c1/result', { method: 'POST', headers: { 'x-user-id': 'receiver', 'x-idempotency-key': 'late-key' }, body: JSON.stringify(resultRequest(sessionStart, deadline, 5, 'late-key')) });
  assert.equal(later.status, 409); assert.equal(resolution.winner_id, null); assert.equal(resolution.winning_score, null);
});
