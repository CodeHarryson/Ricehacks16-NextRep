import { Text, View } from 'react-native';
import { FlameArt } from './art';
import { AvatarBadge, Pill } from './display';
import type { PlayerState } from '../features/progression/storage';
import { borders, colors, elevation, radii, spacing, typography } from '../theme/tokens';

/** Figma ProfileChip: avatar, display name, and OVR (the repo's rating; Figma's "Lvl" has no data here). */
export function ProfileChip({ displayName, overallRating }: { displayName: string | null; overallRating: number | null }) {
  return <View accessible accessibilityLabel={`${displayName ?? 'Loading player'}${overallRating !== null ? `, ${overallRating} OVR` : ''}`} style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start', backgroundColor: colors.bg, borderWidth: 2.5, borderColor: colors.border, borderRadius: radii.md, paddingVertical: spacing.sm, paddingLeft: spacing.sm, paddingRight: spacing.md }, elevation.card]}>
    <AvatarBadge size={38} />
    <View style={{ flexShrink: 1 }}>
      <Text numberOfLines={1} style={[typography.label, { color: colors.text, fontWeight: '900' }]}>{displayName ?? 'Loading…'}</Text>
      {overallRating !== null && <Text style={[typography.caption, { color: colors.accent }]}>{overallRating} OVR</Text>}
    </View>
  </View>;
}

function StripItem({ value, label, color }: { value: number; label: string; color: string }) {
  return <View accessible accessibilityLabel={`${value} ${label}`} style={{ flex: 1, alignItems: 'center' }}>
    <Text numberOfLines={1} adjustsFontSizeToFit style={[typography.bodyLg, { fontWeight: '900', color }]}>{value.toLocaleString()}</Text>
    <Text style={[typography.micro, { color: colors.textMuted }]}>{label}</Text>
  </View>;
}

/**
 * Progression strip using only saved PlayerState. The Figma streak track (flames, % fill, next-level star)
 * is intentionally not drawn: streaks and level targets are not tracked, so there is nothing real to fill.
 */
export function ProgressionStrip({ player }: { player: PlayerState }) {
  const workouts = player.completedWorkoutIds.length;
  return <View style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderWidth: borders.default, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }, elevation.card]}>
    <StripItem value={player.overallRating} label="OVR" color={colors.accent} />
    <StripItem value={player.xp} label="XP" color={colors.xp} />
    <StripItem value={player.coins} label="Coins" color={colors.currencyText} />
    <View accessible accessibilityLabel={`${workouts} completed solo sets`} style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <FlameArt size={18} />
        <Text style={[typography.bodyLg, { fontWeight: '900', color: colors.streakDark }]}>{workouts}</Text>
      </View>
      <Text style={[typography.micro, { color: colors.textMuted }]}>Sets</Text>
    </View>
  </View>;
}

export function PlayerHud({ displayName, player, trailing }: { displayName: string | null; player: PlayerState | null; trailing?: string }) {
  return <View style={{ gap: spacing.md }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
      <ProfileChip displayName={displayName} overallRating={player?.overallRating ?? null} />
      {trailing && <Pill label={trailing} tone="info" />}
    </View>
    {player && <ProgressionStrip player={player} />}
  </View>;
}
