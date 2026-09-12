import { useCallback, useEffect, useRef, useState } from 'react';
import { loadDemoUser, type DemoUser } from '../location/identity';
import { diagnosticsStore } from '../diagnostics/diagnosticsStore';
import { listChallenges, type Challenge } from './api';
import { readChallengeCache, writeChallengeCache } from './challengeListCache';
import { detectEndedChallenges, findActiveChallenge, mergeNotices, type EndedChallengeNotice } from './challengeState';
import { connectionStatus, type ConnectionStatus } from './connectionStatus';
import { describeChallengeError, type ChallengeErrorInfo } from './errors';
import { startForegroundPolling } from './pollingLifecycle';
import { initialSyncState, SyncPoller, type SyncState } from './syncPoller';

export interface ChallengeListState {
  user: DemoUser | null;
  challenges: Challenge[];
  /** True until the identity and a first challenge list (live or cached) are available. */
  loading: boolean;
  /** A list has been loaded at least once, so duplicate checks against it are meaningful. */
  hasLoaded: boolean;
  identityError: string | null;
  /** Polling failure; the last known challenges stay visible. */
  loadError: ChallengeErrorInfo | null;
  connection: ConnectionStatus;
  lastSyncedAt: number | null;
  actionError: string | null;
  busy: boolean;
  notices: EndedChallengeNotice[];
  refresh: () => void;
  mutate: (operation: (user: DemoUser) => Promise<Challenge>) => void;
  dismissNotice: (challengeId: string) => void;
  dismissActionError: () => void;
  reportActionError: (message: string) => void;
}

export function useChallengeList(): ChallengeListState {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [challenges, setChallengesState] = useState<Challenge[]>([]);
  const [sync, setSync] = useState<SyncState<Challenge[]>>(initialSyncState<Challenge[]>());
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notices, setNotices] = useState<EndedChallengeNotice[]>([]);
  const latest = useRef<Challenge[]>([]);
  // A ref, not state: two taps in the same render must not both send a request.
  const mutationInFlight = useRef(false);
  const poller = useRef<SyncPoller<Challenge[]> | null>(null);
  const setChallenges = useCallback((userId: string, next: Challenge[], syncedAt: number) => {
    latest.current = next; setChallengesState(next); writeChallengeCache(userId, next, syncedAt);
    diagnosticsStore.update({ challengeId: findActiveChallenge(next, userId)?.challengeId ?? null });
  }, []);

  useEffect(() => {
    let mounted = true;
    void loadDemoUser().then((demoUser) => { if (mounted) { setUser(demoUser); diagnosticsStore.update({ userId: demoUser.userId }); } })
      .catch(() => { if (mounted) setIdentityError('Could not load the demo identity.'); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    // Re-entry: start from the last known list so it shows instantly and expiry while away is detected.
    const cached = readChallengeCache(user.userId);
    if (cached) { latest.current = cached.snapshot; setChallengesState(cached.snapshot); }
    const initial = initialSyncState<Challenge[]>(cached);
    setSync(initial);
    const active = new SyncPoller<Challenge[]>(() => listChallenges(user.userId), (state) => {
      setSync(state);
      if (state.status !== 'ready' || !state.snapshot || state.lastUpdatedAt === null) return;
      const ended = detectEndedChallenges(latest.current, state.snapshot, user.userId);
      if (ended.length > 0) setNotices((current) => mergeNotices(current, ended));
      setChallenges(user.userId, state.snapshot, state.lastUpdatedAt);
      diagnosticsStore.update({ lastChallengeSyncAt: state.lastUpdatedAt });
    }, { initial, fallbackMessage: 'Could not load challenges.' });
    poller.current = active;
    const stop = startForegroundPolling(active);
    return () => { stop(); poller.current = null; };
  }, [setChallenges, user]);

  const refresh = useCallback(() => { void poller.current?.poll(); }, []);

  const mutate = useCallback((operation: (demoUser: DemoUser) => Promise<Challenge>) => {
    if (!user || mutationInFlight.current) return;
    mutationInFlight.current = true; setBusy(true); setActionError(null);
    void operation(user)
      .then((updated) => {
        const current = latest.current;
        const next = current.some((item) => item.challengeId === updated.challengeId) ? current.map((item) => item.challengeId === updated.challengeId ? updated : item) : [updated, ...current];
        setChallenges(user.userId, next, Date.now());
      })
      .catch((caught: unknown) => setActionError(describeChallengeError(caught, 'Challenge request failed.').message))
      .finally(() => { mutationInFlight.current = false; setBusy(false); });
  }, [setChallenges, user]);

  return {
    user,
    challenges,
    loading: !identityError && (!user || (sync.snapshot === null && sync.status === 'loading')),
    hasLoaded: sync.snapshot !== null,
    identityError,
    loadError: sync.status === 'error' ? sync.error : null,
    connection: connectionStatus(sync),
    lastSyncedAt: sync.lastUpdatedAt,
    actionError,
    busy,
    notices,
    refresh,
    mutate,
    dismissNotice: useCallback((challengeId: string) => setNotices((current) => current.filter((item) => item.challengeId !== challengeId)), []),
    dismissActionError: useCallback(() => setActionError(null), []),
    reportActionError: useCallback((message: string) => setActionError(message), []),
  };
}
