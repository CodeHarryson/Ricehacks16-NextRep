import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { NEARBY_RADIUS_METERS, PRESENCE_EXPIRY_SECONDS, CORS_ORIGIN } from './config.js';
import { pool, type DbClient } from './db.js';
import { quantizeCoordinate, validatePresence, type PresenceInput } from './validation.js';

type PresenceRow = { user_id: string; display_name: string; latitude: number; longitude: number; captured_at: Date | string; distance_meters: number };
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
  return app;
}
