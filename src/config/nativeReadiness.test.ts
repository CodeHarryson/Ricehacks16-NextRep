import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const app = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;
const eas = JSON.parse(readFileSync(join(root, 'eas.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const configure = require(join(root, 'app.config.js')) as (input: { config: object }) => typeof app;

function configuredApp() {
  const before = process.env.EAS_BUILD_PROFILE;
  process.env.EAS_BUILD_PROFILE = 'development';
  try { return configure({ config: {} }); } finally { if (before === undefined) delete process.env.EAS_BUILD_PROFILE; else process.env.EAS_BUILD_PROFILE = before; }
}

test('native configuration has only required foreground permissions and native plugins', () => {
  const config = configuredApp();
  assert.match(config.ios.infoPlist.NSCameraUsageDescription, /camera/i);
  assert.match(config.ios.infoPlist.NSLocationWhenInUseUsageDescription, /location/i);
  assert.deepEqual(new Set(config.android.permissions), new Set(['android.permission.CAMERA', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION']));
  assert.deepEqual(config.android.blockedPermissions, ['android.permission.RECORD_AUDIO']);
  assert.ok(config.plugins.includes('expo-dev-client'));
  assert.ok(config.plugins.includes('@maplibre/maplibre-react-native'));
  const locationPlugin = config.plugins.find((entry: unknown) => Array.isArray(entry) && entry[0] === 'expo-location');
  assert.ok(Array.isArray(locationPlugin));
  assert.equal(locationPlugin[1].locationAlwaysAndWhenInUsePermission, false);
  assert.equal(locationPlugin[1].locationAlwaysPermission, false);
  assert.equal(locationPlugin[1].isIosBackgroundLocationEnabled, false);
  assert.equal(locationPlugin[1].isAndroidBackgroundLocationEnabled, false);
  assert.equal(locationPlugin[1].isAndroidForegroundServiceEnabled, false);
  assert.equal(app.newArchEnabled, false);
});

test('app, EAS profiles, and package versions are internally consistent', () => {
  assert.equal(app.version, pkg.version);
  assert.equal(pkg.dependencies.expo, '54.0.37');
  assert.equal(pkg.dependencies['expo-device'], '~8.0.10');
  assert.equal(pkg.dependencies['react-native'], '0.81.5');
  assert.equal(pkg.dependencies['@maplibre/maplibre-react-native'], '10.4.2');
  assert.equal(eas.build.development.developmentClient, true);
  assert.equal(eas.build.development.environment, 'development');
  assert.equal(eas.build['development-simulator'].ios.simulator, true);
  assert.equal(eas.build['development-simulator'].environment, 'development');
  assert.equal(eas.build.preview.env.NEXTREP_BUILD_ENV, 'production');
  assert.equal(eas.build.production.env.NEXTREP_BUILD_ENV, 'production');
});

test('release app configuration rejects missing or insecure production URLs', () => {
  const previous = { build: process.env.NEXTREP_BUILD_ENV, url: process.env.EXPO_PUBLIC_PRODUCTION_API_URL };
  process.env.NEXTREP_BUILD_ENV = 'production';
  try {
    delete process.env.EXPO_PUBLIC_PRODUCTION_API_URL;
    assert.throws(() => configure({ config: {} }), /requires EXPO_PUBLIC_PRODUCTION_API_URL/);
    process.env.EXPO_PUBLIC_PRODUCTION_API_URL = 'http://api.nextrep.app';
    assert.throws(() => configure({ config: {} }), /real https URL/);
    process.env.EXPO_PUBLIC_PRODUCTION_API_URL = 'https://api.nextrep.app';
    const production = configure({ config: {} });
    assert.equal(production.ios.infoPlist.NSAppTransportSecurity.NSAllowsArbitraryLoads, false);
  } finally {
    if (previous.build === undefined) delete process.env.NEXTREP_BUILD_ENV; else process.env.NEXTREP_BUILD_ENV = previous.build;
    if (previous.url === undefined) delete process.env.EXPO_PUBLIC_PRODUCTION_API_URL; else process.env.EXPO_PUBLIC_PRODUCTION_API_URL = previous.url;
  }
});

test('Nunito, avatar, navigation, workout, and pose-model assets resolve locally', () => {
  for (const weight of ['700Bold/Nunito_700Bold.ttf', '800ExtraBold/Nunito_800ExtraBold.ttf', '900Black/Nunito_900Black.ttf']) {
    assert.ok(existsSync(join(root, 'node_modules/@expo-google-fonts/nunito', weight)), weight);
  }
  const artDirectory = join(root, 'src/components/art/images');
  const artFiles = readdirSync(artDirectory);
  for (const base of ['avatar-bust', 'avatar-full', 'avatar-opponent-bust', 'avatar-opponent-full', 'flame', 'nav-home', 'nav-map', 'nav-profile', 'nav-dumbbell', 'nav-progress', 'nav-trophy', 'nav-bell']) {
    for (const scale of ['', '@2x', '@3x']) assert.ok(artFiles.includes(`${base}${scale}.png`), `${base}${scale}.png`);
  }
  assert.ok(existsSync(join(root, 'assets/pose_landmarker_lite.task')));
});

test('shipped source does not import browser-only design assets', () => {
  const sourceFiles: string[] = [];
  const visit = (directory: string) => readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) visit(path); else if (/\.(ts|tsx)$/.test(entry.name)) sourceFiles.push(path);
  });
  visit(join(root, 'src'));
  const source = sourceFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
  assert.doesNotMatch(source, /(?:from\s+|require\()['"][^'"]*(?:assets\/design|\.svg)|\b(document|localStorage|sessionStorage)\./);
});
