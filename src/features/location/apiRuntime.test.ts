import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiRuntimeConfig, validateProductionApiUrl } from '../../config/api';

test('uses simulator endpoint for a development simulator', () => {
  assert.deepEqual(resolveApiRuntimeConfig({ isDev: true, isPhysicalDevice: false, apiUrl: 'http://lan:3000', simulatorApiUrl: 'http://127.0.0.1:3000' }), { baseUrl: 'http://127.0.0.1:3000', mode: 'simulator', status: 'configured', issue: null });
});

test('uses LAN endpoint for a development physical device', () => {
  assert.deepEqual(resolveApiRuntimeConfig({ isDev: true, isPhysicalDevice: true, apiUrl: 'http://192.168.1.20:3000', simulatorApiUrl: 'http://127.0.0.1:3000' }), { baseUrl: 'http://192.168.1.20:3000', mode: 'physical', status: 'configured', issue: null });
});

test('uses production endpoint outside development', () => {
  assert.deepEqual(resolveApiRuntimeConfig({ isDev: false, isPhysicalDevice: false, apiUrl: 'http://lan:3000', productionApiUrl: 'https://api.nextrep.app/' }), { baseUrl: 'https://api.nextrep.app', mode: 'production', status: 'configured', issue: null });
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

test('missing and invalid development configuration is reported without crashing startup', () => {
  assert.deepEqual(resolveApiRuntimeConfig({ isDev: true, isPhysicalDevice: true, apiUrl: '' }), {
    baseUrl: '', mode: 'physical', status: 'missing', issue: 'EXPO_PUBLIC_API_URL is required for this development device.',
  });
  assert.match(resolveApiRuntimeConfig({ isDev: true, isPhysicalDevice: false, simulatorApiUrl: 'ftp://host' }).issue ?? '', /http or https/);
  assert.match(resolveApiRuntimeConfig({ isDev: true, isPhysicalDevice: true, apiUrl: 'http://127.0.0.1:3000' }).issue ?? '', /LAN address/);
});

test('Android emulator can use its host alias without changing the iOS simulator URL', () => {
  const result = resolveApiRuntimeConfig({ isDev: true, isPhysicalDevice: false, platform: 'android', simulatorApiUrl: 'http://127.0.0.1:3000', androidEmulatorApiUrl: 'http://10.0.2.2:3000' });
  assert.equal(result.baseUrl, 'http://10.0.2.2:3000');
  assert.equal(result.mode, 'simulator');
});
