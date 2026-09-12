import 'dotenv/config';

export const PORT = Number.parseInt(process.env.PORT ?? '3000', 10);
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? '*';
export const NEARBY_RADIUS_METERS = 250;
export const PRESENCE_EXPIRY_SECONDS = 60;
export const MAX_CAPTURE_AGE_SECONDS = 120;
export const MAX_FUTURE_SKEW_SECONDS = 30;
export const CHALLENGE_EXPIRY_SECONDS = 120;
export const SESSION_COUNTDOWN_SECONDS = 10;
export const RESULT_MAX_FUTURE_SKEW_SECONDS = 30;

export function databaseUrl(): string {
  const value = process.env.TIGER_DATABASE_URL;
  if (!value) throw new Error('TIGER_DATABASE_URL is required');
  return value;
}
