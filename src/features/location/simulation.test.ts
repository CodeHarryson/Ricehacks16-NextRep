import assert from 'node:assert/strict';
import test from 'node:test';
import { SIMULATED_LOCATIONS, simulatedCoordinates, simulatedLocationPayload } from './simulation';

function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const lat = ((a.latitude + b.latitude) / 2) * Math.PI / 180;
  const dx = (a.longitude - b.longitude) * 111_320 * Math.cos(lat);
  const dy = (a.latitude - b.latitude) * 110_540;
  return Math.hypot(dx, dy);
}

test('simulated players are nearby but spatially distinct', () => {
  const distance = distanceMeters(SIMULATED_LOCATIONS.playerA, SIMULATED_LOCATIONS.playerB);
  assert.ok(distance > 25 && distance < 250);
  assert.deepEqual(simulatedCoordinates('real'), null);
});

test('simulated coordinates convert to a normal presence payload', () => {
  const payload = simulatedLocationPayload('playerA', { userId: 'demo-a', displayName: 'A' });
  assert.deepEqual({ latitude: payload.latitude, longitude: payload.longitude, userId: payload.userId, accuracyMeters: payload.accuracyMeters }, { ...SIMULATED_LOCATIONS.playerA, userId: 'demo-a', accuracyMeters: 5 });
  assert.match(payload.capturedAt, /^\d{4}-\d{2}-\d{2}T/);
});
