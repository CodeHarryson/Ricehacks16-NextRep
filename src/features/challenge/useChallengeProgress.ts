import { useCallback, useEffect, useRef, useState } from 'react';
import { grantBattleReward } from '../progression/storage';
import { loadDemoUser } from '../location/identity';
import { diagnosticsStore } from '../diagnostics/diagnosticsStore';
import { getChallengeResults, type ChallengeResult } from './api';
import { BattleRewardGate, type BattleRewardStatus } from './battleRewardGate';
import { connectionStatus, type ConnectionStatus } from './connectionStatus';
import { opponentStatusFromResults, type OpponentStatus } from './opponentStatus';
import { startForegroundPolling } from './pollingLifecycle';
import { ChallengeResultPoller, INITIAL_RESULT_POLL_STATE, type ResultPollState } from './resultPolling';

export interface ChallengeProgress {
  userId: string | null;
  identityError: string | null;
  poll: ResultPollState;
  connection: ConnectionStatus;
  myResult: ChallengeResult | null;
  opponentResult: ChallengeResult | null;
  /** null until identity and the first result poll have loaded. */
  opponentStatus: OpponentStatus | null;
  rewardStatus: BattleRewardStatus;
  retryPolling: () => void;
  retryReward: () => void;
}

/**
 * Challenge-only data for the workout screen: result polling (paused in the background, stopped once final),
 * opponent status, and the one-time battle reward. Inert when disabled so solo workouts make no requests.
 */
export function useChallengeProgress({ challengeId, enabled, localSubmitted }: { challengeId?: string; enabled: boolean; localSubmitted: boolean }): ChallengeProgress {
  const [userId, setUserId] = useState<string | null>(null);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [poll, setPoll] = useState<ResultPollState>(INITIAL_RESULT_POLL_STATE);
  const [rewardStatus, setRewardStatus] = useState<BattleRewardStatus>('not_applicable');
  const poller = useRef<ChallengeResultPoller | null>(null);
  const rewardGate = useRef<BattleRewardGate | null>(null);
  if (rewardGate.current === null) rewardGate.current = new BattleRewardGate(grantBattleReward, setRewardStatus);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    void loadDemoUser()
      .then((user) => { if (mounted) setUserId(user.userId); })
      .catch(() => { if (mounted) setIdentityError('Could not load the demo identity, so challenge results cannot be checked.'); });
    return () => { mounted = false; };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !challengeId || !userId) return;
    diagnosticsStore.update({ challengeId, userId });
    const active = new ChallengeResultPoller(() => getChallengeResults(userId, challengeId), (state) => {
      setPoll(state);
      if (state.lastUpdatedAt !== null) diagnosticsStore.update({ lastResultSyncAt: state.lastUpdatedAt });
    });
    poller.current = active;
    const stop = startForegroundPolling(active);
    return () => { stop(); poller.current = null; };
  }, [challengeId, enabled, userId]);

  const resolution = poll.snapshot?.resolution;
  useEffect(() => {
    if (challengeId && userId && resolution) void rewardGate.current?.request(challengeId, userId, resolution);
  }, [challengeId, resolution, userId]);

  const retryPolling = useCallback(() => { void poller.current?.poll(); }, []);
  const retryReward = useCallback(() => {
    if (challengeId && userId && resolution) void rewardGate.current?.request(challengeId, userId, resolution, { manual: true });
  }, [challengeId, resolution, userId]);

  const results = poll.snapshot?.results ?? [];
  return {
    userId,
    identityError,
    poll,
    connection: connectionStatus(poll),
    myResult: userId ? results.find((item) => item.participantId === userId) ?? null : null,
    opponentResult: userId ? results.find((item) => item.participantId !== userId) ?? null : null,
    opponentStatus: userId && poll.snapshot ? opponentStatusFromResults({ userId, results: poll.snapshot.results, resolution: poll.snapshot.resolution, localSubmitted }) : null,
    rewardStatus,
    retryPolling,
    retryReward,
  };
}
