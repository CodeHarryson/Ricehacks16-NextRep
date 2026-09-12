import { describeChallengeError, type ChallengeErrorInfo } from './errors';

export interface SyncState<T> {
  status: 'loading' | 'ready' | 'error';
  /** Last successful response; kept through failures so the UI keeps the last known state. */
  snapshot: T | null;
  error: ChallengeErrorInfo | null;
  consecutiveFailures: number;
  /** Time of the last successful sync (ms since epoch). */
  lastUpdatedAt: number | null;
}

export const initialSyncState = <T>(cached?: { snapshot: T; syncedAt: number } | null): SyncState<T> => cached
  ? { status: 'ready', snapshot: cached.snapshot, error: null, consecutiveFailures: 0, lastUpdatedAt: cached.syncedAt }
  : { status: 'loading', snapshot: null, error: null, consecutiveFailures: 0, lastUpdatedAt: null };

export function syncSucceeded<T>(state: SyncState<T>, snapshot: T, now: number, merge: (previous: T | null, next: T) => T = (_previous, next) => next): SyncState<T> {
  return { status: 'ready', snapshot: merge(state.snapshot, snapshot), error: null, consecutiveFailures: 0, lastUpdatedAt: now };
}

export function syncFailed<T>(state: SyncState<T>, error: unknown, fallbackMessage: string): SyncState<T> {
  return { ...state, status: 'error', error: describeChallengeError(error, fallbackMessage), consecutiveFailures: state.consecutiveFailures + 1 };
}

export interface SyncPollerOptions<T> {
  now?: () => number;
  /** Combine the previous and new snapshots (e.g. never regress a final result). */
  merge?: (previous: T | null, next: T) => T;
  /** When true, scheduled ticks stop; manual polls are still allowed. */
  isFinal?: (snapshot: T | null) => boolean;
  fallbackMessage?: string;
  initial?: SyncState<T>;
}

/**
 * One polling loop for a server resource: never overlaps requests (retries join the in-flight request),
 * keeps the last good snapshot through failures, and ignores responses that land after stop().
 */
export class SyncPoller<T> {
  private state: SyncState<T>;
  private inFlight: Promise<void> | null = null;
  private stopped = false;
  private readonly now: () => number;

  constructor(private readonly fetchSnapshot: () => Promise<T>, private readonly onState: (state: SyncState<T>) => void, private readonly options: SyncPollerOptions<T> = {}) {
    this.state = options.initial ?? initialSyncState<T>();
    this.now = options.now ?? Date.now;
  }

  get current(): SyncState<T> { return this.state; }
  get isFinal(): boolean { return this.options.isFinal?.(this.state.snapshot) ?? false; }
  get isInFlight(): boolean { return this.inFlight !== null; }

  /** Scheduled poll: a no-op once the snapshot is final. */
  tick(): Promise<void> { return this.isFinal ? Promise.resolve() : this.poll(); }

  /** Manual retry or foreground refresh; joins an in-flight request instead of issuing a duplicate. */
  poll(): Promise<void> {
    if (this.stopped) return Promise.resolve();
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.fetchSnapshot()
      .then((snapshot) => { if (!this.stopped) this.update(syncSucceeded(this.state, snapshot, this.now(), this.options.merge)); })
      .catch((error: unknown) => { if (!this.stopped) this.update(syncFailed(this.state, error, this.options.fallbackMessage ?? 'Could not reach the challenge server.')); })
      .finally(() => { this.inFlight = null; });
    return this.inFlight;
  }

  stop(): void { this.stopped = true; }

  private update(state: SyncState<T>): void {
    this.state = state;
    this.onState(state);
  }
}
