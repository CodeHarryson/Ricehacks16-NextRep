import type { NearbyUser } from './api';
import { mapRuntimeConfig, resolveMapRuntimeConfig } from '../../config/map';

export function mapStyleUrl(styleUrl?: string, apiKey?: string): string | null {
  if (arguments.length > 0) return resolveMapRuntimeConfig(styleUrl, apiKey).styleUrl;
  return mapRuntimeConfig.styleUrl;
}

export function nearbyToLngLat(user: NearbyUser): [number, number] {
  return [user.position.longitude, user.position.latitude];
}

export function nearbyUsersForMap(users: NearbyUser[], currentUserId: string | null): NearbyUser[] {
  return users.filter((user) => user.userId !== currentUserId);
}

export function mapUnavailableMessage(issue = mapRuntimeConfig.issue): string {
  return issue ?? 'Map unavailable. Check the MapTiler environment configuration and network connection.';
}
