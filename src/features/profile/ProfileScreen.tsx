import { Text, View } from 'react-native';
import { AvatarArt } from '../../components/art';
import { EmptyState, Pill } from '../../components/display';
import { Action, Card, ScreenHeader, styles } from '../../components/ui';
import { EMPTY_STATES } from '../../navigation/emptyStates';
import { colors, spacing, typography } from '../../theme/tokens';
import { usePlayerSummary } from '../progression/usePlayerSummary';

/**
 * Identity only. Wins/losses, rank, friends, history, and cosmetics have no data source yet, so they are
 * shown as empty states rather than numbers. Real OVR/XP/coins live on the Progress screen.
 */
export function ProfileScreen({ onOpenProgress }: { onOpenProgress: () => void }) {
  const { displayName } = usePlayerSummary();
  return <View style={{ gap: spacing.xl }}>
    <ScreenHeader eyebrow="PROFILE" title="Your player" />
    <Card variant="selected" style={{ alignItems: 'center' }}>
      <AvatarArt framing="full" size={140} />
      <Text style={[typography.title, { color: colors.text }]}>{displayName ?? 'Loading…'}</Text>
      <Pill label="Local demo identity — not an account" tone="warning" />
      <Text style={[styles.caption, { textAlign: 'center' }]}>This name is generated on this phone. There are no accounts or sign-in yet.</Text>
      <Action title="View progress" variant="secondary" onPress={onOpenProgress} />
    </Card>
    <EmptyState {...EMPTY_STATES.challengeHistory} />
    <EmptyState {...EMPTY_STATES.friends} />
    <EmptyState {...EMPTY_STATES.cosmetics} />
  </View>;
}
