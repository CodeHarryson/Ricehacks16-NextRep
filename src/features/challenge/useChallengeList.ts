import { useCallback, useEffect, useRef, useState } from 'react';
import { CHALLENGE_POLL_INTERVAL_MS } from '../../config/workout';
import { loadDemoUser, type DemoUser } from '../location/identity';
import { listChallenges, type Challenge } from './api';
import { detectEndedChallenges, mergeNotices, type EndedChallengeNotice } from './challengeState';
import { describeChallengeError, type ChallengeErrorInfo } from './errors';

export interface ChallengeListState {
  user: DemoUser | null;
  challenges: Challenge[];
  /** True until the identity and the first list request have settled. */
  loading: boolean;
  identityError: string | null;
  /** Polling failure; the last known challenges stay visible. */
  loadError: ChallengeErrorInfo | null;
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
  const [loading, setLoading] = useState(true);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<ChallengeErrorInfo | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notices, setNotices] = useState<EndedChallengeNotice[]>([]);
  const latest = useRef<Challenge[]>([]);
  // A ref, not state: two taps in the same render must not both send a request.
  const mutationInFlight = useRef(false);
  const setChallenges = useCallback((next: Challenge[]) => { latest.current = next; setChallengesState(next); }, []);

  const load = useCallback(async (demoUser: DemoUser) => {
    try {
      const next = await listChallenges(demoUser.userId);
      const ended = detectEndedChallenges(latest.current, next, demoUser.userId);
      if (ended.length > 0) setNotices((current) => mergeNotices(current, ended));
      setChallenges(next);
      setLoadError(null);
    } catch (caught) {
      setLoadError(describeChallengeError(caught, 'Could not load challenges.'));
    } finally {
      setLoading(false);
    }
  }, [setChallenges]);

  useEffect(() => {
    let mounted = true;
    void loadDemoUser().then((demoUser) => { if (!mounted) return; setUser(demoUser); void load(demoUser); })
      .catch(() => { if (mounted) { setIdentityError('Could not load the demo identity.'); setLoading(false); } });
    return () => { mounted = false; };
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => { void load(user); }, CHALLENGE_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load, user]);

  const refresh = useCallback(() => { if (user) void load(user); }, [load, user]);

  const mutate = useCallback((operation: (demoUser: DemoUser) => Promise<Challenge>) => {
    if (!user || mutationInFlight.current) return;
    mutationInFlight.current = true; setBusy(true); setActionError(null);
    void operation(user)
      .then((updated) => {
        const current = latest.current;
        setChallenges(current.some((item) => item.challengeId === updated.challengeId) ? current.map((item) => item.challengeId === updated.challengeId ? updated : item) : [updated, ...current]);
      })
      .catch((caught: unknown) => setActionError(describeChallengeError(caught, 'Challenge request failed.').message))
      .finally(() => { mutationInFlight.current = false; setBusy(false); });
  }, [setChallenges, user]);

  return {
    user, challenges, loading, identityError, loadError, actionError, busy, notices, refresh, mutate,
    dismissNotice: useCallback((challengeId: string) => setNotices((current) => current.filter((item) => item.challengeId !== challengeId)), []),
    dismissActionError: useCallback(() => setActionError(null), []),
    reportActionError: useCallback((message: string) => setActionError(message), []),
  };
}
