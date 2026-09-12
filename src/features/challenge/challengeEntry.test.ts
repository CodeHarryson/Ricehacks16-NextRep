import assert from 'node:assert/strict';
import test from 'node:test';
import { countdownView } from '../workout/countdown';
import { advanceSessionClock, canAcceptSessionAttempt, createSessionClock } from '../workout/sessionClock';
import { workoutSessionView } from '../workout/sessionView';
import { challengeEntryState } from './challengeEntry';
import { buildChallengeWorkoutSession } from './challengeState';
import { initialSyncState } from './syncPoller';
import { type ChallengeResultSnapshot, INITIAL_RESULT_POLL_STATE, resultPollFailed, resultPollSucceeded } from './resultPolling';
import { challengeFixture, resultFixture } from './testFixtures';

const ready = (snapshot: ChallengeResultSnapshot) => resultPollSucceeded(INITIAL_RESULT_POLL_STATE, snapshot, 1);

test('reopening an active challenge restores the shared configuration and the countdown from the server start', () => {
  const startedAtMs = Date.parse('2026-09-12T12:01:00.000Z');
  const challenge = challengeFixture({ status: 'active', locked: true, startedAt: new Date(startedAtMs).toISOString(), configuration: { exercise: 'bodyweight_squat', setCount: 2, targetReps: 8, restSeconds: 20, matchTimeLimitSeconds: 120, configVersion: 3 } });
  const session = buildChallengeWorkoutSession(challenge, 'me');
  assert.ok(session);
  assert.deepEqual(workoutSessionView(session).configRows.map((row) => row.value).slice(1, 5), ['2', '8 per set', '20s', '2 min']);
  // Re-entered 4 s after start: 6 s of the shared 10 s countdown remain, not a fresh countdown.
  const reopenedAt = startedAtMs + 4_000;
  const clock = createSessionClock(reopenedAt, session.matchTimeLimitSeconds, 10, Date.parse(session.startedAt ?? ''));
  assert.equal(countdownView(clock, reopenedAt, reopenedAt, 10).secondsUntilStart, 6);
  // Re-entered mid-match: tracking resumes immediately against the same deadline.
  const midMatch = startedAtMs + 70_000;
  const late = advanceSessionClock(createSessionClock(midMatch, 120, 10, startedAtMs), midMatch);
  assert.equal(canAcceptSessionAttempt(late, midMatch), true);
  assert.equal(late.remainingSeconds, 60);
  assert.deepEqual(challengeEntryState({ isChallenge: true, userId: 'me', identityError: false, poll: ready({ results: [], resolution: { status: 'pending' } }), localSubmitted: false }), { phase: 'workout', showCamera: true, showResultPanel: false, unverified: false });
});

test('reopening a challenge waits for the server before starting a camera session', () => {
  assert.deepEqual(challengeEntryState({ isChallenge: true, userId: 'me', identityError: false, poll: INITIAL_RESULT_POLL_STATE, localSubmitted: false }), { phase: 'checking', showCamera: false, showResultPanel: false, unverified: false });
  assert.deepEqual(challengeEntryState({ isChallenge: true, userId: null, identityError: false, poll: INITIAL_RESULT_POLL_STATE, localSubmitted: false }).showCamera, false);
});

test('reopening a submitted challenge never starts a new camera session', () => {
  const submitted = challengeEntryState({ isChallenge: true, userId: 'me', identityError: false, poll: ready({ results: [resultFixture('me')], resolution: { status: 'pending' } }), localSubmitted: false });
  assert.deepEqual(submitted, { phase: 'submitted', showCamera: false, showResultPanel: true, unverified: false });
  // Even if a later poll fails, the last known snapshot keeps the camera off.
  const afterFailure = resultPollFailed(ready({ results: [resultFixture('me')], resolution: { status: 'pending' } }), new Error('Network request failed'));
  assert.equal(challengeEntryState({ isChallenge: true, userId: 'me', identityError: false, poll: afterFailure, localSubmitted: false }).showCamera, false);
  // The opponent's result alone does not count as this player's submission.
  assert.equal(challengeEntryState({ isChallenge: true, userId: 'me', identityError: false, poll: ready({ results: [resultFixture('them')], resolution: { status: 'pending' } }), localSubmitted: false }).showCamera, true);
});

test('reopening a resolved or cancelled challenge shows the final result', () => {
  for (const resolution of [{ status: 'resolved' as const, winnerId: 'them', winningScore: 330 }, { status: 'cancelled' as const }]) {
    assert.deepEqual(challengeEntryState({ isChallenge: true, userId: 'me', identityError: false, poll: ready({ results: [resultFixture('them')], resolution }), localSubmitted: false }), { phase: 'final', showCamera: false, showResultPanel: true, unverified: false });
  }
});

test('when status cannot be checked the workout proceeds with a warning; solo sessions are unaffected', () => {
  const failedFirst = resultPollFailed(initialSyncState<ChallengeResultSnapshot>(), new Error('Network request failed'));
  assert.deepEqual(challengeEntryState({ isChallenge: true, userId: 'me', identityError: false, poll: failedFirst, localSubmitted: false }), { phase: 'workout', showCamera: true, showResultPanel: false, unverified: true });
  assert.equal(challengeEntryState({ isChallenge: true, userId: null, identityError: true, poll: INITIAL_RESULT_POLL_STATE, localSubmitted: false }).unverified, true);
  assert.deepEqual(challengeEntryState({ isChallenge: false, userId: null, identityError: false, poll: INITIAL_RESULT_POLL_STATE, localSubmitted: false }), { phase: 'workout', showCamera: true, showResultPanel: false, unverified: false });
});
