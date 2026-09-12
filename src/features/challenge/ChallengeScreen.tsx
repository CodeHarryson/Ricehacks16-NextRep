import { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { Action, Card, IconButton, ScreenHeader, styles } from '../../components/ui';
import { Banner, Pill } from '../../components/display';
import { ConnectionStatusBar } from '../../components/ConnectionStatusBar';
import { DiagnosticsPanel } from '../diagnostics/DiagnosticsPanel';
import { colors, spacing, typography, weight } from '../../theme/tokens';
import { CHALLENGE_STATUS_VISUALS, ENDED_REASON_TONES } from './components/challengeVisuals';
import { ConfigStepperRow, PlayerRow, VsBanner } from './components/ChallengeParts';
import { acceptChallenge, acceptChallengeConfig, createChallenge, declineChallenge, startChallenge, updateChallengeConfig, type Challenge, type ChallengeConfig } from './api';
import { buildChallengeWorkoutSession, challengeSendBlock, ENDED_CHALLENGE_COPY, findActiveChallenge, openChallengeBetween, opponentNameFor, SEND_BLOCK_COPY, shouldAutoLaunchWorkout } from './challengeState';
import { OPPONENT_STATUS_COPY, opponentStatusFromChallenge } from './opponentStatus';
import { useChallengeList } from './useChallengeList';
import type { NearbyUser } from '../location/api';
import type { WorkoutSessionConfig } from '../workout/session';

interface ChallengeScreenProps {
  opponent: NearbyUser | null;
  nearbyUsers: NearbyUser[];
  /** Challenges whose camera session already launched this app session; they are never auto-launched again. */
  launchedChallengeIds: ReadonlySet<string>;
  /** The last challenge workout opened this app session, so its result can be reopened after the list drops it. */
  recentChallengeSession?: WorkoutSessionConfig;
  onBack: () => void;
  onStartWorkout: (session: WorkoutSessionConfig) => void;
}
type ConfigField = 'setCount' | 'targetReps' | 'restSeconds' | 'matchTimeLimitSeconds';
const CONFIG_FIELDS: { field: ConfigField; label: string; min: number; max: number }[] = [
  { field: 'setCount', label: 'Sets', min: 1, max: 3 },
  { field: 'targetReps', label: 'Target reps', min: 1, max: 50 },
  { field: 'restSeconds', label: 'Rest seconds', min: 0, max: 300 },
  { field: 'matchTimeLimitSeconds', label: 'Match time seconds', min: 30, max: 1800 },
];
const INVALID_SESSION_MESSAGE = 'The shared workout configuration or start time is invalid; camera session not started.';
const editable = (config: ChallengeConfig) => ({ exercise: config.exercise, setCount: config.setCount, targetReps: config.targetReps, restSeconds: config.restSeconds, matchTimeLimitSeconds: config.matchTimeLimitSeconds });

export function ChallengeScreen({ opponent, nearbyUsers, launchedChallengeIds, recentChallengeSession, onBack, onStartWorkout }: ChallengeScreenProps) {
  const list = useChallengeList();
  const { user, challenges, busy, mutate, reportActionError } = list;
  const activeChallenge = useMemo(() => findActiveChallenge(challenges, user?.userId ?? null), [challenges, user]);

  useEffect(() => {
    if (!user || !shouldAutoLaunchWorkout(activeChallenge, launchedChallengeIds) || !activeChallenge) return;
    const session = buildChallengeWorkoutSession(activeChallenge, user.userId);
    if (session) onStartWorkout(session); else reportActionError(INVALID_SESSION_MESSAGE);
  }, [activeChallenge, launchedChallengeIds, onStartWorkout, reportActionError, user]);

  const rejoinWorkout = (challenge: Challenge) => {
    if (!user) return;
    const session = buildChallengeWorkoutSession(challenge, user.userId);
    if (session) onStartWorkout(session); else reportActionError(INVALID_SESSION_MESSAGE);
  };
  const openChallengeWith = (otherId: string) => user ? openChallengeBetween(challenges, user.userId, otherId) : undefined;
  const sendBlock = (opponentId: string) => challengeSendBlock({ userId: user?.userId ?? null, hasLoaded: list.hasLoaded, busy, challenges, opponentId });
  const incoming = challenges.filter((challenge) => challenge.receiverId === user?.userId && challenge.status === 'pending');
  const outgoing = challenges.filter((challenge) => challenge.senderId === user?.userId);
  const otherNearby = nearbyUsers.filter((item) => item.userId !== opponent?.userId);
  const config = activeChallenge?.configuration;
  const changeConfig = (field: ConfigField, delta: number) => {
    if (!activeChallenge || !config || activeChallenge.locked) return;
    const bounds = CONFIG_FIELDS.find((item) => item.field === field);
    if (!bounds) return;
    const value = Math.max(bounds.min, Math.min(bounds.max, config[field] + delta));
    mutate((demoUser) => updateChallengeConfig(demoUser.userId, activeChallenge.challengeId, { ...editable(config), [field]: value }));
  };

  const activeStatus = activeChallenge && user ? opponentStatusFromChallenge(activeChallenge, user.userId) : null;
  return <View style={{ gap: spacing.lg }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <IconButton glyph="←" label="Back to map" onPress={onBack} />
      <Text style={styles.label}>Back to map</Text>
    </View>
    <ScreenHeader eyebrow="PROXIMITY / CHALLENGES" title="Choose your next test." subtitle={`Demo identity: ${user?.displayName ?? 'loading…'} (local-only, not authentication).`} />
    {user && <ConnectionStatusBar status={list.connection} lastUpdatedAt={list.lastSyncedAt} onRetry={list.refresh} />}

    {list.loading && <Banner tone="info" title="Loading challenges…" message="Checking the challenge server for invitations and active matches." live />}
    {list.identityError && <Banner tone="danger" title="Challenges unavailable" message={list.identityError} />}
    {list.loadError && !list.hasLoaded && <Banner tone={list.loadError.kind === 'network' ? 'warning' : 'danger'} title={list.loadError.kind === 'network' ? 'Challenge server unreachable' : 'Could not load challenges'} message={list.loadError.message} live>
      <Action title="Retry" variant="secondary" size="sm" onPress={list.refresh} />
    </Banner>}
    {list.actionError && <Banner tone="danger" title="Challenge request failed" message={list.actionError} live>
      <Action title="Dismiss" variant="secondary" size="sm" onPress={list.dismissActionError} />
    </Banner>}
    {list.notices.map((notice) => <Banner key={`ended-${notice.challengeId}`} tone={ENDED_REASON_TONES[notice.reason]} title={ENDED_CHALLENGE_COPY[notice.reason].heading} message={ENDED_CHALLENGE_COPY[notice.reason].body(notice.opponentName)} live>
      <Action title="Dismiss" variant="secondary" size="sm" onPress={() => list.dismissNotice(notice.challengeId)} />
    </Banner>)}

    {opponent && <Card variant="selected">
      <Text style={styles.label}>SELECTED OPPONENT</Text>
      <PlayerRow name={opponent.displayName} detail={`Approximately ${opponent.distanceMeters} m away`} />
      {(() => {
        const block = sendBlock(opponent.userId);
        return <Action title={block ? SEND_BLOCK_COPY[block] : '⚔ Send challenge'} variant="accent" disabled={block !== null} accessibilityLabel="Send challenge" onPress={() => { if (!sendBlock(opponent.userId)) mutate((demoUser) => createChallenge(demoUser, opponent)); }} />;
      })()}
    </Card>}

    {activeChallenge && config && user && <Card variant="raised">
      <VsBanner selfName={user.displayName} opponentName={opponentNameFor(activeChallenge, user.userId)} statusLabel={activeStatus ? OPPONENT_STATUS_COPY[activeStatus].label : CHALLENGE_STATUS_VISUALS[activeChallenge.status].label} statusTone={CHALLENGE_STATUS_VISUALS[activeChallenge.status].tone} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
        <Text style={[typography.bodyLg, { color: colors.text, ...weight('900'), flexShrink: 1 }]}>Shared squat configuration</Text>
        <Pill label={CHALLENGE_STATUS_VISUALS[activeChallenge.status].label} tone={CHALLENGE_STATUS_VISUALS[activeChallenge.status].tone} solid />
      </View>
      <Text style={styles.caption}>Exercise: bodyweight squat · Version {config.configVersion}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Pill label={`Sender: ${activeChallenge.acceptance.senderAcceptedAt ? 'accepted ✓' : 'waiting'}`} tone={activeChallenge.acceptance.senderAcceptedAt ? 'success' : 'warning'} />
        <Pill label={`Receiver: ${activeChallenge.acceptance.receiverAcceptedAt ? 'accepted ✓' : 'waiting'}`} tone={activeChallenge.acceptance.receiverAcceptedAt ? 'success' : 'warning'} />
      </View>
      {CONFIG_FIELDS.map(({ field, label }) => <ConfigStepperRow key={field} label={label} value={config[field]} locked={activeChallenge.locked} onDecrement={() => changeConfig(field, -1)} onIncrement={() => changeConfig(field, 1)} />)}
      <Text style={[typography.label, { color: activeChallenge.locked ? colors.textMuted : activeChallenge.status === 'ready' ? colors.accentDark : colors.streakDark }]}>{activeChallenge.locked ? '🔒 Workout settings locked' : activeChallenge.status === 'ready' ? 'Both players ready' : 'Waiting for the other player'}</Text>
      {activeChallenge.status === 'configuring' && !activeChallenge.acceptance.senderAcceptedAt && !activeChallenge.acceptance.receiverAcceptedAt && <Banner tone="warning" title="Configuration changed; acceptance reset." />}
      {(activeChallenge.status === 'accepted' || activeChallenge.status === 'configuring') && <Action title="Accept configuration" disabled={busy} onPress={() => mutate((demoUser) => acceptChallengeConfig(demoUser.userId, activeChallenge.challengeId))} />}
      {activeChallenge.status === 'ready' && <Action title="Start workout" size="lg" variant="danger" disabled={busy} onPress={() => mutate((demoUser) => startChallenge(demoUser.userId, activeChallenge.challengeId))} />}
      {activeChallenge.status === 'active' && <Banner tone="success" title="Workout active — camera session launched." live>
        {launchedChallengeIds.has(activeChallenge.challengeId) && <Action title="Return to workout" onPress={() => rejoinWorkout(activeChallenge)} />}
      </Banner>}
    </Card>}

    {incoming.map((challenge) => <Card key={challenge.challengeId} tone="info">
      <Text style={[styles.label, { color: colors.accentDark }]}>INCOMING CHALLENGE</Text>
      <PlayerRow name={challenge.senderDisplayName} detail={`${challenge.proximityMeters} m away`} trailing={<Pill label={CHALLENGE_STATUS_VISUALS.pending.label} tone="warning" />} />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Action title="Accept" grow disabled={busy} onPress={() => mutate((demoUser) => acceptChallenge(demoUser.userId, challenge.challengeId))} />
        <Action title="Decline" grow variant="secondary" disabled={busy} onPress={() => mutate((demoUser) => declineChallenge(demoUser.userId, challenge.challengeId))} />
      </View>
    </Card>)}

    <Card>
      <Text style={[typography.bodyLg, { color: colors.text, ...weight('900') }]}>Nearby players</Text>
      {otherNearby.length === 0
        ? <Text style={styles.body}>{opponent ? 'No other players nearby.' : 'No players nearby right now. Both devices need location sharing on, within 250 m.'}</Text>
        : otherNearby.map((nearbyUser) => {
          const open = openChallengeWith(nearbyUser.userId);
          return <PlayerRow key={nearbyUser.userId} name={nearbyUser.displayName} detail={`~${nearbyUser.distanceMeters} m`} trailing={open
            ? <Pill label={CHALLENGE_STATUS_VISUALS[open.status].label} tone={CHALLENGE_STATUS_VISUALS[open.status].tone} />
            : <Action title={busy ? 'Sending…' : 'Challenge'} size="sm" variant="accent" disabled={sendBlock(nearbyUser.userId) !== null} accessibilityLabel={`Challenge ${nearbyUser.displayName}`} onPress={() => { if (!sendBlock(nearbyUser.userId)) mutate((demoUser) => createChallenge(demoUser, nearbyUser)); }} />} />;
        })}
    </Card>

    {outgoing.length > 0 && <Card>
      <Text style={[typography.bodyLg, { color: colors.text, ...weight('900') }]}>Sent challenges</Text>
      {outgoing.map((challenge) => <PlayerRow key={challenge.challengeId} name={challenge.receiverDisplayName} detail={user && challenge.status === 'pending' ? OPPONENT_STATUS_COPY[opponentStatusFromChallenge(challenge, user.userId)].label : undefined} trailing={<Pill label={CHALLENGE_STATUS_VISUALS[challenge.status].label} tone={CHALLENGE_STATUS_VISUALS[challenge.status].tone} />} />)}
    </Card>}

    {recentChallengeSession && recentChallengeSession.challengeId !== activeChallenge?.challengeId && <Card>
      <Text style={styles.label}>YOUR LAST CHALLENGE</Text>
      <PlayerRow name={recentChallengeSession.opponentName ?? 'Opponent'} detail="Reopen to see the submitted or final result." />
      <Action title="Reopen last challenge" variant="secondary" onPress={() => onStartWorkout(recentChallengeSession)} />
    </Card>}

    {!list.loading && !list.loadError && incoming.length === 0 && outgoing.length === 0 && !activeChallenge && <Text style={[styles.body, { textAlign: 'center' }]}>No challenges yet. Challenge a nearby player to get started.</Text>}
    <DiagnosticsPanel />
  </View>;
}
