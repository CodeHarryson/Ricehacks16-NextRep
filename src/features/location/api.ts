import { LOCATION_CONFIG } from '../../config/location';
import type { Coordinates } from './throttle';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
export interface NearbyUser { userId: string; displayName: string; position: Coordinates; distanceMeters: number; lastSeenAt: string; }
export interface PresencePayload extends Coordinates { userId: string; displayName: string; accuracyMeters: number; capturedAt: string; }

async function request(path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(`${API_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error(`Presence API returned ${response.status}`);
  return response;
}
export async function publishPresence(payload: PresencePayload): Promise<void> { await request('/presence', { method: 'POST', body: JSON.stringify(payload) }); }
export async function fetchNearby(userId: string, coordinates: Coordinates): Promise<NearbyUser[]> {
  const query = new URLSearchParams({ latitude: String(coordinates.latitude), longitude: String(coordinates.longitude) });
  const body: unknown = await (await request(`/presence/nearby?${query.toString()}`, { method: 'GET', headers: { 'x-user-id': userId } })).json();
  if (!body || typeof body !== 'object' || !Array.isArray((body as { users?: unknown }).users)) throw new Error('Invalid nearby response');
  return (body as { users: NearbyUser[] }).users;
}
export async function stopPresence(userId: string): Promise<void> { await request('/presence', { method: 'DELETE', headers: { 'x-user-id': userId } }); }
export const locationApiConfig = { apiUrl: API_URL, nearbyRadiusMeters: LOCATION_CONFIG.nearbyRadiusMeters } as const;
