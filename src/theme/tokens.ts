import { fontFace, getFontStatus, type FontWeight } from './fonts';

/**
 * Visual tokens extracted from the Figma Make prototype (docs/FIGMA_INTEGRATION_PLAN.md §5).
 * Screens and components read these instead of hard-coded values so the design can be retuned in one place.
 */
export const colors = {
  bg: '#FFFFFF',
  canvas: '#E8EDF5',
  surface: '#F5F7FB',
  surface2: '#EBEEF6',
  border: '#C8D0E0',
  text: '#1A2B4A',
  textSecondary: '#4A5A78',
  textMuted: '#7A8BA8',
  iconInactive: '#9AAAC4',
  onColor: '#FFFFFF',
  primary: '#58CC02',
  primaryDark: '#3D9100',
  primaryBg: '#F0FFE6',
  primaryBorder: '#B8E994',
  accent: '#4A90E2',
  accentDark: '#2F6FBD',
  accentBg: '#EFF5FF',
  accentBorder: '#BCD6F5',
  danger: '#FF4B4B',
  dangerDark: '#C0392B',
  dangerBg: '#FFF0F0',
  dangerBorder: '#FECACA',
  streak: '#FF9600',
  streakDark: '#C97200',
  streakBg: '#FFF8EC',
  streakBorder: '#FFD093',
  gold: '#FFD700',
  goldFill: '#FFC300',
  goldText: '#7A4F00',
  currency: '#F59E0B',
  currencyText: '#B45309',
  currencyBg: '#FFFBEB',
  currencyBorder: '#FDE68A',
  xp: '#A855F7',
  xpBg: '#F7F0FF',
  xpBorder: '#E2CCFB',
  scrim: 'rgba(0,0,0,0.35)',
  cameraBg: '#0B1220',
} as const;

/** Rep quality colours. Neutral is not in Figma; the plan proposes the inactive icon grey. */
export const quality = {
  green: colors.primary,
  yellow: colors.gold,
  yellowText: colors.currency,
  red: colors.danger,
  neutral: colors.iconInactive,
} as const;

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'reward';
/** Status chip / banner palettes shared by challenge, workout, and result states. */
export const tones: Record<Tone, { bg: string; border: string; text: string; solid: string }> = {
  neutral: { bg: colors.surface, border: colors.border, text: colors.textMuted, solid: colors.iconInactive },
  info: { bg: colors.accentBg, border: colors.accentBorder, text: colors.accentDark, solid: colors.accent },
  success: { bg: colors.primaryBg, border: colors.primaryBorder, text: colors.primaryDark, solid: colors.primary },
  warning: { bg: colors.streakBg, border: colors.streakBorder, text: colors.streakDark, solid: colors.streak },
  danger: { bg: colors.dangerBg, border: colors.dangerBorder, text: colors.danger, solid: colors.danger },
  reward: { bg: colors.currencyBg, border: colors.currencyBorder, text: colors.currencyText, solid: colors.currency },
};

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radii = { sm: 12, md: 16, lg: 24, pill: 999 } as const;
export const borders = { thin: 1.5, default: 2, strong: 3 } as const;

const TYPE_SCALE = {
  display: { fontSize: 40, lineHeight: 46, fontWeight: '900', letterSpacing: 1 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '900' },
  section: { fontSize: 20, lineHeight: 26, fontWeight: '900' },
  bodyLg: { fontSize: 16, lineHeight: 22, fontWeight: '800' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '500' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  micro: { fontSize: 10, lineHeight: 14, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  number: { fontSize: 28, lineHeight: 32, fontWeight: '900' },
} as const;
type TypeScale = typeof TYPE_SCALE;
type TypeStyle<K extends keyof TypeScale> = Omit<TypeScale[K], 'fontWeight'> & { fontFamily?: string; fontWeight: FontWeight | 'normal' };

const withFace = <K extends keyof TypeScale>(key: K): TypeStyle<K> => ({ ...TYPE_SCALE[key], ...fontFace(TYPE_SCALE[key].fontWeight, getFontStatus()) });

/**
 * Text styles resolve the font at access time: Nunito once FontGate has loaded it, otherwise the system
 * font at the same weight. FontGate renders nothing until the status is final, so no text paints with a
 * face that later changes.
 */
export const typography = {
  get display() { return withFace('display'); },
  get title() { return withFace('title'); },
  get section() { return withFace('section'); },
  get bodyLg() { return withFace('bodyLg'); },
  get body() { return withFace('body'); },
  get label() { return withFace('label'); },
  get caption() { return withFace('caption'); },
  get micro() { return withFace('micro'); },
  get number() { return withFace('number'); },
};

/** Weight override for inline styles; use instead of a bare fontWeight so Nunito faces are honoured. */
export const weight = (value: FontWeight) => fontFace(value, getFontStatus());

/** iOS shadow props plus Android elevation. */
export const elevation = {
  card: { shadowColor: '#1A2B4A', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  raised: { shadowColor: '#1A2B4A', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  cta: (color: string) => ({ shadowColor: color, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 }),
} as const;

export const layout = { gutter: 16, bottomNavHeight: 64, navCtaSize: 60, maxContentWidth: 560, hitSlop: 8 } as const;
