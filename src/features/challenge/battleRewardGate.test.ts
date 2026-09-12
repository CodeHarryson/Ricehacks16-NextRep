import assert from 'node:assert/strict';
import test from 'node:test';
import { BattleRewardGate, type BattleRewardStatus } from './battleRewardGate';
import { BATTLE_REWARD_POLICY_VERSION, BATTLE_REWARDS } from './rewards';
import { grantBattleReward, loadPlayer, setPlayerStorageForTesting, type BattleReward } from '../progression/storage';

const resolvedWin = { status: 'resolved' as const, winnerId: 'me', winningScore: 330 };

test('repeated polls and concurrent requests grant a resolved reward exactly once', async () => {
  const grants: BattleReward[] = [];
  const statuses: BattleRewardStatus[] = [];
  const gate = new BattleRewardGate(async (reward) => { grants.push(reward); }, (status) => statuses.push(status));
  await Promise.all([gate.request('c1', 'me', resolvedWin), gate.request('c1', 'me', resolvedWin)]);
  await gate.request('c1', 'me', resolvedWin);
  await gate.request('c1', 'me', resolvedWin, { manual: true });
  assert.equal(grants.length, 1);
  assert.deepEqual(grants[0], { challengeId: 'c1', participantId: 'me', outcome: 'winner', ...BATTLE_REWARDS.winner, rewardPolicyVersion: BATTLE_REWARD_POLICY_VERSION });
  assert.deepEqual(statuses, ['saving', 'saved']);
});

test('pending and cancelled challenges never grant rewards; draws use the draw reward', async () => {
  const grants: BattleReward[] = [];
  const gate = new BattleRewardGate(async (reward) => { grants.push(reward); });
  await gate.request('c1', 'me', { status: 'pending' });
  await gate.request('c1', 'me', { status: 'cancelled' });
  assert.equal(grants.length, 0);
  assert.equal(gate.current, 'not_applicable');
  await gate.request('c1', 'me', { status: 'resolved', winnerId: null, winningScore: 220 });
  assert.equal(grants[0]?.outcome, 'draw');
  assert.equal(grants[0]?.coins, BATTLE_REWARDS.draw.coins);
});

test('a failed save waits for a manual retry instead of retrying on every poll', async () => {
  let attempts = 0;
  const gate = new BattleRewardGate(async () => { attempts += 1; if (attempts === 1) throw new Error('disk full'); });
  assert.equal(await gate.request('c1', 'me', { status: 'resolved', winnerId: 'them', winningScore: 330 }), 'failed');
  assert.equal(await gate.request('c1', 'me', { status: 'resolved', winnerId: 'them', winningScore: 330 }), 'failed');
  assert.equal(attempts, 1);
  assert.equal(await gate.request('c1', 'me', { status: 'resolved', winnerId: 'them', winningScore: 330 }, { manual: true }), 'saved');
  assert.equal(attempts, 2);
});

test('re-entering a resolved challenge creates a new gate but storage still grants the reward once', async () => {
  const memory = new Map<string, string>();
  setPlayerStorageForTesting({ getItem: async (key) => memory.get(key) ?? null, setItem: async (key, value) => { memory.set(key, value); } });
  const before = await loadPlayer();
  const firstVisit = new BattleRewardGate(grantBattleReward);
  assert.equal(await firstVisit.request('c-reentry', 'me', resolvedWin), 'saved');
  const secondVisit = new BattleRewardGate(grantBattleReward);
  assert.equal(await secondVisit.request('c-reentry', 'me', resolvedWin), 'saved');
  const after = await loadPlayer();
  assert.equal(after.coins - before.coins, BATTLE_REWARDS.winner.coins);
  assert.equal(after.xp - before.xp, BATTLE_REWARDS.winner.xp);
});
