import type { ChallengeResolution, ChallengeResult } from './api';
import { describeChallengeError, type ChallengeErrorInfo } from './errors';

export interface ChallengeResultSnapshot { results: ChallengeResult[]; resolution: ChallengeResolution; }
export interface ResultPollState {
  status: 'loading' | 'ready' | 'error';
  /** Last successful response; kept through failures so the UI never blanks. */
  snapshot: ChallengeResultSnapshot | null;
  error: ChallengeErrorInfo | null;
  consecutiveFailures: number;
  lastUpdatedAt: number | null;
}

export const INITIAL_RESULT_POLL_STATE: ResultPollState = { status: 'loading', snapshot: null, error: null, consecutiveFailures: 0, lastUpdatedAt: null };

export const isFinalResolution = (snapshot: ChallengeResultSnapshot | null): boolean => snapshot?.resolution.status === 'resolved' || snapshot?.resolution.status === 'cancelled';

export function resultPollSucceeded(state: ResultPollState, snapshot: ChallengeResultSnapshot, now: number): ResultPollState {
  // A final server resolution never regresses to pending because of a stale or out-of-order response.
  const next = isFinalResolution(state.snapshot) && !isFinalResolution(snapshot) ? state.snapshot : snapshot;
  return { status: 'ready', snapshot: next, error: null, consecutiveFailures: 0, lastUpdatedAt: now };
}

export function resultPollFailed(state: ResultPollState, error: unknown): ResultPollState {
  return { ...state, status: 'error', error: describeChallengeError(error, 'Could not load the challenge result.'), consecutiveFailures: state.consecutiveFailures + 1 };
}

/** Drives GET /challenges/:id/results without overlapping requests; stops scheduled polls once final. */
export class ChallengeResultPoller {
  private state: ResultPollState = INITIAL_RESULT_POLL_STATE;
  private inFlight: Promise<void> | null = null;
  private stopped = false;

  constructor(
    private readonly fetchSnapshot: () => Promise<ChallengeResultSnapshot>,
    private readonly onState: (state: ResultPollState) => void,
    private readonly now: () => number = Date.now,
  ) {}

  get current(): ResultPollState { return this.state; }

  /** Scheduled poll: a no-op once the server has resolved or cancelled the challenge. */
  tick(): Promise<void> {
    return isFinalResolution(this.state.snapshot) ? Promise.resolve() : this.poll();
  }

  /** Manual retry; joins an in-flight request instead of issuing a duplicate. */
  poll(): Promise<void> {
    if (this.stopped) return Promise.resolve();
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.fetchSnapshot()
      .then((snapshot) => { if (!this.stopped) this.update(resultPollSucceeded(this.state, snapshot, this.now())); })
      .catch((error: unknown) => { if (!this.stopped) this.update(resultPollFailed(this.state, error)); })
      .finally(() => { this.inFlight = null; });
    return this.inFlight;
  }

  stop(): void { this.stopped = true; }

  private update(state: ResultPollState): void {
    this.state = state;
    this.onState(state);
  }
}
