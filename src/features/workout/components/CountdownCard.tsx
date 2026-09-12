import { Text, View } from 'react-native';
import { Banner } from '../../../components/display';
import { Card, styles } from '../../../components/ui';
import { colors, elevation, spacing, typography } from '../../../theme/tokens';
import type { CountdownView } from '../countdown';

export function CountdownCard({ view, message }: { view: CountdownView; message: string }) {
  if (view.phase === 'expired') return <Banner tone="danger" title={message} live />;
  if (view.phase === 'active') return <Text accessibilityLiveRegion="polite" style={[typography.label, { color: colors.textSecondary }]}>{message}</Text>;
  return <Card variant="raised" style={{ alignItems: 'center', gap: spacing.md }}>
    <Text style={[typography.label, { color: colors.textMuted }]}>GET READY</Text>
    <View style={[{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.accent, borderWidth: 4, borderColor: colors.accentDark, alignItems: 'center', justifyContent: 'center' }, elevation.cta(colors.accent)]}>
      <Text accessibilityLiveRegion="polite" accessibilityLabel={`${view.secondsUntilStart} seconds until reps count`} style={{ fontSize: 60, lineHeight: 68, fontWeight: '900', color: colors.onColor }}>{view.secondsUntilStart}</Text>
    </View>
    <Text style={[styles.body, { textAlign: 'center' }]}>{message}</Text>
  </Card>;
}
