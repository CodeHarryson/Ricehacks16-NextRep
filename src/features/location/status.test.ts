import assert from 'node:assert/strict';
import test from 'node:test';
import { locationAvailability } from './status';

test('location permission and device-service states are explicit', () => {
  assert.equal(locationAvailability(false, true), 'permission-denied');
  assert.equal(locationAvailability(true, false), 'location-disabled');
  assert.equal(locationAvailability(true, true), 'ready');
});
