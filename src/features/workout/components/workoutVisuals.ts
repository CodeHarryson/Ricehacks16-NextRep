import { colors, quality } from '../../../theme/tokens';

export type AttemptRating = 'green' | 'yellow' | 'red' | null;

/** Figma rep-quality labels mapped onto the analyzer's real ratings; neutral is RN-only (unassessable). */
export const ATTEMPT_QUALITY_VISUALS: Record<'green' | 'yellow' | 'red' | 'neutral', { label: string; color: string; textColor: string; counted: boolean }> = {
  green: { label: 'Great!', color: quality.green, textColor: colors.primaryDark, counted: true },
  yellow: { label: 'Good', color: quality.yellow, textColor: quality.yellowText, counted: true },
  red: { label: 'Poor form', color: quality.red, textColor: colors.danger, counted: false },
  neutral: { label: 'Not assessed', color: quality.neutral, textColor: colors.textMuted, counted: false },
};

export const attemptQualityVisual = (rating: AttemptRating) => ATTEMPT_QUALITY_VISUALS[rating ?? 'neutral'];

/** Figma timer turns red in the final ten seconds. */
export const TIMER_WARNING_SECONDS = 10;
export const timerColor = (secondsRemaining: number): string => secondsRemaining <= TIMER_WARNING_SECONDS ? colors.danger : colors.text;
