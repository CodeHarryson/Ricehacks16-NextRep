import { Text, View } from 'react-native';
import { AvatarArt } from '../../components/art';
import { PlayerHud } from '../../components/PlayerHud';
import { Action, Card, ScreenHeader, styles } from '../../components/ui';
import { colors, spacing, typography, weight } from '../../theme/tokens';
import { usePlayerSummary } from '../progression/usePlayerSummary';

export function HomeScreen({ onStartWorkout, onOpenMap, onOpenProgression }: { onStartWorkout: () => void; onOpenMap: () => void; onOpenProgression: () => void }) {
  const { displayName, player } = usePlayerSummary();
  return <View style={{ gap: spacing.xl }}>
    <PlayerHud displayName={displayName} player={player} />
    <ScreenHeader eyebrow="HACKRICE 16 / FITNESS GAME" title="NextRep" subtitle="Five squats. One small step toward your next level." />
    <Card variant="selected" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
      <AvatarArt framing="full" size={96} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={[typography.bodyLg, { color: colors.text, ...weight('900') }]}>Your next rep starts with you.</Text>
        <Text style={styles.body}>Track a live squat set or challenge approximate nearby demo users.</Text>
      </View>
    </Card>
    <Action title="Start workout" size="lg" onPress={onStartWorkout} />
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <Action title="Nearby map" variant="accent" grow onPress={onOpenMap} />
      <Action title="Progression" variant="secondary" grow onPress={onOpenProgression} />
    </View>
  </View>;
}
