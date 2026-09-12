import { MAX_CAPTURE_AGE_SECONDS, MAX_FUTURE_SKEW_SECONDS } from './config.js';

export interface PresenceInput {
  userId: string;
  displayName: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: string;
}

export function validatePresence(input: PresenceInput, now = Date.now()): string | null {
  if (!input.userId || input.userId.length > 128) return 'userId is required';
  if (!input.displayName || input.displayName.length > 80) return 'displayName is required';
  if (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90) return 'invalid latitude';
  if (!Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) return 'invalid longitude';
  if (!Number.isFinite(input.accuracyMeters) || input.accuracyMeters < 0 || input.accuracyMeters > 10000) return 'invalid accuracy';
  const captured = Date.parse(input.capturedAt);
  if (!Number.isFinite(captured)) return 'invalid capturedAt';
  const age = (now - captured) / 1000;
  if (age > MAX_CAPTURE_AGE_SECONDS || age < -MAX_FUTURE_SKEW_SECONDS) return 'stale capturedAt';
  return null;
}

export function quantizeCoordinate(value: number, decimals = 4): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const earthRadius = 6_371_000;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const lat1 = toRadians(a.latitude); const lat2 = toRadians(b.latitude);
  const dLat = lat2 - lat1; const dLon = toRadians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
