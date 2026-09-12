import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Coordinates } from './throttle';

export type LocationTestRole = 'playerA' | 'playerB' | 'real';
export const LOCATION_TEST_ROLE_KEY = '@nextrep/location-test-role/v1';
export const SIMULATED_LOCATIONS: Record<Exclude<LocationTestRole, 'real'>, Coordinates> = {
  playerA: { latitude: 29.7603, longitude: -95.3698 },
  playerB: { latitude: 29.7612, longitude: -95.3698 },
};

export function simulatedCoordinates(role: LocationTestRole): Coordinates | null {
  return role === 'real' ? null : SIMULATED_LOCATIONS[role];
}

export async function loadLocationTestRole(): Promise<LocationTestRole> {
  const value = await AsyncStorage.getItem(LOCATION_TEST_ROLE_KEY);
  return value === 'playerA' || value === 'playerB' ? value : 'real';
}

export async function saveLocationTestRole(role: LocationTestRole): Promise<void> {
  await AsyncStorage.setItem(LOCATION_TEST_ROLE_KEY, role);
}

export function simulatedLocationPayload(role: Exclude<LocationTestRole, 'real'>, user: { userId: string; displayName: string }) {
  const coordinates = SIMULATED_LOCATIONS[role];
  return { ...coordinates, userId: user.userId, displayName: user.displayName, accuracyMeters: 5, capturedAt: new Date().toISOString() };
}
