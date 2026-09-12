import { Text, View } from 'react-native';
import { Card, styles } from '../../../components/ui';
import type { WorkoutSessionView } from '../sessionView';

// Presentation tokens: swap for Figma values without touching session logic.
const VALUE_TEXT = { color: '#F5F8F0', fontWeight: '700' } as const;
const DEBUG_TEXT = { fontSize: 12, opacity: 0.7 } as const;

/** Read-only workout settings. Challenges show the lock notice; solo sessions never show opponent rows. */
export function SessionConfigCard({ view, setCount, currentSet, completedSets }: { view: WorkoutSessionView; setCount: number; currentSet: number; completedSets: number }) {
  return <Card>
    <Text style={styles.heading}>{view.heading}</Text>
    {view.lockedNotice && <Text style={styles.body}>🔒 {view.lockedNotice}</Text>}
    {view.configRows.map((row) => <View key={row.key} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={styles.body}>{row.label}</Text>
      <Text style={[styles.body, VALUE_TEXT, { flexShrink: 1, textAlign: 'right' }]}>{row.value}</Text>
    </View>)}
    <Text style={styles.body}>Set {Math.min(currentSet, setCount)}/{setCount} · Completed sets: {completedSets}</Text>
    {view.challengeId && <Text selectable style={[styles.body, DEBUG_TEXT]}>Challenge ID: {view.challengeId}</Text>}
  </Card>;
}
