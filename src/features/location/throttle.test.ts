import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldPublishLocation } from './throttle';
test('location updates throttle by both time and movement', () => { const origin = { latitude: 29.76, longitude: -95.36 }; assert.equal(shouldPublishLocation(null, origin, 0), true); assert.equal(shouldPublishLocation({ coordinates: origin, sentAt: 0 }, { latitude: 29.7601, longitude: -95.36 }, 13_000), false); assert.equal(shouldPublishLocation({ coordinates: origin, sentAt: 0 }, { latitude: 29.761, longitude: -95.36 }, 13_000), true); });
