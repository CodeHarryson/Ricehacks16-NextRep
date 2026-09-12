import assert from 'node:assert/strict';
import test from 'node:test';
import { grantCompletedWorkout, loadPlayer, setPlayerStorageForTesting } from './storage';

class MemoryStorage {
  readonly values = new Map<string, string>();
  failWrites = false;

  async getItem(key: string): Promise<string | null> { return this.values.get(key) ?? null; }
  async setItem(key: string, value: string): Promise<void> {
    if (this.failWrites) throw new Error('disk full');
    this.values.set(key, value);
  }
}

const key = '@nextrep/player/v1';

test('creates schema v2 player and migrates valid v1 data', async () => {
  const fresh = new MemoryStorage();
  setPlayerStorageForTesting(fresh);
  assert.deepEqual(await loadPlayer(), {
    schemaVersion: 2, xp: 0, overallRating: 60, coins: 0,
    processedAttemptKeys: [], processedRewardIds: [], completedWorkoutIds: [],
  });

  const legacy = new MemoryStorage();
  legacy.values.set(key, JSON.stringify({ schemaVersion: 1, xp: 40, characterLevel: 2, processedAttemptKeys: ['attempt'] }));
  setPlayerStorageForTesting(legacy);
  const migrated = await loadPlayer();
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.xp, 40);
  assert.deepEqual(migrated.processedAttemptKeys, ['attempt']);
  assert.equal(migrated.overallRating, 60);
});

test('grants a completed workout exactly once, persists IDs, and caps OVR', async () => {
  const memory = new MemoryStorage();
  setPlayerStorageForTesting(memory);
  const reward = { workoutId: 'completion:s', rewardId: 'reward:completion:s', attemptKeys: ['a', 'b'], xp: 25, coins: 0, overallRatingDelta: 50 };
  const first = await grantCompletedWorkout(reward);
  const repeated = await grantCompletedWorkout(reward);
  assert.equal(first.granted, true);
  assert.equal(first.player.xp, 25);
  assert.equal(first.player.overallRating, 99);
  assert.equal(repeated.granted, false);
  assert.equal(repeated.player.xp, 25);
  assert.deepEqual(repeated.player.processedRewardIds, [reward.rewardId]);
});

test('failed persistence does not commit a reward and the same ID retries safely', async () => {
  const memory = new MemoryStorage();
  setPlayerStorageForTesting(memory);
  await loadPlayer();
  memory.failWrites = true;
  const reward = { workoutId: 'completion:retry', rewardId: 'reward:completion:retry', attemptKeys: [], xp: 25, coins: 0, overallRatingDelta: 1 };
  await assert.rejects(grantCompletedWorkout(reward), /disk full/);
  memory.failWrites = false;
  const retried = await grantCompletedWorkout(reward);
  assert.equal(retried.granted, true);
  assert.equal(retried.player.xp, 25);
});

test('concurrent reward requests serialize and keep each reward idempotent', async () => {
  const memory = new MemoryStorage();
  setPlayerStorageForTesting(memory);
  const reward = { workoutId: 'completion:concurrent', rewardId: 'reward:completion:concurrent', attemptKeys: ['a'], xp: 25, coins: 0, overallRatingDelta: 1 };
  const results = await Promise.all([grantCompletedWorkout(reward), grantCompletedWorkout(reward)]);
  assert.deepEqual(results.map((result) => result.granted).sort(), [false, true]);
  assert.equal((await loadPlayer()).xp, 25);
});

test('invalid saved data is not overwritten', async () => {
  const memory = new MemoryStorage();
  memory.values.set(key, '{invalid');
  setPlayerStorageForTesting(memory);
  await assert.rejects(loadPlayer(), /invalid/);
  assert.equal(memory.values.get(key), '{invalid');
});
