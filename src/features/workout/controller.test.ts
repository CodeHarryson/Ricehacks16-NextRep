import assert from 'node:assert/strict';
import test from 'node:test';
import type { AttemptResult } from '../../contracts/attempt';
import { acceptAttempt, createWorkoutState, setRewardStatus } from './controller';

function attempt(id: string, countDelta: 0 | 1 = 1, overrides: Partial<AttemptResult> = {}): AttemptResult {
  const base = {
    sessionId: 'session', setId: 'set', attemptId: id, startedAt: 1, endedAt: 2,
    peakRange: 50, reason: 'test', rubricVersion: 'test',
  };
  if (countDelta === 1) return { ...base, assessable: true, completed: true, countDelta, rating: 'green', ...overrides } as AttemptResult;
  return { ...base, assessable: false, completed: false, countDelta, rating: null, ...overrides } as AttemptResult;
}

test('a five-rep set emits one completion and caps the total', () => {
  let state = createWorkoutState('session', 'set', 5);
  const completions = [];
  for (let index = 0; index < 5; index += 1) {
    const accepted = acceptAttempt(state, attempt(`attempt-${index}`));
    state = accepted.state;
    if (accepted.completion) completions.push(accepted.completion);
  }
  assert.equal(state.reps, 5);
  assert.equal(state.status, 'complete');
  assert.equal(completions.length, 1);
  assert.equal(completions[0]?.rewardId, 'reward:completion:session:set');
  assert.equal(acceptAttempt(state, attempt('late')).state, state);
});

test('foreign, duplicate, neutral, red, and malformed count events cannot increase reps', () => {
  let state = createWorkoutState('session', 'set', 5);
  const valid = attempt('one');
  state = acceptAttempt(state, valid).state;
  assert.equal(acceptAttempt(state, valid).state, state);
  assert.equal(acceptAttempt(state, attempt('one', 1, { reason: 'same ID, different payload' })).state, state);
  assert.equal(acceptAttempt(state, attempt('foreign', 1, { sessionId: 'other' })).state, state);
  state = acceptAttempt(state, attempt('neutral', 0)).state;
  state = acceptAttempt(state, attempt('red', 0, { assessable: true, completed: false, rating: 'red' })).state;
  const malformed = { ...attempt('malformed', 0), assessable: true, completed: true, rating: 'green', countDelta: 0 } as unknown as AttemptResult;
  state = acceptAttempt(state, malformed).state;
  assert.equal(state.reps, 1);
  assert.equal(state.lastAttempt?.attemptId, 'malformed');
});

test('tracking interruption preserves prior reps and reward status only changes after completion', () => {
  let state = createWorkoutState('session', 'set', 2);
  state = acceptAttempt(state, attempt('one')).state;
  state = acceptAttempt(state, attempt('interrupted', 0)).state;
  assert.equal(state.reps, 1);
  assert.equal(setRewardStatus(state, 'granted'), state);
  state = acceptAttempt(state, attempt('two')).state;
  assert.equal(setRewardStatus(state, 'granted').rewardStatus, 'granted');
});
