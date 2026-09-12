import assert from 'node:assert/strict';
import test from 'node:test';
import { BATTLE_REWARDS } from './rewards';
import { battleOutcomeFor, buildChallengeResultView } from './resultView';
import { resultFixture } from './testFixtures';
import type { WorkoutScore } from '../workout/scoring';

const localScore: WorkoutScore = { countedReps: 4, greenReps: 4, yellowReps: 0, redAttempts: 0, neutralAttempts: 0, cappedTargetReps: 5, totalScore: 440, scorePolicyVersion: 'score-v1' };
const both = [resultFixture('me', { totalScore: 430, countedReps: 4, greenReps: 3, yellowReps: 1, redAttempts: 2 }), resultFixture('them', { totalScore: 320 })];

test('win, loss, and draw come only from the server resolution and carry their rewards', () => {
  const win = buildChallengeResultView({ userId: 'me', results: both, resolution: { status: 'resolved', winnerId: 'me', winningScore: 430 }, localScore, opponentName: 'Riley' });
  assert.equal(win.outcome, 'win'); assert.equal(win.headline, 'Victory'); assert.deepEqual(win.reward, BATTLE_REWARDS.winner);
  const loss = buildChallengeResultView({ userId: 'them', results: both, resolution: { status: 'resolved', winnerId: 'me', winningScore: 430 }, localScore: null, opponentName: 'Me' });
  assert.equal(loss.outcome, 'loss'); assert.equal(loss.headline, 'Defeat'); assert.deepEqual(loss.reward, BATTLE_REWARDS.loser);
  const draw = buildChallengeResultView({ userId: 'me', results: both, resolution: { status: 'resolved', winnerId: null, winningScore: 430 }, localScore, opponentName: 'Riley' });
  assert.equal(draw.outcome, 'draw'); assert.deepEqual(draw.reward, BATTLE_REWARDS.draw);
});

test('server scores replace the local estimate and include the colour totals', () => {
  const view = buildChallengeResultView({ userId: 'me', results: both, resolution: { status: 'pending' }, localScore, opponentName: 'Riley' });
  assert.deepEqual(view.local, { totalScore: 430, countedReps: 4, greenReps: 3, yellowReps: 1, redAttempts: 2, source: 'server' });
  assert.equal(view.opponent?.totalScore, 320);
  assert.equal(view.outcome, 'pending'); assert.equal(view.reward, null); assert.equal(view.headline, 'Resolving result…');
  const waiting = buildChallengeResultView({ userId: 'me', results: [], resolution: { status: 'pending' }, localScore, opponentName: 'Riley' });
  assert.equal(waiting.local?.source, 'local'); assert.equal(waiting.local?.totalScore, 440); assert.equal(waiting.opponent, null);
  assert.equal(waiting.headline, 'Waiting for opponent result');
});

test('no-show cancellation has no winner and no reward, with copy for who missed the deadline', () => {
  const opponentNoShow = buildChallengeResultView({ userId: 'me', results: [resultFixture('me')], resolution: { status: 'cancelled' }, localScore, opponentName: 'Riley' });
  assert.equal(opponentNoShow.outcome, 'cancelled'); assert.equal(opponentNoShow.reward, null); assert.match(opponentNoShow.detail, /Riley did not submit/);
  const selfNoShow = buildChallengeResultView({ userId: 'me', results: [resultFixture('them')], resolution: { status: 'cancelled' }, localScore: null });
  assert.match(selfNoShow.detail, /Your result was not submitted/);
});

test('ambiguous or unresolved data never maps to a battle outcome', () => {
  assert.equal(battleOutcomeFor({ status: 'pending' }, 'me'), null);
  assert.equal(battleOutcomeFor({ status: 'cancelled' }, 'me'), null);
  assert.equal(battleOutcomeFor({ status: 'resolved' }, 'me'), null);
  assert.equal(buildChallengeResultView({ userId: null, results: both, resolution: { status: 'resolved', winnerId: 'me' }, localScore }).outcome, 'pending');
});
