import type { ChallengeResolution, ChallengeResult } from './api';
import { initialSyncState, SyncPoller, syncFailed, syncSucceeded, type SyncState } from './syncPoller';

export interface ChallengeResultSnapshot { results: ChallengeResult[]; resolution: ChallengeResolution; }
export type ResultPollState = SyncState<ChallengeResultSnapshot>;

export const INITIAL_RESULT_POLL_STATE: ResultPollState = initialSyncState<ChallengeResultSnapshot>();

export const isFinalResolution = (snapshot: ChallengeResultSnapshot | null): boolean => snapshot?.resolution.status === 'resolved' || snapshot?.resolution.status === 'cancelled';

/** A final server resolution never regresses to pending because of a stale or out-of-order response. */
const keepFinal = (previous: ChallengeResultSnapshot | null, next: ChallengeResultSnapshot): ChallengeResultSnapshot => previous && isFinalResolution(previous) && !isFinalResolution(next) ? previous : next;

export const resultPollSucceeded = (state: ResultPollState, snapshot: ChallengeResultSnapshot, now: number): ResultPollState => syncSucceeded(state, snapshot, now, keepFinal);
export const resultPollFailed = (state: ResultPollState, error: unknown): ResultPollState => syncFailed(state, error, 'Could not load the challenge result.');

/** GET /challenges/:id/results poller; scheduled polls stop once the result is resolved or cancelled. */
export class ChallengeResultPoller extends SyncPoller<ChallengeResultSnapshot> {
  constructor(fetchSnapshot: () => Promise<ChallengeResultSnapshot>, onState: (state: ResultPollState) => void, now: () => number = Date.now) {
    super(fetchSnapshot, onState, { now, merge: keepFinal, isFinal: isFinalResolution, fallbackMessage: 'Could not load the challenge result.' });
  }
}
