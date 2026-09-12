import { Text, View } from 'react-native';
import { Pill } from '../../../components/display';
import { Card, styles } from '../../../components/ui';
import { borders, colors, radii, spacing, typography } from '../../../theme/tokens';
import type { WorkoutSessionView } from '../sessionView';

/** Read-only workout settings as Figma goal-card tiles. Challenges show the lock notice; solo never shows opponent rows. */
export function SessionConfigCard({ view }: { view: WorkoutSessionView }) {
  return <Card variant={view.isChallenge ? 'selected' : 'default'}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
      <Text style={[typography.bodyLg, { color: colors.text, fontWeight: '900' }]}>{view.heading}</Text>
      {view.lockedNotice && <Pill label="🔒 Locked" tone="info" solid />}
    </View>
    {view.lockedNotice && <Text style={styles.caption}>{view.lockedNotice}</Text>}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {view.configRows.map((row) => <View key={row.key} accessible accessibilityLabel={`${row.label}: ${row.value}`} style={{ flexGrow: 1, flexBasis: row.key === 'opponent' || row.key === 'exercise' ? '100%' : '45%', backgroundColor: colors.bg, borderWidth: borders.default, borderColor: colors.border, borderRadius: radii.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
        <Text style={[typography.micro, { color: colors.textMuted }]}>{row.label}</Text>
        <Text numberOfLines={1} style={[typography.bodyLg, { color: row.key === 'opponent' ? colors.danger : colors.text, fontWeight: '900' }]}>{row.value}</Text>
      </View>)}
    </View>
    {view.challengeId && <Text selectable style={[typography.caption, { color: colors.iconInactive, fontWeight: '500' }]}>Challenge ID: {view.challengeId}</Text>}
  </Card>;
}
