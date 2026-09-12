import { LOCATION_CONFIG } from '../../config/location';
import { API_URL, apiRuntimeConfig } from '../../config/api';
import type { Coordinates } from './throttle';

export interface NearbyUser { userId: string; displayName: string; position: Coordinates; distanceMeters: number; lastSeenAt: string; }
export interface PresencePayload extends Coordinates { userId: string; displayName: string; accuracyMeters: number; capturedAt: string; }

async function request(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  let response: Response;
  try { response = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) } }); } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Presence API request timed out after 8 seconds');
    throw error instanceof Error ? error : new Error('Presence API is unreachable');
  }
  clearTimeout(timeout);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string' ? (body as { error: string }).error : `Presence API returned ${response.status}`;
    throw new Error(message);
  }
  return response;
}
export async function checkApiHealth(): Promise<void> {
  const body: unknown = await (await request('/health', { method: 'GET' })).json();
  if (!body || typeof body !== 'object' || (body as { ok?: unknown }).ok !== true) throw new Error('Presence API health check returned an invalid response');
}
export async function publishPresence(payload: PresencePayload): Promise<void> { await request('/presence', { method: 'POST', body: JSON.stringify(payload) }); }
export async function fetchNearby(userId: string, coordinates: Coordinates): Promise<NearbyUser[]> {
  const query = new URLSearchParams({ latitude: String(coordinates.latitude), longitude: String(coordinates.longitude) });
  const body: unknown = await (await request(`/presence/nearby?${query.toString()}`, { method: 'GET', headers: { 'x-user-id': userId } })).json();
  if (!body || typeof body !== 'object' || !Array.isArray((body as { users?: unknown }).users)) throw new Error('Invalid nearby response');
  return (body as { users: NearbyUser[] }).users;
}
export async function stopPresence(userId: string): Promise<void> { await request('/presence', { method: 'DELETE', headers: { 'x-user-id': userId } }); }
export const locationApiConfig = { apiUrl: API_URL, mode: apiRuntimeConfig.mode, nearbyRadiusMeters: LOCATION_CONFIG.nearbyRadiusMeters } as const;
