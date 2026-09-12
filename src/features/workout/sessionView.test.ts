import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SOLO_SESSION, isValidWorkoutSession, type WorkoutSessionConfig } from './session';
import { formatDuration, workoutSessionView } from './sessionView';

const challengeSession: WorkoutSessionConfig = { mode: 'challenge', exercise: 'bodyweight_squat', setCount: 2, targetReps: 8, restSeconds: 45, matchTimeLimitSeconds: 330, challengeId: 'challenge-123', configVersion: 3, startedAt: '2026-09-12T12:00:00.000Z', opponentName: 'Riley' };

test('solo sessions render no opponent, lock, or challenge ID UI', () => {
  const view = workoutSessionView(DEFAULT_SOLO_SESSION);
  assert.equal(view.isChallenge, false);
  assert.equal(view.showOpponentStatus, false);
  assert.equal(view.lockedNotice, null);
  assert.equal(view.opponentName, null);
  assert.equal(view.challengeId, null);
  assert.deepEqual(view.configRows.map((row) => row.key), ['exercise', 'sets', 'targetReps', 'rest', 'matchDuration']);
  // Stray challenge fields on a solo session still never reach the UI.
  assert.equal(workoutSessionView({ ...DEFAULT_SOLO_SESSION, opponentName: 'Riley', challengeId: 'x' }).opponentName, null);
});

test('challenge sessions show the full locked shared configuration', () => {
  const view = workoutSessionView(challengeSession);
  assert.equal(view.isChallenge, true);
  assert.equal(view.showOpponentStatus, true);
  assert.match(view.lockedNotice ?? '', /locked/i);
  assert.equal(view.challengeId, 'challenge-123');
  assert.deepEqual(view.configRows.map((row) => [row.label, row.value]), [
    ['Exercise', 'Bodyweight squat'], ['Sets', '2'], ['Target reps', '8 per set'], ['Rest', '45s'], ['Match duration', '5:30'], ['Opponent', 'Riley'],
  ]);
  assert.equal(workoutSessionView({ ...challengeSession, opponentName: undefined }).configRows.some((row) => row.key === 'opponent'), false);
});

test('durations format for rest and match rows', () => {
  assert.equal(formatDuration(0), '0s');
  assert.equal(formatDuration(59), '59s');
  assert.equal(formatDuration(300), '5 min');
  assert.equal(formatDuration(90), '1:30');
});

test('challenge sessions require the shared server start time', () => {
  assert.equal(isValidWorkoutSession(challengeSession), true);
  assert.equal(isValidWorkoutSession({ ...challengeSession, startedAt: undefined }), false);
  assert.equal(isValidWorkoutSession({ ...challengeSession, startedAt: 'not a date' }), false);
  assert.equal(isValidWorkoutSession({ ...challengeSession, opponentName: 42 }), false);
  assert.equal(isValidWorkoutSession(DEFAULT_SOLO_SESSION), true);
});
