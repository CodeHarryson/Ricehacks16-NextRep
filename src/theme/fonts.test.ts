import assert from 'node:assert/strict';
import test from 'node:test';
import { fontFace, getFontStatus, nextFontStatus, NUNITO_FAMILIES, resetFontStatusForTesting, resolveFontStatus, setFontStatus } from './fonts';
import { typography, weight } from './tokens';

test('font loading resolves to Nunito, or to the system fallback on error or timeout', () => {
  assert.equal(resolveFontStatus({ loaded: false, error: null, timedOut: false }), 'loading');
  assert.equal(resolveFontStatus({ loaded: true, error: null, timedOut: false }), 'loaded');
  assert.equal(resolveFontStatus({ loaded: false, error: new Error('asset missing'), timedOut: false }), 'fallback');
  assert.equal(resolveFontStatus({ loaded: false, error: null, timedOut: true }), 'fallback');
  // An error wins even if expo-font also reports loaded.
  assert.equal(resolveFontStatus({ loaded: true, error: new Error('partial'), timedOut: false }), 'fallback');
});

test('the first final font status sticks so text never switches faces mid-session', () => {
  assert.equal(nextFontStatus('loading', 'loaded'), 'loaded');
  assert.equal(nextFontStatus('fallback', 'loaded'), 'fallback');
  assert.equal(nextFontStatus('loaded', 'loading'), 'loaded');
  resetFontStatusForTesting();
  setFontStatus('fallback');
  setFontStatus('loaded');
  assert.equal(getFontStatus(), 'fallback');
  resetFontStatusForTesting();
});

test('fallback uses the system font at the requested weight; loaded Nunito uses the family with a normal weight', () => {
  assert.deepEqual(fontFace('900', 'fallback'), { fontWeight: '900' });
  assert.deepEqual(fontFace('900', 'loading'), { fontWeight: '900' });
  assert.deepEqual(fontFace('900', 'loaded'), { fontFamily: NUNITO_FAMILIES['900'], fontWeight: 'normal' });
  assert.deepEqual(fontFace('700', 'loaded'), { fontFamily: 'Nunito_700Bold', fontWeight: 'normal' });
  // Body weights stay on the system face even when Nunito is loaded.
  assert.deepEqual(fontFace('500', 'loaded'), { fontWeight: '500' });
});

test('typography tokens read the resolved status at access time', () => {
  resetFontStatusForTesting();
  setFontStatus('fallback');
  assert.equal(typography.title.fontFamily, undefined);
  assert.equal(typography.title.fontWeight, '900');
  resetFontStatusForTesting();
  setFontStatus('loaded');
  assert.equal(typography.title.fontFamily, 'Nunito_900Black');
  assert.equal(typography.label.fontFamily, 'Nunito_700Bold');
  assert.equal(typography.body.fontFamily, undefined);
  assert.deepEqual(weight('800'), { fontFamily: 'Nunito_800ExtraBold', fontWeight: 'normal' });
  resetFontStatusForTesting();
});
