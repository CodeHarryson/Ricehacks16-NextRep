import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { borders, colors, elevation, layout, radii, spacing, tones, typography, weight, type Tone } from '../theme/tokens';

export type ActionVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
const ACTION_PALETTE: Record<ActionVariant, { bg: string; edge: string; text: string; shadow: string | null }> = {
  primary: { bg: colors.primary, edge: colors.primaryDark, text: colors.onColor, shadow: colors.primary },
  accent: { bg: colors.accent, edge: colors.accentDark, text: colors.onColor, shadow: colors.accent },
  danger: { bg: colors.danger, edge: colors.dangerDark, text: colors.onColor, shadow: colors.danger },
  secondary: { bg: colors.surface, edge: colors.border, text: colors.textSecondary, shadow: null },
  ghost: { bg: 'transparent', edge: 'transparent', text: colors.accentDark, shadow: null },
};

interface ActionProps {
  title: string;
  onPress: () => void;
  variant?: ActionVariant;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Grow to fill a row of buttons. */
  grow?: boolean;
  icon?: ReactNode;
}

/** Chunky Figma button: solid fill with a darker bottom edge; disabled uses the canvas treatment. */
export function Action({ title, onPress, variant = 'primary', size = 'md', disabled = false, accessibilityLabel, accessibilityHint, grow, icon }: ActionProps) {
  const palette = ACTION_PALETTE[variant];
  const padding = size === 'sm' ? { paddingVertical: 8, paddingHorizontal: 14, minWidth: 44 } : size === 'lg' ? { paddingVertical: 17, paddingHorizontal: 20 } : { paddingVertical: 13, paddingHorizontal: 18 };
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityHint={accessibilityHint}
    accessibilityState={{ disabled }}
    disabled={disabled}
    hitSlop={size === 'sm' ? layout.hitSlop : undefined}
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      padding,
      { backgroundColor: palette.bg, borderColor: palette.edge, borderBottomWidth: variant === 'ghost' ? 0 : 4 },
      variant === 'secondary' && { borderWidth: borders.default, borderBottomWidth: 4 },
      palette.shadow && !disabled ? elevation.cta(palette.shadow) : null,
      disabled && styles.buttonDisabled,
      grow && { flex: 1 },
      pressed && !disabled && { transform: [{ scale: 0.97 }], borderBottomWidth: variant === 'ghost' ? 0 : 2 },
    ]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      {icon}
      <Text style={[styles.buttonText, size === 'lg' && { fontSize: 18 }, size === 'sm' && { fontSize: 15 }, { color: disabled ? colors.textMuted : palette.text }]}>{title}</Text>
    </View>
  </Pressable>;
}

export type CardVariant = 'default' | 'raised' | 'selected' | 'plain';
export function Card({ children, variant = 'default', tone, style }: PropsWithChildren<{ variant?: CardVariant; tone?: Tone; style?: StyleProp<ViewStyle> }>) {
  return <View style={[
    styles.card,
    variant === 'raised' && [{ backgroundColor: colors.bg }, elevation.raised],
    variant === 'selected' && { backgroundColor: colors.accentBg, borderColor: colors.accent },
    variant === 'plain' && { backgroundColor: colors.bg },
    tone && { backgroundColor: tones[tone].bg, borderColor: tones[tone].border },
    style,
  ]}>{children}</View>;
}

/** Small circular icon/text button (exit ✕, back ‹). Always pass an accessibility label. */
export function IconButton({ glyph, label, onPress }: { glyph: string; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={layout.hitSlop} onPress={onPress}
    style={({ pressed }) => [styles.iconButton, pressed && { transform: [{ scale: 0.9 }] }]}>
    <Text style={styles.iconButtonGlyph}>{glyph}</Text>
  </Pressable>;
}

export function ScreenHeader({ eyebrow, title, subtitle, trailing }: { eyebrow?: string; title: string; subtitle?: string; trailing?: ReactNode }) {
  return <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
    <View style={{ flex: 1, gap: spacing.xs }}>
      {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.body}>{subtitle}</Text>}
    </View>
    {trailing}
  </View>;
}

const layoutStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: layout.gutter, gap: spacing.lg, paddingBottom: spacing.xxxl, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: borders.default, borderColor: colors.border, padding: spacing.lg, gap: spacing.md },
  button: { borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', borderWidth: 0 },
  buttonDisabled: { backgroundColor: colors.canvas, borderColor: colors.border, borderWidth: borders.default, borderBottomWidth: borders.default },
  iconButton: { width: 36, height: 36, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: borders.default, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
});

/** Text styles are getters so they pick up the font resolved by FontGate rather than the import-time default. */
export const styles = {
  ...layoutStyles,
  get eyebrow() { return { ...typography.label, color: colors.textMuted, letterSpacing: 1.2 }; },
  get title() { return { ...typography.title, color: colors.text }; },
  get heading() { return { ...typography.section, color: colors.text }; },
  get body() { return { ...typography.body, color: colors.textSecondary }; },
  get label() { return { ...typography.label, color: colors.textMuted }; },
  get caption() { return { ...typography.caption, color: colors.textMuted }; },
  get buttonText() { return { ...typography.bodyLg, ...weight('900'), color: colors.onColor, textAlign: 'center' as const }; },
  get iconButtonGlyph() { return { fontSize: 18, lineHeight: 20, ...weight('900'), color: colors.textMuted }; },
};
