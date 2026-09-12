import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiRuntimeConfig } from '../../config/api';

test('uses simulator endpoint for a development simulator', () => {
  assert.deepEqual(resolveApiRuntimeConfig({ isDev: true, isPhysicalDevice: false, apiUrl: 'http://lan:3000', simulatorApiUrl: 'http://127.0.0.1:3000' }), { baseUrl: 'http://127.0.0.1:3000', mode: 'simulator' });
});

test('uses LAN endpoint for a development physical device', () => {
  assert.deepEqual(resolveApiRuntimeConfig({ isDev: true, isPhysicalDevice: true, apiUrl: 'http://168.5.171.62:3000', simulatorApiUrl: 'http://127.0.0.1:3000' }), { baseUrl: 'http://168.5.171.62:3000', mode: 'physical' });
});

test('uses production endpoint outside development', () => {
  assert.deepEqual(resolveApiRuntimeConfig({ isDev: false, isPhysicalDevice: false, apiUrl: 'http://lan:3000', productionApiUrl: 'https://api.example.test/' }), { baseUrl: 'https://api.example.test', mode: 'production' });
});
