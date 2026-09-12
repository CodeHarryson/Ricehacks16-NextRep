import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CHALLENGE_EXPIRY_SECONDS, NEARBY_RADIUS_METERS, PRESENCE_EXPIRY_SECONDS, CORS_ORIGIN } from './config.js';
import { pool, type DbClient } from './db.js';
import { quantizeCoordinate, validatePresence, type PresenceInput } from './validation.js';

type PresenceRow = { user_id: string; display_name: string; latitude: number; longitude: number; captured_at: Date | string; distance_meters: number };
type ChallengeRow = { challenge_id: string; sender_id: string; receiver_id: string; sender_display_name: string; receiver_display_name: string; status: string; created_at: Date | string; expires_at: Date | string; accepted_at: Date | string | null; proximity_meters: number; exercise: string; set_count: number; target_reps: number; rest_seconds: number; match_time_limit_seconds: number; config_version: number; sender_accepted_at: Date | string | null; receiver_accepted_at: Date | string | null; started_at: Date | string | null };
type ResultRow = { result_id: string; challenge_id: string; participant_id: string; config_version: number; exercise: string; counted_reps: number; green_reps: number; yellow_reps: number; red_attempts: number; neutral_attempts: number; total_score: number; score_policy_version: string; started_at: Date | string; ended_at: Date | string; submitted_at: Date | string; idempotency_key: string };
type ChallengeConfigInput = { exercise: string; setCount: number; targetReps: number; restSeconds: number; matchTimeLimitSeconds: number };
const configResponse = (row: ChallengeRow) => ({ exercise: row.exercise ?? 'bodyweight_squat', setCount: row.set_count ?? 1, targetReps: row.target_reps ?? 5, restSeconds: row.rest_seconds ?? 30, matchTimeLimitSeconds: row.match_time_limit_seconds ?? 300, configVersion: row.config_version ?? 1 });
const challengeResponse = (row: ChallengeRow) => ({
  challengeId: row.challenge_id,
  senderId: row.sender_id,
  receiverId: row.receiver_id,
  senderDisplayName: row.sender_display_name,
  receiverDisplayName: row.receiver_display_name,
  status: row.status,
  createdAt: new Date(row.created_at).toISOString(),
  expiresAt: new Date(row.expires_at).toISOString(),
  acceptedAt: row.accepted_at ? new Date(row.accepted_at).toISOString() : null,
  proximityMeters: Math.round(Number(row.proximity_meters)),
  configuration: configResponse(row),
  acceptance: { senderAcceptedAt: row.sender_accepted_at ? new Date(row.sender_accepted_at).toISOString() : null, receiverAcceptedAt: row.receiver_accepted_at ? new Date(row.receiver_accepted_at).toISOString() : null },
  locked: row.status === 'ready' || row.status === 'active',
  startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
});
const resultResponse = (row: ResultRow) => ({ resultId: row.result_id, challengeId: row.challenge_id, participantId: row.participant_id, configVersion: row.config_version, exercise: row.exercise, countedReps: row.counted_reps, greenReps: row.green_reps, yellowReps: row.yellow_reps, redAttempts: row.red_attempts, neutralAttempts: row.neutral_attempts, totalScore: row.total_score, scorePolicyVersion: row.score_policy_version, startedAt: new Date(row.started_at).toISOString(), endedAt: new Date(row.ended_at).toISOString(), submittedAt: new Date(row.submitted_at).toISOString() });
const parseConfig = (body: unknown): ChallengeConfigInput | string => {
  if (!body || typeof body !== 'object') return 'invalid configuration';
  const raw = body as Record<string, unknown>;
  const values = { exercise: raw.exercise, setCount: raw.setCount, targetReps: raw.targetReps, restSeconds: raw.restSeconds, matchTimeLimitSeconds: raw.matchTimeLimitSeconds };
  if (values.exercise !== 'bodyweight_squat') return 'only bodyweight_squat is supported';
  if (![values.setCount, values.targetReps, values.restSeconds, values.matchTimeLimitSeconds].every((value) => typeof value === 'number' && Number.isInteger(value))) return 'configuration values must be integers';
  const config = values as ChallengeConfigInput;
  if (config.setCount < 1 || config.setCount > 3) return 'setCount must be between 1 and 3';
  if (config.targetReps < 1 || config.targetReps > 50) return 'targetReps must be between 1 and 50';
  if (config.restSeconds < 0 || config.restSeconds > 300) return 'restSeconds must be between 0 and 300';
  if (config.matchTimeLimitSeconds < 30 || config.matchTimeLimitSeconds > 1800) return 'matchTimeLimitSeconds must be between 30 and 1800';
  return config;
};
export function createApp(db: DbClient = pool): Hono {
  const app = new Hono();
  app.use('*', cors({ origin: CORS_ORIGIN }));
  app.onError((_error, context) => context.json({ error: 'internal server error' }, 500));
  app.post('/health', (context) => context.json({ ok: true }));
  app.get('/health', (context) => context.json({ ok: true }));
  app.post('/presence', async (context) => {
    let body: unknown;
    try { body = await context.req.json(); } catch { return context.json({ error: 'invalid JSON' }, 400); }
    if (!body || typeof body !== 'object') return context.json({ error: 'invalid body' }, 400);
    const raw = body as Record<string, unknown>;
    const input: PresenceInput = {
      userId: typeof raw.userId === 'string' ? raw.userId : '',
      displayName: typeof raw.displayName === 'string' ? raw.displayName.trim() : '',
      latitude: typeof raw.latitude === 'number' ? raw.latitude : Number.NaN,
      longitude: typeof raw.longitude === 'number' ? raw.longitude : Number.NaN,
      accuracyMeters: typeof raw.accuracyMeters === 'number' ? raw.accuracyMeters : Number.NaN,
      capturedAt: typeof raw.capturedAt === 'string' ? raw.capturedAt : '',
    };
    const error = validatePresence(input);
    if (error) return context.json({ error }, 400);
    await db.query(
      `INSERT INTO presence_events (event_id, user_id, display_name, captured_at, latitude, longitude, accuracy_meters, expires_at)
       VALUES ($1, $2, $3, $4::timestamptz, $5, $6, $7, $4::timestamptz + INTERVAL '${PRESENCE_EXPIRY_SECONDS} seconds')`,
      [randomUUID(), input.userId, input.displayName, input.capturedAt, input.latitude, input.longitude, input.accuracyMeters],
    );
    return context.json({ ok: true }, 201);
  });
  app.get('/presence/nearby', async (context) => {
    const userId = context.req.header('x-user-id');
    const latitude = Number(context.req.query('latitude'));
    const longitude = Number(context.req.query('longitude'));
    if (!userId || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return context.json({ error: 'x-user-id, latitude, and longitude are required' }, 400);
    }
    const result = await db.query<PresenceRow>(
      `WITH latest AS (
        SELECT DISTINCT ON (user_id) user_id, display_name, latitude, longitude, captured_at,
          ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS distance_meters
        FROM presence_events
        WHERE expires_at > NOW() AND user_id <> $3
          AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $4)
        ORDER BY user_id, captured_at DESC
      ) SELECT * FROM latest ORDER BY distance_meters ASC`,
      [latitude, longitude, userId, NEARBY_RADIUS_METERS],
    );
    return context.json({ users: result.rows.map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      position: { latitude: quantizeCoordinate(row.latitude), longitude: quantizeCoordinate(row.longitude) },
      distanceMeters: Math.round(Number(row.distance_meters)),
      lastSeenAt: new Date(row.captured_at).toISOString(),
    })) });
  });
  app.delete('/presence', async (context) => {
    const userId = context.req.header('x-user-id');
    if (!userId) return context.json({ error: 'x-user-id is required' }, 400);
    await db.query('UPDATE presence_events SET expires_at = NOW() WHERE user_id = $1 AND expires_at > NOW()', [userId]);
    return context.json({ ok: true });
  });
  app.post('/challenges', async (context) => {
    const senderId = context.req.header('x-user-id');
    const senderDisplayName = context.req.header('x-display-name')?.trim();
    let body: unknown;
    try { body = await context.req.json(); } catch { return context.json({ error: 'invalid JSON' }, 400); }
    const receiverId = body && typeof body === 'object' && typeof (body as Record<string, unknown>).receiverId === 'string' ? (body as Record<string, string>).receiverId : '';
    if (!senderId || !senderDisplayName || !receiverId || senderId === receiverId) return context.json({ error: 'sender, display name, and a different receiver are required' }, 400);
    const proximity = await db.query<{ receiver_display_name: string; proximity_meters: number }>(
      `WITH latest AS (
        SELECT DISTINCT ON (user_id) user_id, display_name, location
        FROM presence_events WHERE expires_at > NOW() AND user_id IN ($1, $2)
        ORDER BY user_id, captured_at DESC
      ) SELECT b.display_name AS receiver_display_name, ST_Distance(a.location, b.location) AS proximity_meters
        FROM latest a JOIN latest b ON a.user_id = $1 AND b.user_id = $2`, [senderId, receiverId]);
    const proximityRow = proximity.rows[0];
    if (!proximityRow) return context.json({ error: 'both users must have active presence' }, 409);
    const distance = Number(proximityRow.proximity_meters);
    if (distance > NEARBY_RADIUS_METERS) return context.json({ error: 'user is outside the challenge radius' }, 409);
    const duplicate = await db.query<{ challenge_id: string }>(
      `SELECT challenge_id FROM challenges WHERE status = 'pending' AND expires_at > NOW()
       AND ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)) LIMIT 1`, [senderId, receiverId]);
    if (duplicate.rows.length > 0) return context.json({ error: 'a pending challenge already exists' }, 409);
    const createdAt = new Date();
    const result = await db.query<ChallengeRow>(
      `INSERT INTO challenges (challenge_id, sender_id, receiver_id, sender_display_name, receiver_display_name, status, created_at, expires_at, proximity_meters)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6::timestamptz, $6::timestamptz + INTERVAL '${CHALLENGE_EXPIRY_SECONDS} seconds', $7)
       RETURNING *`, [randomUUID(), senderId, receiverId, senderDisplayName, proximityRow.receiver_display_name, createdAt.toISOString(), distance]);
    const created = result.rows[0];
    if (!created) return context.json({ error: 'challenge creation failed' }, 500);
    return context.json({ challenge: challengeResponse(created) }, 201);
  });
  app.get('/challenges', async (context) => {
    const userId = context.req.header('x-user-id');
    if (!userId) return context.json({ error: 'x-user-id is required' }, 400);
    await db.query(`UPDATE challenges SET status = 'expired' WHERE status IN ('pending', 'accepted', 'configuring', 'ready', 'active') AND expires_at <= NOW() AND (sender_id = $1 OR receiver_id = $1)`, [userId]);
    const result = await db.query<ChallengeRow>(
      `SELECT * FROM challenges WHERE (sender_id = $1 OR receiver_id = $1) AND expires_at > NOW() ORDER BY created_at DESC`, [userId]);
    return context.json({ challenges: result.rows.map(challengeResponse) });
  });
  app.get('/challenges/:id', async (context) => {
    const userId = context.req.header('x-user-id');
    if (!userId) return context.json({ error: 'x-user-id is required' }, 400);
    await db.query(`UPDATE challenges SET status = 'expired' WHERE challenge_id = $1 AND status IN ('pending', 'accepted', 'configuring', 'ready', 'active') AND expires_at <= NOW()`, [context.req.param('id')]);
    const result = await db.query<ChallengeRow>('SELECT * FROM challenges WHERE challenge_id = $1 AND (sender_id = $2 OR receiver_id = $2) AND expires_at > NOW()', [context.req.param('id'), userId]);
    const challenge = result.rows[0];
    if (!challenge) return context.json({ error: 'challenge not found' }, 404);
    return context.json({ challenge: challengeResponse(challenge) });
  });
  app.patch('/challenges/:id/config', async (context) => {
    const userId = context.req.header('x-user-id');
    if (!userId) return context.json({ error: 'x-user-id is required' }, 400);
    let body: unknown;
    try { body = await context.req.json(); } catch { return context.json({ error: 'invalid JSON' }, 400); }
    const parsed = parseConfig(body);
    if (typeof parsed === 'string') return context.json({ error: parsed }, 400);
    const result = await db.query<ChallengeRow>(
      `UPDATE challenges SET exercise = $3, set_count = $4, target_reps = $5, rest_seconds = $6,
         match_time_limit_seconds = $7, config_version = config_version + 1,
         sender_accepted_at = NULL, receiver_accepted_at = NULL,
         status = 'configuring'
       WHERE challenge_id = $1 AND (sender_id = $2 OR receiver_id = $2)
         AND status IN ('accepted', 'configuring') AND expires_at > NOW() RETURNING *`,
      [context.req.param('id'), userId, parsed.exercise, parsed.setCount, parsed.targetReps, parsed.restSeconds, parsed.matchTimeLimitSeconds]);
    const updated = result.rows[0];
    if (!updated) return context.json({ error: 'challenge is locked or unavailable' }, 409);
    return context.json({ challenge: challengeResponse(updated) });
  });
  app.post('/challenges/:id/accept-config', async (context) => {
    const userId = context.req.header('x-user-id');
    if (!userId) return context.json({ error: 'x-user-id is required' }, 400);
    const result = await db.query<ChallengeRow>(
      `UPDATE challenges SET
         sender_accepted_at = CASE WHEN sender_id = $2 THEN COALESCE(sender_accepted_at, NOW()) ELSE sender_accepted_at END,
         receiver_accepted_at = CASE WHEN receiver_id = $2 THEN COALESCE(receiver_accepted_at, NOW()) ELSE receiver_accepted_at END,
         status = CASE WHEN (sender_id = $2 AND receiver_accepted_at IS NOT NULL) OR (receiver_id = $2 AND sender_accepted_at IS NOT NULL) THEN 'ready' ELSE 'configuring' END
       WHERE challenge_id = $1 AND (sender_id = $2 OR receiver_id = $2)
         AND status IN ('accepted', 'configuring') AND expires_at > NOW() RETURNING *`, [context.req.param('id'), userId]);
    const accepted = result.rows[0];
    if (accepted) return context.json({ challenge: challengeResponse(accepted) });
    const existing = await db.query<ChallengeRow>('SELECT * FROM challenges WHERE challenge_id = $1 AND (sender_id = $2 OR receiver_id = $2)', [context.req.param('id'), userId]);
    if (existing.rows[0]?.status === 'ready') return context.json({ challenge: challengeResponse(existing.rows[0]) });
    return context.json({ error: 'challenge is unavailable for configuration acceptance' }, 409);
  });
  app.post('/challenges/:id/start', async (context) => {
    const userId = context.req.header('x-user-id');
    if (!userId) return context.json({ error: 'x-user-id is required' }, 400);
    const result = await db.query<ChallengeRow>(
      `UPDATE challenges SET status = 'active', started_at = COALESCE(started_at, NOW())
       WHERE challenge_id = $1 AND (sender_id = $2 OR receiver_id = $2) AND status = 'ready'
         AND sender_accepted_at IS NOT NULL AND receiver_accepted_at IS NOT NULL AND expires_at > NOW() RETURNING *`, [context.req.param('id'), userId]);
    const started = result.rows[0];
    if (started) return context.json({ challenge: challengeResponse(started) });
    const existing = await db.query<ChallengeRow>('SELECT * FROM challenges WHERE challenge_id = $1 AND (sender_id = $2 OR receiver_id = $2)', [context.req.param('id'), userId]);
    if (existing.rows[0]?.status === 'active') return context.json({ challenge: challengeResponse(existing.rows[0]) });
    return context.json({ error: 'challenge is not ready to start' }, 409);
  });
  app.post('/challenges/:id/accept', async (context) => {
    const userId = context.req.header('x-user-id');
    if (!userId) return context.json({ error: 'x-user-id is required' }, 400);
    const result = await db.query<ChallengeRow>(
      `UPDATE challenges SET status = 'accepted', accepted_at = NOW()
       WHERE challenge_id = $1 AND receiver_id = $2 AND status = 'pending' AND expires_at > NOW() RETURNING *`, [context.req.param('id'), userId]);
    if (result.rows.length === 0) {
      const existing = await db.query<ChallengeRow>('SELECT * FROM challenges WHERE challenge_id = $1 AND receiver_id = $2', [context.req.param('id'), userId]);
      if (existing.rows[0]?.status === 'accepted') return context.json({ challenge: challengeResponse(existing.rows[0]) });
      return context.json({ error: 'challenge is unavailable' }, 409);
    }
    const accepted = result.rows[0];
    if (!accepted) return context.json({ error: 'challenge update failed' }, 500);
    return context.json({ challenge: challengeResponse(accepted) });
  });
  app.post('/challenges/:id/decline', async (context) => {
    const userId = context.req.header('x-user-id');
    if (!userId) return context.json({ error: 'x-user-id is required' }, 400);
    const result = await db.query<ChallengeRow>(
      `UPDATE challenges SET status = 'declined' WHERE challenge_id = $1 AND receiver_id = $2 AND status = 'pending' AND expires_at > NOW() RETURNING *`, [context.req.param('id'), userId]);
    if (result.rows.length === 0) {
      const existing = await db.query<ChallengeRow>('SELECT * FROM challenges WHERE challenge_id = $1 AND receiver_id = $2', [context.req.param('id'), userId]);
      if (existing.rows[0]?.status === 'declined') return context.json({ challenge: challengeResponse(existing.rows[0]) });
      return context.json({ error: 'challenge is unavailable' }, 409);
    }
    const declined = result.rows[0];
    if (!declined) return context.json({ error: 'challenge update failed' }, 500);
    return context.json({ challenge: challengeResponse(declined) });
  });
  app.post('/challenges/:id/result', async (context) => {
    const participantId = context.req.header('x-user-id');
    if (!participantId) return context.json({ error: 'x-user-id is required' }, 400);
    let body: unknown; try { body = await context.req.json(); } catch { return context.json({ error: 'invalid JSON' }, 400); }
    const raw = body && typeof body === 'object' ? body as Record<string, unknown> : {};
    const idempotencyKey = context.req.header('x-idempotency-key') ?? (typeof raw.idempotencyKey === 'string' ? raw.idempotencyKey : '');
    const challengeResult = await db.query<ChallengeRow>('SELECT * FROM challenges WHERE challenge_id = $1 AND (sender_id = $2 OR receiver_id = $2)', [context.req.param('id'), participantId]);
    const challenge = challengeResult.rows[0];
    if (!challenge) return context.json({ error: 'challenge not found' }, 404);
    if (!['active', 'expired'].includes(challenge.status)) return context.json({ error: 'challenge is not active' }, 409);
    const existing = await db.query<ResultRow>('SELECT * FROM challenge_participant_results WHERE challenge_id = $1 AND participant_id = $2', [challenge.challenge_id, participantId]);
    if (existing.rows[0]) return context.json({ result: resultResponse(existing.rows[0]) });
    const required = ['configVersion', 'exercise', 'greenReps', 'yellowReps', 'redAttempts', 'neutralAttempts', 'startedAt', 'endedAt'];
    if (!idempotencyKey || required.some((key) => !(key in raw))) return context.json({ error: 'result fields and x-idempotency-key are required' }, 400);
    const numbers = ['configVersion', 'greenReps', 'yellowReps', 'redAttempts', 'neutralAttempts'].map((key) => raw[key]);
    if (raw.exercise !== challenge.exercise || !numbers.every((value) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) || raw.configVersion !== challenge.config_version) return context.json({ error: 'result does not match the locked configuration' }, 400);
    const green = raw.greenReps as number; const yellow = raw.yellowReps as number; const counted = Math.min(challenge.set_count * challenge.target_reps, green + yellow); const cappedGreen = Math.min(green, counted); const cappedYellow = Math.min(yellow, counted - cappedGreen);
    const startedAt = typeof raw.startedAt === 'string' ? new Date(raw.startedAt) : new Date(Number.NaN); const endedAt = typeof raw.endedAt === 'string' ? new Date(raw.endedAt) : new Date(Number.NaN);
    if (!Number.isFinite(startedAt.getTime()) || !Number.isFinite(endedAt.getTime()) || endedAt < startedAt) return context.json({ error: 'invalid result timestamps' }, 400);
    await db.query(`INSERT INTO challenge_participant_results (result_id, challenge_id, participant_id, config_version, exercise, counted_reps, green_reps, yellow_reps, red_attempts, neutral_attempts, total_score, score_policy_version, started_at, ended_at, idempotency_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'score-v1',$12::timestamptz,$13::timestamptz,$14) ON CONFLICT DO NOTHING`, [randomUUID(), challenge.challenge_id, participantId, challenge.config_version, challenge.exercise, counted, cappedGreen, cappedYellow, raw.redAttempts, raw.neutralAttempts, cappedGreen * 110 + cappedYellow * 100, startedAt.toISOString(), endedAt.toISOString(), idempotencyKey]);
    const inserted = await db.query<ResultRow>('SELECT * FROM challenge_participant_results WHERE challenge_id = $1 AND participant_id = $2', [challenge.challenge_id, participantId]);
    const result = inserted.rows[0]; if (!result) return context.json({ error: 'result submission failed' }, 500);
    const allResults = await db.query<ResultRow>('SELECT * FROM challenge_participant_results WHERE challenge_id = $1', [challenge.challenge_id]);
    if (allResults.rows.length >= 2 || new Date(challenge.expires_at).getTime() <= Date.now()) {
      const scores = allResults.rows.map((item) => ({ id: item.participant_id, score: item.total_score })); const winningScore = scores.length ? Math.max(...scores.map((item) => item.score)) : 0; const winners = scores.filter((item) => item.score === winningScore); const winnerId = winners.length === 1 ? winners[0]?.id ?? null : null;
      await db.query(`UPDATE challenges SET resolution_status = 'resolved', resolved_at = COALESCE(resolved_at, NOW()), winner_id = $2, winning_score = $3 WHERE challenge_id = $1 AND resolution_status <> 'resolved'`, [challenge.challenge_id, winnerId, winningScore]);
    }
    return context.json({ result: resultResponse(result) }, 201);
  });
  app.get('/challenges/:id/results', async (context) => {
    const participantId = context.req.header('x-user-id'); if (!participantId) return context.json({ error: 'x-user-id is required' }, 400);
    const challengeResult = await db.query<ChallengeRow>('SELECT * FROM challenges WHERE challenge_id = $1 AND (sender_id = $2 OR receiver_id = $2)', [context.req.param('id'), participantId]); const challenge = challengeResult.rows[0];
    if (!challenge) return context.json({ error: 'challenge not found' }, 404);
    const results = await db.query<ResultRow>('SELECT * FROM challenge_participant_results WHERE challenge_id = $1 ORDER BY submitted_at ASC', [challenge.challenge_id]);
    const resolution = await db.query<{ resolution_status: string; winner_id: string | null; winning_score: number | null; resolved_at: Date | string | null }>('SELECT resolution_status, winner_id, winning_score, resolved_at FROM challenges WHERE challenge_id = $1', [challenge.challenge_id]);
    const state = resolution.rows[0]; return context.json({ results: results.rows.map(resultResponse), resolution: state?.resolution_status === 'resolved' ? { status: 'resolved', winnerId: state.winner_id, winningScore: state.winning_score, resolvedAt: state.resolved_at ? new Date(state.resolved_at).toISOString() : null } : { status: 'pending' } });
  });
  return app;
}
