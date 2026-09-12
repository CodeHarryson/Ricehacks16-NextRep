import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Action, Card, styles } from '../../components/ui';
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
  return <View style={{ gap: 20 }}>
    <Text style={styles.eyebrow}>YOUR CHARACTER</Text>
    <Text style={styles.title}>Every rep starts here.</Text>
    <Card>
      {error ? <><Text style={styles.body}>{error}</Text><Action title="Retry" onPress={() => setRetry(retry + 1)} /></> : player ? <>
        <Text style={styles.heading}>{player.xp === 0 && player.overallRating === 60 && player.coins === 0 ? 'Initial player state' : 'Saved player state'}</Text>
        <Text style={styles.body}>{player.overallRating} OVR · {player.xp} XP · {player.coins} coins</Text>
        <Text style={styles.body}>Completed squat-set rewards are saved locally on this phone.</Text>
      </> : <Text style={styles.body}>Loading local player…</Text>}
    </Card>
  </View>;
}
