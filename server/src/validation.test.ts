import assert from 'node:assert/strict';
import test from 'node:test';
import { distanceMeters, quantizeCoordinate, validatePresence } from './validation.js';

const valid = { userId: 'u', displayName: 'Demo', latitude: 29.76, longitude: -95.36, accuracyMeters: 8, capturedAt: new Date(1_700_000_000_000).toISOString() };
test('validates coordinates, accuracy, and stale timestamps', () => {
  assert.equal(validatePresence(valid, 1_700_000_010_000), null);
  assert.match(validatePresence({ ...valid, latitude: 91 }, 1_700_000_010_000) ?? '', /latitude/);
  assert.match(validatePresence({ ...valid, longitude: -181 }, 1_700_000_010_000) ?? '', /longitude/);
  assert.match(validatePresence({ ...valid, accuracyMeters: -1 }, 1_700_000_010_000) ?? '', /accuracy/);
  assert.match(validatePresence(valid, 1_700_000_300_000) ?? '', /stale/);
});
test('calculates distance and quantizes coordinates', () => {
  assert.ok(distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0.001 }) > 100);
  assert.equal(quantizeCoordinate(29.7654321), 29.7654);
});
