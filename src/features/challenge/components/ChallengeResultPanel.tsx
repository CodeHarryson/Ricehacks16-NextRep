import { Text, View } from 'react-native';
import { Action, Card, styles } from '../../../components/ui';
import type { BattleRewardStatus } from '../battleRewardGate';
import type { ChallengeErrorInfo } from '../errors';
import type { ChallengeOutcome, ChallengeResultView, ScoreBreakdown } from '../resultView';

// Presentation tokens: swap these for Figma values without touching result logic.
const OUTCOME_TONES: Record<ChallengeOutcome, string> = { win: '#B5ED80', loss: '#FF8A80', draw: '#F2C94C', cancelled: '#C4CEC6', pending: '#F5F8F0' };
const QUALITY_TONES = { green: '#B5ED80', yellow: '#F2C94C', red: '#FF8A80' } as const;
const REWARD_STATUS_COPY: Record<BattleRewardStatus, string> = { not_applicable: 'Waiting for the server result', saving: 'Saving reward…', saved: 'Reward saved', failed: 'Reward save failed' };

function ScoreBlock({ label, score, note, emptyText }: { label: string; score: ScoreBreakdown | null; note?: string; emptyText: string }) {
  return <View style={{ gap: 4 }}>
    <Text style={styles.body}>{label}</Text>
    {score ? <>
      <Text style={styles.heading}>{score.totalScore} pts</Text>
      <Text style={styles.body}>{score.countedReps} counted reps</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Text style={[styles.body, { color: QUALITY_TONES.green }]}>● {score.greenReps} green</Text>
        <Text style={[styles.body, { color: QUALITY_TONES.yellow }]}>● {score.yellowReps} yellow</Text>
        <Text style={[styles.body, { color: QUALITY_TONES.red }]}>● {score.redAttempts} red</Text>
      </View>
      {note && <Text style={[styles.body, { fontSize: 13 }]}>{note}</Text>}
    </> : <Text style={styles.body}>{emptyText}</Text>}
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
  return <Card>
    <Text style={styles.eyebrow}>CHALLENGE RESULT</Text>
    <Text accessibilityLiveRegion="polite" style={[styles.title, { color: OUTCOME_TONES[view.outcome] }]}>{view.headline}</Text>
    <Text style={styles.body}>{view.detail}</Text>
    <ScoreBlock label="You" score={view.local} note={view.local?.source === 'local' ? 'Local estimate — waiting for server confirmation.' : undefined} emptyText="Your result is not available yet." />
    <ScoreBlock label={view.opponentName} score={view.opponent} emptyText={view.outcome === 'cancelled' ? 'No result submitted.' : 'No result yet.'} />
    <View style={{ gap: 4 }}>
      <Text style={styles.body}>Rewards</Text>
      {view.reward ? <>
        <Text style={styles.heading}>+{view.reward.xp} XP · +{view.reward.coins} coins</Text>
        <Text style={styles.body}>{REWARD_STATUS_COPY[rewardStatus]}</Text>
        {rewardStatus === 'failed' && <Action title="Retry battle reward" onPress={onRetryReward} />}
      </> : <Text style={styles.body}>{view.outcome === 'cancelled' ? 'No battle rewards for a cancelled challenge.' : 'Rewards are granted once the server resolves the challenge.'}</Text>}
    </View>
    {pollError && <Text style={styles.body}>Result polling failed: {pollError.message} Showing the last known result.</Text>}
    {(!settled || pollError) && <Action title="Retry result polling" onPress={onRetryPolling} />}
    {onReturnToMap && <Action title="Return to map" onPress={onReturnToMap} />}
  </Card>;
}
