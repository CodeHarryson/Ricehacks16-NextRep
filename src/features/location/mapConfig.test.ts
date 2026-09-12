import assert from 'node:assert/strict';
import test from 'node:test';
import { mapStyleUrl, mapUnavailableMessage, nearbyToLngLat, nearbyUsersForMap } from './mapConfig';
import { DEMO_WORKOUT_ZONES, isValidWorkoutZones } from './zones';

test('MapTiler style configuration and fallback are actionable', () => {
  assert.match(mapUnavailableMessage(), /EXPO_PUBLIC_MAP/);
  assert.equal(mapStyleUrl('', 'key'), null);
  assert.equal(mapStyleUrl('https://example.test/style.json', 'secret')?.includes('secret'), true);
  const person = { userId: 'u', displayName: 'U', position: { latitude: 1, longitude: 2 }, distanceMeters: 3, lastSeenAt: '' };
  assert.deepEqual(nearbyToLngLat(person), [2, 1]);
  assert.deepEqual(nearbyUsersForMap([person, { ...person, userId: 'self' }], 'self').map((user) => user.userId), ['u']);
  assert.equal(isValidWorkoutZones(DEMO_WORKOUT_ZONES), true);
});
