import { Text } from 'react-native';
import { Action, Card, styles } from '../../../components/ui';
import type { ChallengeErrorInfo } from '../errors';
import { OPPONENT_STATUS_COPY, type OpponentStatus } from '../opponentStatus';

export function OpponentStatusCard({ opponentName, status, error, onRetry }: { opponentName: string | null; status: OpponentStatus | null; error: ChallengeErrorInfo | null; onRetry: () => void }) {
  const copy = status ? OPPONENT_STATUS_COPY[status] : null;
  return <Card>
    <Text style={styles.eyebrow}>{opponentName ? `OPPONENT / ${opponentName.toUpperCase()}` : 'OPPONENT'}</Text>
    <Text accessibilityLiveRegion="polite" style={styles.heading}>{copy?.label ?? 'Checking challenge status…'}</Text>
    <Text style={styles.body}>{copy?.detail ?? 'Loading your opponent’s progress.'}</Text>
    {error && <>
      <Text style={styles.body}>Result polling failed: {error.message}{status ? ' Showing the last known status.' : ''}</Text>
      <Action title="Retry result polling" onPress={onRetry} />
    </>}
  </Card>;
}
