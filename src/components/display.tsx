import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AvatarArt, type AvatarVariant } from './art';
import { styles } from './ui';
import { borders, colors, quality, radii, spacing, tones, typography, type Tone } from '../theme/tokens';

/** Rounded status label. Colour is paired with text so state never relies on colour alone. */
export function Pill({ label, tone = 'neutral', solid = false, icon }: { label: string; tone?: Tone; solid?: boolean; icon?: ReactNode }) {
  const palette = tones[tone];
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill, borderWidth: borders.thin, backgroundColor: solid ? palette.solid : palette.bg, borderColor: solid ? palette.solid : palette.border }}>
    {icon}
    <Text style={[typography.caption, { color: solid ? colors.onColor : palette.text }]}>{label}</Text>
  </View>;
}

/** Large number with a small uppercase label (Figma stat grid). */
export function StatTile({ value, label, color = colors.text, align = 'center' }: { value: string | number; label: string; color?: string; align?: 'center' | 'flex-start' }) {
  return <View accessible accessibilityLabel={`${label}: ${value}`} style={{ flex: 1, alignItems: align, gap: 2, minWidth: 64 }}>
    <Text style={[typography.number, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    <Text style={[typography.micro, { color: colors.textMuted }]}>{label}</Text>
  </View>;
}

export function StatRow({ children }: PropsWithChildren) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md, alignItems: 'flex-start' }}>{children}</View>;
}

/**
 * Proportional green/yellow/red(/neutral) bar built from real counts. Segments are grouped by colour
 * because only totals (not per-rep order) are available.
 */
export function QualityBar({ green, yellow, red, neutral = 0, height = 14 }: { green: number; yellow: number; red: number; neutral?: number; height?: number }) {
  const segments = [{ key: 'green', value: green, color: quality.green }, { key: 'yellow', value: yellow, color: quality.yellow }, { key: 'red', value: red, color: quality.red }, { key: 'neutral', value: neutral, color: quality.neutral }].filter((item) => item.value > 0);
  return <View accessible accessibilityLabel={`${green} green, ${yellow} yellow, ${red} red`} style={{ height, flexDirection: 'row', borderRadius: radii.pill, overflow: 'hidden', backgroundColor: colors.canvas, borderWidth: borders.default, borderColor: colors.border }}>
    {segments.map((item) => <View key={item.key} style={{ flex: item.value, backgroundColor: item.color, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.6)' }} />)}
  </View>;
}

/** Coloured counts under a quality bar. */
export function QualityLegend({ green, yellow, red }: { green: number; yellow: number; red: number }) {
  const items = [{ label: 'green', value: green, dot: quality.green, text: colors.primaryDark }, { label: 'yellow', value: yellow, dot: quality.yellow, text: quality.yellowText }, { label: 'red', value: red, dot: quality.red, text: colors.danger }];
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
    {items.map((item) => <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.dot }} />
      <Text style={[typography.label, { color: item.text }]}>{item.value} {item.label}</Text>
    </View>)}
  </View>;
}

/** Inline status/error/info message with an optional action row. */
export function Banner({ tone, title, message, children, live = false }: PropsWithChildren<{ tone: Tone; title: string; message?: string; live?: boolean }>) {
  const palette = tones[tone];
  return <View accessibilityLiveRegion={live ? 'polite' : undefined} style={{ backgroundColor: palette.bg, borderColor: palette.border, borderWidth: borders.default, borderLeftWidth: 6, borderLeftColor: palette.solid, borderRadius: radii.md, padding: spacing.lg, gap: spacing.sm }}>
    <Text style={[typography.bodyLg, { color: colors.text }]}>{title}</Text>
    {message && <Text style={styles.body}>{message}</Text>}
    {children}
  </View>;
}

/** Collapsed by default; used to de-emphasise developer diagnostics without removing them. */
export function Collapsible({ title, children, initiallyOpen = false }: PropsWithChildren<{ title: string; initiallyOpen?: boolean }>) {
  const [open, setOpen] = useState(initiallyOpen);
  return <View style={{ borderRadius: radii.md, borderWidth: borders.default, borderColor: colors.border, borderStyle: 'dashed', overflow: 'hidden' }}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${title}, ${open ? 'collapse' : 'expand'}`} onPress={() => setOpen(!open)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md }}>
      <Text style={[typography.label, { color: colors.textMuted }]}>{title}</Text>
      <Text style={[typography.label, { color: colors.textMuted }]}>{open ? '▲' : '▼'}</Text>
    </Pressable>
    {open && <View style={{ padding: spacing.md, paddingTop: 0, gap: spacing.md }}>{children}</View>}
  </View>;
}

/** Avatar sprite inside a bordered circle. */
export function AvatarBadge({ variant = 'self', size = 44, ringColor }: { variant?: AvatarVariant; size?: number; ringColor?: string }) {
  const ring = ringColor ?? (variant === 'self' ? colors.accent : colors.danger);
  return <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: borders.strong - 0.5, borderColor: ring, backgroundColor: variant === 'self' ? colors.accentBg : colors.dangerBg, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' }}>
    <AvatarArt variant={variant} size={size * 0.92} />
  </View>;
}

/** Figma step indicator reused for set progress: done ✓ green, current blue, upcoming grey. */
export function SetProgress({ setCount, currentSet, completedSets }: { setCount: number; currentSet: number; completedSets: number }) {
  return <View accessible accessibilityLabel={`Set ${Math.min(currentSet, setCount)} of ${setCount}, ${completedSets} completed`} style={{ flexDirection: 'row', alignItems: 'center' }}>
    {Array.from({ length: setCount }, (_, index) => {
      const done = index < completedSets;
      const current = !done && index === Math.min(currentSet, setCount) - 1;
      return <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, backgroundColor: done ? colors.primary : current ? colors.accent : colors.canvas, borderColor: done ? colors.primary : current ? colors.accent : colors.border }}>
          <Text style={[typography.caption, { fontWeight: '900', color: done || current ? colors.onColor : colors.textMuted }]}>{done ? '✓' : index + 1}</Text>
        </View>
        {index < setCount - 1 && <View style={{ width: 20, height: 2, backgroundColor: done ? colors.primary : colors.border }} />}
      </View>;
    })}
  </View>;
}
