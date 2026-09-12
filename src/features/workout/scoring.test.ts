import assert from 'node:assert/strict';
import test from 'node:test';
import type { AttemptResult } from '../../contracts/attempt';
import { scoreAttempts } from './scoring';
const attempt = (id: string, rating: 'green' | 'yellow' | 'red' | null, countDelta: 0 | 1): AttemptResult => ({ sessionId: 's', setId: 'set', attemptId: id, startedAt: 1, endedAt: 2, peakRange: 40, reason: 'test', rubricVersion: 'v1', assessable: rating !== null, completed: rating === 'green' || rating === 'yellow', countDelta, rating } as AttemptResult);
test('scores deduplicated completed green/yellow reps and caps the target', () => {
  const attempts = [attempt('g', 'green', 1), attempt('y', 'yellow', 1), attempt('dup', 'green', 1), attempt('dup', 'green', 1), attempt('r', 'red', 0), attempt('n', null, 0)];
  const score = scoreAttempts(attempts, 2);
  assert.deepEqual(score, { countedReps: 2, greenReps: 2, yellowReps: 0, redAttempts: 1, neutralAttempts: 1, cappedTargetReps: 2, totalScore: 220, scorePolicyVersion: 'score-v1' });
});
test('yellow and green points are weighted separately without affecting OVR', () => {
  const score = scoreAttempts([attempt('y', 'yellow', 1), attempt('g', 'green', 1)], 5);
  assert.equal(score.totalScore, 210); assert.equal(score.scorePolicyVersion, 'score-v1');
});
