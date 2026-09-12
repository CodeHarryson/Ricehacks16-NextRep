import { LOCATION_CONFIG } from '../../config/location';

export interface Coordinates { latitude: number; longitude: number; }

export function haversineMeters(a: Coordinates, b: Coordinates): number {
  const radius = 6_371_000;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude); const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude); const lat2 = radians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function shouldPublishLocation(previous: { coordinates: Coordinates; sentAt: number } | null, next: Coordinates, now: number): boolean {
  if (previous === null) return true;
  return now - previous.sentAt >= LOCATION_CONFIG.presenceUpdateIntervalMs || haversineMeters(previous.coordinates, next) >= LOCATION_CONFIG.minimumMovementMeters;
}
