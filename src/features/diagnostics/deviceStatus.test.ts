import assert from 'node:assert/strict';
import test from 'node:test';
import { cameraPermissionMessage, locationPermissionMessage, startupConfigurationIssues } from './deviceStatus';

test('permission-state messaging distinguishes not requested, denied, restricted, and granted', () => {
  assert.equal(cameraPermissionMessage('not-determined'), 'not requested');
  assert.match(cameraPermissionMessage('denied'), /Settings/);
  assert.match(cameraPermissionMessage('restricted'), /policy/);
  assert.equal(cameraPermissionMessage('granted'), 'granted');
  assert.equal(locationPermissionMessage('undetermined'), 'not requested');
  assert.match(locationPermissionMessage('denied'), /Settings/);
  assert.equal(locationPermissionMessage('granted'), 'granted');
});

test('startup diagnostics include readable API and map issues', () => {
  const issues = startupConfigurationIssues(
    { baseUrl: '', mode: 'physical', status: 'missing', issue: 'LAN API URL is missing.' },
    { styleUrl: null, apiKey: '', status: 'missing-api-key', issue: 'MapTiler key is missing.' },
  );
  assert.deepEqual(issues, ['LAN API URL is missing.', 'MapTiler key is missing.']);
});
