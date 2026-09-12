import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldPublishLocation } from './throttle';

const origin = { latitude: 29.76, longitude: -95.36 };
const previous = { coordinates: origin, sentAt: 0 };
test('first location publishes immediately', () => assert.equal(shouldPublishLocation(null, origin, 0), true));
test('stationary user publishes after the interval', () => assert.equal(shouldPublishLocation(previous, origin, 12_000), true));
test('stationary user does not publish before the interval', () => assert.equal(shouldPublishLocation(previous, origin, 11_999), false));
test('movement of at least 25 metres publishes immediately', () => assert.equal(shouldPublishLocation(previous, { latitude: 29.7603, longitude: -95.36 }, 1_000), true));
test('small movement before the interval does not publish', () => assert.equal(shouldPublishLocation(previous, { latitude: 29.7601, longitude: -95.36 }, 1_000), false));
test('time and movement conditions work independently', () => {
  assert.equal(shouldPublishLocation(previous, origin, 12_000), true);
  assert.equal(shouldPublishLocation(previous, { latitude: 29.7603, longitude: -95.36 }, 1_000), true);
});
