import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMapRuntimeConfig } from './map';

test('MapTiler configuration requires both environment values', () => {
  assert.equal(resolveMapRuntimeConfig('', '').status, 'missing-style-url');
  assert.equal(resolveMapRuntimeConfig('https://api.maptiler.com/maps/base-v4/style.json', '').status, 'missing-api-key');
});

test('MapTiler style URL must be valid HTTPS and receives the environment key', () => {
  assert.equal(resolveMapRuntimeConfig('not a URL', 'key').status, 'invalid-style-url');
  assert.equal(resolveMapRuntimeConfig('http://api.maptiler.com/style.json', 'key').status, 'invalid-style-url');
  const configured = resolveMapRuntimeConfig('https://api.maptiler.com/maps/base-v4/style.json?key=old', 'new-key');
  assert.equal(configured.status, 'configured');
  assert.equal(new URL(configured.styleUrl ?? '').searchParams.get('key'), 'new-key');
});
