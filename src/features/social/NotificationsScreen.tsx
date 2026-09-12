import { View } from 'react-native';
import { EmptyState } from '../../components/display';
import { Action, ScreenHeader } from '../../components/ui';
import { EMPTY_STATES } from '../../navigation/emptyStates';
import { spacing } from '../../theme/tokens';

/** No notifications backend exists; incoming challenges are only discovered by polling on the Challenges screen. */
export function NotificationsScreen({ onOpenChallenges }: { onOpenChallenges: () => void }) {
  return <View style={{ gap: spacing.xl }}>
    <ScreenHeader eyebrow="ALERTS" title="Notifications" />
    <EmptyState {...EMPTY_STATES.notifications}>
      <Action title="Open challenges" variant="accent" onPress={onOpenChallenges} />
    </EmptyState>
  </View>;
}
