import { Text, View } from 'react-native';
import { AvatarBadge, Pill } from '../../../components/display';
import { Action, Card, styles } from '../../../components/ui';
import { colors, spacing, typography } from '../../../theme/tokens';
import type { ChallengeErrorInfo } from '../errors';
import { OPPONENT_STATUS_COPY, type OpponentStatus } from '../opponentStatus';
import { OPPONENT_STATUS_TONES } from './challengeVisuals';

export function OpponentStatusCard({ opponentName, status, error, onRetry }: { opponentName: string | null; status: OpponentStatus | null; error: ChallengeErrorInfo | null; onRetry: () => void }) {
  const copy = status ? OPPONENT_STATUS_COPY[status] : null;
  return <Card>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <AvatarBadge variant="opponent" size={48} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text numberOfLines={1} style={[typography.label, { color: colors.textMuted }]}>{opponentName ? `OPPONENT · ${opponentName.toUpperCase()}` : 'OPPONENT'}</Text>
        <View accessibilityLiveRegion="polite"><Pill label={copy?.label ?? 'Checking challenge status…'} tone={status ? OPPONENT_STATUS_TONES[status] : 'neutral'} /></View>
      </View>
    </View>
    <Text style={styles.body}>{copy?.detail ?? 'Loading your opponent’s progress.'}</Text>
    {error && <View style={{ gap: spacing.sm }}>
      <Text style={[styles.body, { color: colors.danger }]}>Result polling failed: {error.message}{status ? ' Showing the last known status.' : ''}</Text>
      <Action title="Retry result polling" variant="secondary" size="sm" onPress={onRetry} />
    </View>}
  </Card>;
}
