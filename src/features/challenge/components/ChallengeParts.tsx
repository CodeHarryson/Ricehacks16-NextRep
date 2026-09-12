import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { AvatarBadge, Pill } from '../../../components/display';
import { Action } from '../../../components/ui';
import { colors, radii, spacing, typography, weight, type Tone } from '../../../theme/tokens';

/** Compact VS header for an agreed challenge (Figma S3 styling without the full-screen animation). */
export function VsBanner({ selfName, opponentName, statusLabel, statusTone }: { selfName: string; opponentName: string; statusLabel: string; statusTone: Tone }) {
  return <View accessible accessibilityLabel={`${selfName} versus ${opponentName}. ${statusLabel}`} style={{ borderRadius: radii.md, overflow: 'hidden', backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.border }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.md }}>
      <View style={{ flex: 1, alignItems: 'center', gap: spacing.xs, backgroundColor: colors.accentBg, borderRadius: radii.sm, paddingVertical: spacing.sm }}>
        <AvatarBadge size={52} />
        <Text numberOfLines={1} style={[typography.label, { color: colors.text, ...weight('900') }]}>{selfName}</Text>
      </View>
      <Text style={{ fontSize: 30, ...weight('900'), color: colors.goldFill, marginHorizontal: spacing.md, textShadowColor: colors.streak, textShadowRadius: 1, textShadowOffset: { width: 1, height: 1 } }}>VS</Text>
      <View style={{ flex: 1, alignItems: 'center', gap: spacing.xs, backgroundColor: colors.dangerBg, borderRadius: radii.sm, paddingVertical: spacing.sm }}>
        <AvatarBadge variant="opponent" size={52} />
        <Text numberOfLines={1} style={[typography.label, { color: colors.text, ...weight('900') }]}>{opponentName}</Text>
      </View>
    </View>
    <View style={{ alignItems: 'center', paddingBottom: spacing.md }}><Pill label={statusLabel} tone={statusTone} /></View>
  </View>;
}

/** Player row used for nearby, incoming, and outgoing lists. */
export function PlayerRow({ name, detail, trailing }: { name: string; detail?: string; trailing?: ReactNode }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs }}>
    <AvatarBadge variant="opponent" size={40} />
    <View style={{ flex: 1 }}>
      <Text numberOfLines={1} style={[typography.bodyLg, { color: colors.text, ...weight('900') }]}>{name}</Text>
      {detail && <Text style={[typography.caption, { color: colors.textMuted }]}>{detail}</Text>}
    </View>
    {trailing}
  </View>;
}

/** Config value with −/+ controls, or a lock badge once the server has locked the configuration. */
export function ConfigStepperRow({ label, value, locked, onDecrement, onIncrement }: { label: string; value: number; locked: boolean; onDecrement: () => void; onIncrement: () => void }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bg, borderRadius: radii.sm, borderWidth: 2, borderColor: colors.border, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
    <View style={{ flex: 1 }}>
      <Text style={[typography.micro, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.section, { color: colors.text }]}>{value}</Text>
    </View>
    {locked ? <Text accessibilityLabel={`${label} locked`} style={[typography.label, { color: colors.textMuted }]}>🔒</Text> : <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <Action title="−" size="sm" variant="secondary" accessibilityLabel={`Decrease ${label}`} onPress={onDecrement} />
      <Action title="+" size="sm" variant="secondary" accessibilityLabel={`Increase ${label}`} onPress={onIncrement} />
    </View>}
  </View>;
}
