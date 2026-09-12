import assert from 'node:assert/strict';
import test from 'node:test';
import { EMPTY_STATES } from './emptyStates';
import { backTarget, centerAction, isBottomNavVisible, shouldMountMap, TAB_ORDER, TAB_SCREENS, tabForScreen, type Screen } from './navigation';

const ALL_SCREENS: Screen[] = ['home', 'map', 'challenge', 'workout', 'progression', 'leaderboard', 'notifications', 'profile'];

test('five navigation entries map to real screens with the home/map group in the centre', () => {
  assert.deepEqual(TAB_ORDER, ['progress', 'leaderboard', 'home', 'notifications', 'profile']);
  assert.deepEqual(TAB_SCREENS, { progress: 'progression', leaderboard: 'leaderboard', notifications: 'notifications', profile: 'profile' });
  assert.equal(tabForScreen('home'), 'home');
  assert.equal(tabForScreen('map'), 'home');
  assert.equal(tabForScreen('challenge'), 'home');
  assert.equal(tabForScreen('progression'), 'progress');
  assert.equal(tabForScreen('profile'), 'profile');
});

test('the workout camera is full-focus and every other screen shows the tab bar', () => {
  for (const screen of ALL_SCREENS) assert.equal(isBottomNavVisible(screen), screen !== 'workout');
  assert.equal(tabForScreen('workout'), null);
});

test('the map stays mounted while the challenge screen is open, and only then', () => {
  assert.deepEqual(ALL_SCREENS.filter(shouldMountMap), ['map', 'challenge']);
});

test('centre button transitions: home opens the map, the map starts a solo workout, elsewhere returns home', () => {
  assert.deepEqual(centerAction('home'), { kind: 'navigate', screen: 'map', label: 'Map', icon: 'map' });
  assert.equal(centerAction('map').kind, 'start-solo-workout');
  assert.deepEqual(centerAction('leaderboard'), { kind: 'navigate', screen: 'home', label: 'Home', icon: 'home' });
  assert.deepEqual(centerAction('challenge'), { kind: 'navigate', screen: 'home', label: 'Home', icon: 'home' });
});

test('back navigation preserves the existing flow', () => {
  assert.equal(backTarget('home', 'solo'), null);
  assert.equal(backTarget('challenge', 'solo'), 'map');
  assert.equal(backTarget('workout', 'challenge'), 'map');
  assert.equal(backTarget('workout', 'solo'), 'home');
  assert.equal(backTarget('map', 'solo'), 'home');
  assert.equal(backTarget('notifications', 'challenge'), 'home');
});

test('empty states are honest: no numbers, rankings, names, or simulated data', () => {
  for (const [feature, copy] of Object.entries(EMPTY_STATES)) {
    assert.doesNotMatch(`${copy.title} ${copy.body}`, /\d/, `${feature} copy must not contain statistics`);
    assert.match(`${copy.title} ${copy.body}`, /not|no |coming later|planned/i, `${feature} copy must say the feature is unavailable`);
  }
});
