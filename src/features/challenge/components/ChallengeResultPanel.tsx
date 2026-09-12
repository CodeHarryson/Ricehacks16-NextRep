import { Text, View } from 'react-native';
import { AvatarArt } from '../../../components/art';
import { Pill, QualityBar, QualityLegend } from '../../../components/display';
import { Action, Card, styles } from '../../../components/ui';
import { borders, colors, radii, spacing, tones, typography, weight } from '../../../theme/tokens';
import type { BattleRewardStatus } from '../battleRewardGate';
import type { ChallengeErrorInfo } from '../errors';
import type { ChallengeResultView, ScoreBreakdown } from '../resultView';
import { OUTCOME_VISUALS } from './challengeVisuals';

const REWARD_STATUS_COPY: Record<BattleRewardStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'danger' }> = {
  not_applicable: { label: 'Waiting for the server result', tone: 'neutral' },
  saving: { label: 'Saving reward…', tone: 'info' },
  saved: { label: 'Reward saved', tone: 'success' },
  failed: { label: 'Reward save failed', tone: 'danger' },
};

function PlayerScore({ name, variant, score, highlight, badge, note, emptyText }: { name: string; variant: 'self' | 'opponent'; score: ScoreBreakdown | null; highlight: boolean; badge?: { label: string; tone: 'success' | 'danger' | 'reward' }; note?: string; emptyText: string }) {
  return <View style={{ flex: 1, minWidth: 140, alignItems: 'center', gap: spacing.xs, backgroundColor: variant === 'self' ? colors.accentBg : colors.surface, borderRadius: radii.md, borderWidth: highlight ? borders.strong - 0.5 : borders.default, borderColor: highlight ? colors.accent : colors.border, padding: spacing.md }}>
    <AvatarArt variant={variant} framing="full" size={72} />
    {badge ? <Pill label={badge.label} tone={badge.tone} solid={badge.tone !== 'danger'} /> : null}
    <Text numberOfLines={1} style={[typography.label, { color: colors.text, ...weight('900') }]}>{name}</Text>
    {score ? <>
      <Text accessibilityLabel={`${score.totalScore} points`} style={[typography.number, { color: colors.currencyText }]}>{score.totalScore}<Text style={[typography.caption, { color: colors.currencyText }]}> pts</Text></Text>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{score.countedReps} counted reps</Text>
      <View style={{ alignSelf: 'stretch' }}><QualityBar green={score.greenReps} yellow={score.yellowReps} red={score.redAttempts} height={12} /></View>
      <QualityLegend green={score.greenReps} yellow={score.yellowReps} red={score.redAttempts} />
      {note && <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>{note}</Text>}
    </> : <Text style={[styles.caption, { textAlign: 'center' }]}>{emptyText}</Text>}
  </View>;
}

function RewardRow({ label, value, color }: { label: string; value: string; color: string }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
    <Text style={[typography.label, { color: colors.textMuted }]}>{label}</Text>
    <Text style={[typography.bodyLg, { ...weight('900'), color }]}>{value}</Text>
  </View>;
}

interface ChallengeResultPanelProps {
  view: ChallengeResultView;
  pollError: ChallengeErrorInfo | null;
  rewardStatus: BattleRewardStatus;
  onRetryPolling: () => void;
  onRetryReward: () => void;
  onReturnToMap?: () => void;
}

export function ChallengeResultPanel({ view, pollError, rewardStatus, onRetryPolling, onRetryReward, onReturnToMap }: ChallengeResultPanelProps) {
  const settled = view.outcome !== 'pending';
  const visual = OUTCOME_VISUALS[view.outcome];
  const palette = tones[visual.tone];
  const selfBadge = view.outcome === 'win' ? { label: '👑 WINNER', tone: 'reward' as const } : view.outcome === 'loss' ? { label: 'Defeated', tone: 'danger' as const } : view.outcome === 'draw' ? { label: '🤝 Draw', tone: 'reward' as const } : undefined;
  const opponentBadge = view.outcome === 'loss' ? { label: '👑 WINNER', tone: 'reward' as const } : view.outcome === 'win' ? { label: 'Defeated', tone: 'danger' as const } : view.outcome === 'draw' ? { label: '🤝 Draw', tone: 'reward' as const } : undefined;
  return <Card variant="raised" style={{ gap: spacing.lg }}>
    <View style={{ alignItems: 'center', gap: spacing.xs, backgroundColor: palette.bg, borderColor: palette.border, borderWidth: borders.default, borderRadius: radii.md, padding: spacing.lg }}>
      <Text style={[typography.label, { color: colors.textMuted }]}>CHALLENGE RESULT</Text>
      <Text accessibilityLiveRegion="polite" accessibilityRole="header" style={[typography.display, { color: palette.solid === colors.iconInactive ? colors.textSecondary : palette.text, textAlign: 'center' }]}>{visual.emoji} {view.headline}</Text>
      <Text style={[styles.body, { textAlign: 'center' }]}>{view.detail}</Text>
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      <PlayerScore name="You" variant="self" score={view.local} highlight={view.outcome === 'win'} badge={selfBadge} note={view.local?.source === 'local' ? 'Local estimate — waiting for server confirmation.' : undefined} emptyText="Your result is not available yet." />
      <PlayerScore name={view.opponentName} variant="opponent" score={view.opponent} highlight={view.outcome === 'loss'} badge={opponentBadge} emptyText={view.outcome === 'cancelled' ? 'No result submitted.' : 'No result yet.'} />
    </View>
    <View style={{ backgroundColor: colors.surface, borderWidth: borders.default, borderColor: colors.border, borderRadius: radii.md, padding: spacing.lg, gap: spacing.sm }}>
      <Text style={[typography.label, { color: colors.textMuted, textAlign: 'center' }]}>REWARDS</Text>
      {view.reward ? <>
        <RewardRow label="Battle XP" value={`+${view.reward.xp} XP`} color={colors.xp} />
        <RewardRow label="Coins" value={`+${view.reward.coins} coins`} color={colors.currencyText} />
        <View style={{ alignItems: 'center', paddingTop: spacing.xs }}><Pill label={REWARD_STATUS_COPY[rewardStatus].label} tone={REWARD_STATUS_COPY[rewardStatus].tone} /></View>
        {rewardStatus === 'failed' && <Action title="Retry battle reward" variant="secondary" onPress={onRetryReward} />}
      </> : <Text style={[styles.body, { textAlign: 'center' }]}>{view.outcome === 'cancelled' ? 'No battle rewards for a cancelled challenge.' : 'Rewards are granted once the server resolves the challenge.'}</Text>}
    </View>
    {pollError && <Text style={[styles.body, { color: colors.danger }]}>Result polling failed: {pollError.message} Showing the last known result.</Text>}
    {(!settled || pollError) && <Action title="Retry result polling" variant="secondary" onPress={onRetryPolling} />}
    {onReturnToMap && <Action title="← Return to map" size="lg" accessibilityLabel="Return to map" onPress={onReturnToMap} />}
  </Card>;
}
