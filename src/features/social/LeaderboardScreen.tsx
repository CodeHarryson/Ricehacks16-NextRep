import { View } from 'react-native';
import { EmptyState } from '../../components/display';
import { ScreenHeader } from '../../components/ui';
import { EMPTY_STATES } from '../../navigation/emptyStates';
import { spacing } from '../../theme/tokens';

/** No ranking backend exists yet, so this screen intentionally shows no players, ranks, or scores. */
export function LeaderboardScreen() {
  return <View style={{ gap: spacing.xl }}>
    <ScreenHeader eyebrow="RANKS" title="Leaderboard" />
    <EmptyState {...EMPTY_STATES.leaderboard} />
    <EmptyState {...EMPTY_STATES.streaks} />
  </View>;
}
