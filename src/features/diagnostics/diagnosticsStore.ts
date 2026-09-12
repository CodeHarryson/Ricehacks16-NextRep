/** Development-build diagnostics shared by the map, challenge, and workout screens. Pure pub/sub store. */
export interface DiagnosticsSnapshot {
  apiHealth: 'unknown' | 'reachable' | 'unreachable';
  lastApiError: string | null;
  lastChallengeSyncAt: number | null;
  lastResultSyncAt: number | null;
  challengeId: string | null;
  userId: string | null;
  locationMode: string;
}

export const INITIAL_DIAGNOSTICS: DiagnosticsSnapshot = { apiHealth: 'unknown', lastApiError: null, lastChallengeSyncAt: null, lastResultSyncAt: null, challengeId: null, userId: null, locationMode: 'not started' };

export function createDiagnosticsStore(initial: DiagnosticsSnapshot = INITIAL_DIAGNOSTICS) {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  return {
    get: (): DiagnosticsSnapshot => snapshot,
    update(partial: Partial<DiagnosticsSnapshot>): void {
      const changed = (Object.keys(partial) as (keyof DiagnosticsSnapshot)[]).some((key) => partial[key] !== snapshot[key]);
      if (!changed) return;
      snapshot = { ...snapshot, ...partial };
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

export const diagnosticsStore = createDiagnosticsStore();

/** Diagnostics exist only in development builds (__DEV__); release builds never render them. */
export const diagnosticsEnabled = (devFlag: unknown): boolean => devFlag === true;
