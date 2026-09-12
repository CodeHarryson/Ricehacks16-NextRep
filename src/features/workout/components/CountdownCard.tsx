import { Text } from 'react-native';
import { Card, styles } from '../../../components/ui';
import type { CountdownView } from '../countdown';

export function CountdownCard({ view, message }: { view: CountdownView; message: string }) {
  if (view.phase !== 'countdown') return <Text accessibilityLiveRegion="polite" style={view.phase === 'expired' ? styles.heading : styles.body}>{message}</Text>;
  return <Card>
    <Text accessibilityLiveRegion="polite" style={styles.title}>{view.secondsUntilStart}</Text>
    <Text style={styles.body}>{message}</Text>
  </Card>;
}
