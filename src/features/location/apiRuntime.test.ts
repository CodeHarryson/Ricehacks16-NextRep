import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiRuntimeConfig, validateProductionApiUrl } from '../../config/api';

test('uses simulator endpoint for a development simulator', () => {
  assert.deepEqual(resolveApiRuntimeConfig({ isDev: true, isPhysicalDevice: false, apiUrl: 'http://lan:3000', simulatorApiUrl: 'http://127.0.0.1:3000' }), { baseUrl: 'http://127.0.0.1:3000', mode: 'simulator' });
});

test('uses LAN endpoint for a development physical device', () => {
  assert.deepEqual(resolveApiRuntimeConfig({ isDev: true, isPhysicalDevice: true, apiUrl: 'http://168.5.171.62:3000', simulatorApiUrl: 'http://127.0.0.1:3000' }), { baseUrl: 'http://168.5.171.62:3000', mode: 'physical' });
});

test('uses production endpoint outside development', () => {
  assert.deepEqual(resolveApiRuntimeConfig({ isDev: false, isPhysicalDevice: false, apiUrl: 'http://lan:3000', productionApiUrl: 'https://api.nextrep.app/' }), { baseUrl: 'https://api.nextrep.app', mode: 'production' });
});

test('production refuses to fall back when the API URL is missing', () => {
  assert.throws(() => resolveApiRuntimeConfig({ isDev: false, isPhysicalDevice: false, apiUrl: 'http://lan:3000', productionApiUrl: '' }), /is required/);
});

test('production rejects placeholder, insecure, and malformed API URLs', () => {
  for (const value of ['https://api.nextrep.example', 'https://example.com', 'https://api.example.org/v1', 'https://nextrep.test', 'https://localhost:3000']) {
    assert.throws(() => validateProductionApiUrl(value), /placeholder/, value);
  }
  assert.throws(() => validateProductionApiUrl('http://api.nextrep.app'), /https/);
  assert.throws(() => validateProductionApiUrl('not a url'), /not a valid URL/);
  assert.equal(validateProductionApiUrl(' https://myexample.com/ '), 'https://myexample.com');
});
