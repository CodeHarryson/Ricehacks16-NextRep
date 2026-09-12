/**
 * Nunito (the Figma display face) loaded at runtime through expo-font. This module is pure so the
 * fallback rules are testable; the React loading gate lives in src/theme/FontGate.tsx.
 */
export type FontWeight = '400' | '500' | '600' | '700' | '800' | '900';
export type FontStatus = 'loading' | 'loaded' | 'fallback';

/** Families registered with expo-font. Only heavy display weights are loaded; body text stays on the system face (Figma uses Inter there). */
export const NUNITO_FAMILIES = { '700': 'Nunito_700Bold', '800': 'Nunito_800ExtraBold', '900': 'Nunito_900Black' } as const;
type NunitoWeight = keyof typeof NUNITO_FAMILIES;

/** Never hold the UI on a slow or broken font load for longer than this. */
export const FONT_LOAD_TIMEOUT_MS = 3_000;

export function resolveFontStatus(input: { loaded: boolean; error: unknown; timedOut: boolean }): FontStatus {
  if (input.error) return 'fallback';
  if (input.loaded) return 'loaded';
  return input.timedOut ? 'fallback' : 'loading';
}

/** A late load after a timeout must not flip already-rendered text to a different face mid-session. */
export function nextFontStatus(current: FontStatus, resolved: FontStatus): FontStatus {
  return current === 'loading' ? resolved : current;
}

const isNunitoWeight = (weight: FontWeight): weight is NunitoWeight => weight in NUNITO_FAMILIES;

/**
 * Loaded Nunito faces are selected by family name with a normal weight (a custom face plus a bold weight
 * makes Android synthesise faux-bold). Anything else uses the system font with the requested weight.
 */
export function fontFace(weight: FontWeight, status: FontStatus): { fontFamily?: string; fontWeight: FontWeight | 'normal' } {
  if (status === 'loaded' && isNunitoWeight(weight)) return { fontFamily: NUNITO_FAMILIES[weight], fontWeight: 'normal' };
  return { fontWeight: weight };
}

let activeStatus: FontStatus = 'loading';
export const getFontStatus = (): FontStatus => activeStatus;
export function setFontStatus(status: FontStatus): FontStatus {
  activeStatus = nextFontStatus(activeStatus, status);
  return activeStatus;
}
/** Tests only. */
export function resetFontStatusForTesting(): void { activeStatus = 'loading'; }
