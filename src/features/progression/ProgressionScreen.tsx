import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { AvatarArt, FlameArt } from '../../components/art';
import { Banner, Pill, StatRow, StatTile } from '../../components/display';
import { Action, Card, ScreenHeader, styles } from '../../components/ui';
import { colors, spacing } from '../../theme/tokens';
import { loadPlayer, type PlayerState } from './storage';

export function ProgressionScreen() {
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let mounted = true;
    setError(null);
    loadPlayer().then((value) => { if (mounted) setPlayer(value); })
      .catch(() => { if (mounted) setError('Could not load or save progression. Existing data has not been overwritten.'); });
    return () => { mounted = false; };
  }, [retry]);
  return <View style={{ gap: spacing.xl }}>
    <ScreenHeader eyebrow="YOUR CHARACTER" title="Every rep starts here." />
    {error ? <Banner tone="danger" title="Progression unavailable" message={error}><Action title="Retry" variant="secondary" size="sm" onPress={() => setRetry(retry + 1)} /></Banner> : player ? <>
      <Card variant="selected" style={{ alignItems: 'center' }}>
        <AvatarArt framing="full" size={150} />
        <Pill label={player.xp === 0 && player.overallRating === 60 && player.coins === 0 ? 'Initial player state' : 'Saved player state'} tone="info" solid />
      </Card>
      <Card variant="plain">
        <StatRow>
          <StatTile value={player.overallRating} label="OVR" color={colors.accent} />
          <StatTile value={player.xp} label="XP" color={colors.xp} />
          <StatTile value={player.coins} label="Coins" color={colors.currencyText} />
        </StatRow>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}>
          <FlameArt size={20} />
          <Text style={[styles.label, { color: colors.streakDark }]}>{player.completedWorkoutIds.length} completed solo sets</Text>
        </View>
        <Text style={[styles.caption, { textAlign: 'center' }]}>Completed squat-set rewards are saved locally on this phone.</Text>
      </Card>
    </> : <Banner tone="info" title="Loading local player…" live />}
  </View>;
}
