export type LocationAvailability = 'ready' | 'permission-denied' | 'location-disabled';

export function locationAvailability(permissionGranted: boolean, servicesEnabled: boolean): LocationAvailability {
  if (!permissionGranted) return 'permission-denied';
  if (!servicesEnabled) return 'location-disabled';
  return 'ready';
}
