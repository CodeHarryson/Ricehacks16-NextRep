import { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { Action, Card, styles } from '../../components/ui';
import { acceptChallenge, acceptChallengeConfig, createChallenge, declineChallenge, startChallenge, updateChallengeConfig, type Challenge, type ChallengeConfig } from './api';
import { buildChallengeWorkoutSession, ENDED_CHALLENGE_COPY, findActiveChallenge, OPEN_STATUSES, opponentNameFor, shouldAutoLaunchWorkout } from './challengeState';
import { OPPONENT_STATUS_COPY, opponentStatusFromChallenge } from './opponentStatus';
import { useChallengeList } from './useChallengeList';
import type { NearbyUser } from '../location/api';
import type { WorkoutSessionConfig } from '../workout/session';

interface ChallengeScreenProps {
  opponent: NearbyUser | null;
  nearbyUsers: NearbyUser[];
  /** Challenges whose camera session already launched this app session; they are never auto-launched again. */
  launchedChallengeIds: ReadonlySet<string>;
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

export function ChallengeScreen({ opponent, nearbyUsers, launchedChallengeIds, onBack, onStartWorkout }: ChallengeScreenProps) {
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
  const openChallengeWith = (otherId: string) => challenges.find((item) => OPEN_STATUSES.includes(item.status) && (item.senderId === otherId || item.receiverId === otherId));
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

  return <View style={{ gap: 16 }}>
    <Action title="Back to map" onPress={onBack} />
    <Text style={styles.eyebrow}>PROXIMITY / CHALLENGES</Text>
    <Text style={styles.title}>Choose your next test.</Text>
    <Text style={styles.body}>Demo identity: {user?.displayName ?? 'loading…'} (local-only, not authentication).</Text>

    {list.loading && <Card><Text style={styles.heading}>Loading challenges…</Text><Text style={styles.body}>Checking the challenge server for invitations and active matches.</Text></Card>}
    {list.identityError && <Card><Text style={styles.heading}>Challenges unavailable</Text><Text style={styles.body}>{list.identityError}</Text></Card>}
    {list.loadError && <Card>
      <Text style={styles.heading}>{list.loadError.kind === 'network' ? 'Challenge server unreachable' : 'Could not load challenges'}</Text>
      <Text style={styles.body}>{list.loadError.message}</Text>
      {challenges.length > 0 && <Text style={styles.body}>Showing the last known challenges.</Text>}
      <Action title="Retry" onPress={list.refresh} />
    </Card>}
    {list.actionError && <Card>
      <Text style={styles.heading}>Challenge request failed</Text>
      <Text style={styles.body}>{list.actionError}</Text>
      <Action title="Dismiss" onPress={list.dismissActionError} />
    </Card>}
    {list.notices.map((notice) => <Card key={`ended-${notice.challengeId}`}>
      <Text style={styles.heading}>{ENDED_CHALLENGE_COPY[notice.reason].heading}</Text>
      <Text style={styles.body}>{ENDED_CHALLENGE_COPY[notice.reason].body(notice.opponentName)}</Text>
      <Action title="Dismiss" onPress={() => list.dismissNotice(notice.challengeId)} />
    </Card>)}

    {opponent && <Card>
      <Text style={styles.heading}>Selected opponent</Text>
      <Text style={styles.body}>{opponent.displayName} · approximately {opponent.distanceMeters} m away</Text>
      <Action title={busy ? 'Sending…' : 'Send challenge'} onPress={() => mutate((demoUser) => createChallenge(demoUser, opponent))} />
    </Card>}
    <Card>
      <Text style={styles.heading}>Nearby players</Text>
      {otherNearby.length === 0
        ? <Text style={styles.body}>{opponent ? 'No other players nearby.' : 'No players nearby right now. Both devices need location sharing on, within 250 m.'}</Text>
        : otherNearby.map((nearbyUser) => {
          const open = openChallengeWith(nearbyUser.userId);
          return <View key={nearbyUser.userId} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text style={[styles.body, { flexShrink: 1 }]}>{nearbyUser.displayName} · ~{nearbyUser.distanceMeters} m</Text>
            {open ? <Text style={styles.body}>{open.status}</Text> : <Action title={busy ? 'Sending…' : 'Challenge'} onPress={() => mutate((demoUser) => createChallenge(demoUser, nearbyUser))} />}
          </View>;
        })}
    </Card>

    {!list.loading && !list.loadError && incoming.length === 0 && outgoing.length === 0 && !activeChallenge && <Text style={styles.body}>No challenges yet. Challenge a nearby player to get started.</Text>}
    {incoming.map((challenge) => <Card key={challenge.challengeId}>
      <Text style={styles.heading}>Incoming challenge</Text>
      <Text style={styles.body}>{challenge.senderDisplayName} · {challenge.proximityMeters} m away</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Action title="Accept" onPress={() => mutate((demoUser) => acceptChallenge(demoUser.userId, challenge.challengeId))} />
        <Action title="Decline" onPress={() => mutate((demoUser) => declineChallenge(demoUser.userId, challenge.challengeId))} />
      </View>
    </Card>)}
    {outgoing.map((challenge) => <Text key={challenge.challengeId} style={styles.body}>Outgoing: {challenge.receiverDisplayName} · {challenge.status}{user && challenge.status === 'pending' ? ` · ${OPPONENT_STATUS_COPY[opponentStatusFromChallenge(challenge, user.userId)].label}` : ''}</Text>)}

    {activeChallenge && config && user && <Card>
      <Text style={styles.heading}>Shared squat configuration</Text>
      <Text style={styles.body}>Opponent: {opponentNameFor(activeChallenge, user.userId)} · {OPPONENT_STATUS_COPY[opponentStatusFromChallenge(activeChallenge, user.userId)].label}</Text>
      <Text style={styles.body}>Exercise: bodyweight squat · Version {config.configVersion}</Text>
      <Text style={styles.body}>Sender: {activeChallenge.acceptance.senderAcceptedAt ? 'accepted' : 'waiting'} · Receiver: {activeChallenge.acceptance.receiverAcceptedAt ? 'accepted' : 'waiting'}</Text>
      {CONFIG_FIELDS.map(({ field, label }) => <View key={field} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.body}>{label}: {config[field]}</Text>
        {!activeChallenge.locked && <View style={{ flexDirection: 'row', gap: 8 }}>
          <Action title="−" onPress={() => changeConfig(field, -1)} />
          <Action title="+" onPress={() => changeConfig(field, 1)} />
        </View>}
      </View>)}
      <Text style={styles.body}>{activeChallenge.locked ? 'Workout settings locked' : activeChallenge.status === 'ready' ? 'Both players ready' : 'Waiting for the other player'}</Text>
      {activeChallenge.status === 'configuring' && !activeChallenge.acceptance.senderAcceptedAt && !activeChallenge.acceptance.receiverAcceptedAt && <Text style={styles.body}>Configuration changed; acceptance reset.</Text>}
      {(activeChallenge.status === 'accepted' || activeChallenge.status === 'configuring') && <Action title="Accept configuration" onPress={() => mutate((demoUser) => acceptChallengeConfig(demoUser.userId, activeChallenge.challengeId))} />}
      {activeChallenge.status === 'ready' && <Action title="Start workout" onPress={() => mutate((demoUser) => startChallenge(demoUser.userId, activeChallenge.challengeId))} />}
      {activeChallenge.status === 'active' && <>
        <Text style={styles.body}>Workout active — camera session launched.</Text>
        {launchedChallengeIds.has(activeChallenge.challengeId) && <Action title="Return to workout" onPress={() => rejoinWorkout(activeChallenge)} />}
      </>}
    </Card>}
  </View>;
}
