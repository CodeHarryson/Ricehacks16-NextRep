import type { NearbyUser } from './api';

export const MAP_STYLE_URL = process.env.EXPO_PUBLIC_MAP_STYLE_URL?.trim() ?? '';
export const MAPTILER_API_KEY = process.env.EXPO_PUBLIC_MAPTILER_API_KEY?.trim() ?? '';

export function mapStyleUrl(styleUrl = MAP_STYLE_URL, apiKey = MAPTILER_API_KEY): string | null {
  if (!styleUrl) return null;
  try {
    const parsed = new URL(styleUrl);
    if (apiKey && !parsed.searchParams.has('key')) parsed.searchParams.set('key', apiKey);
    return parsed.toString();
  } catch {
    return null;
  }
}

export function nearbyToLngLat(user: NearbyUser): [number, number] {
  return [user.position.longitude, user.position.latitude];
}

export function nearbyUsersForMap(users: NearbyUser[], currentUserId: string | null): NearbyUser[] {
  return users.filter((user) => user.userId !== currentUserId);
}

export function mapUnavailableMessage(): string {
  return 'Map unavailable. Check the MapTiler style URL/API key and rebuild the development app.';
}
