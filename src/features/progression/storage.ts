import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlayerState {
  schemaVersion: 2;
  xp: number;
  overallRating: number;
  coins: number;
  processedAttemptKeys: string[];
  processedRewardIds: string[];
  completedWorkoutIds: string[];
}

export const initialPlayer = (): PlayerState => ({
  schemaVersion: 2,
  xp: 0,
  overallRating: 60,
  coins: 0,
  processedAttemptKeys: [],
  processedRewardIds: [],
  completedWorkoutIds: [],
});
const KEY = '@nextrep/player/v1';

interface StorageDriver {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

let storage: StorageDriver = AsyncStorage;
let writeQueue: Promise<void> = Promise.resolve();

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');
const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

function isPlayerV2(value: unknown): value is PlayerState {
  if (!value || typeof value !== 'object') return false;
  const player = value as Record<string, unknown>;
  const overallRating = player.overallRating;
  return player.schemaVersion === 2 && isNonNegativeInteger(player.xp) &&
    typeof overallRating === 'number' && Number.isSafeInteger(overallRating) && overallRating >= 60 && overallRating <= 99 &&
    isNonNegativeInteger(player.coins) && isStringList(player.processedAttemptKeys) &&
    isStringList(player.processedRewardIds) && isStringList(player.completedWorkoutIds);
}

function isPlayerV1(value: unknown): value is { schemaVersion: 1; xp: number; characterLevel: number; processedAttemptKeys: string[] } {
  if (!value || typeof value !== 'object') return false;
  const player = value as Record<string, unknown>;
  const characterLevel = player.characterLevel;
  return player.schemaVersion === 1 && isNonNegativeInteger(player.xp) &&
    typeof characterLevel === 'number' && Number.isSafeInteger(characterLevel) && characterLevel >= 1 && isStringList(player.processedAttemptKeys);
}

/**
 * Schema v1's level 1 was the baseline player. Preserve each earned legacy
 * level as one OVR above the schema-v2 baseline, capped at the v2 maximum.
 */
function migrateCharacterLevelToOverallRating(characterLevel: number): number {
  return characterLevel >= 40 ? 99 : 59 + characterLevel;
}

async function loadPlayerUnsafe(): Promise<PlayerState> {
  const raw = await storage.getItem(KEY);
  if (raw === null) {
    const player = initialPlayer();
    await storage.setItem(KEY, JSON.stringify(player));
    return player;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Saved player data is invalid. It has not been overwritten.');
  }
  if (isPlayerV2(parsed)) return parsed;
  if (isPlayerV1(parsed)) {
    const migrated: PlayerState = {
      schemaVersion: 2,
      xp: parsed.xp,
      overallRating: migrateCharacterLevelToOverallRating(parsed.characterLevel),
      coins: 0,
      processedAttemptKeys: [...parsed.processedAttemptKeys],
      processedRewardIds: [],
      completedWorkoutIds: [],
    };
    await storage.setItem(KEY, JSON.stringify(migrated));
    return migrated;
  }
  throw new Error('Saved player data is unsupported. It has not been overwritten.');
}

function serialized<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

export const loadPlayer = (): Promise<PlayerState> => serialized(loadPlayerUnsafe);

export const savePlayer = (player: PlayerState): Promise<void> => serialized(async () => {
  if (!isPlayerV2(player)) throw new Error('Refusing to save invalid player data.');
  await storage.setItem(KEY, JSON.stringify(player));
});

export interface CompletedWorkoutReward {
  workoutId: string;
  rewardId: string;
  attemptKeys: readonly string[];
  xp: number;
  coins: number;
  overallRatingDelta: number;
}

export async function grantCompletedWorkout(reward: CompletedWorkoutReward): Promise<{ player: PlayerState; granted: boolean }> {
  if (!reward.workoutId || !reward.rewardId || !isNonNegativeInteger(reward.xp) ||
      !isNonNegativeInteger(reward.coins) || !Number.isSafeInteger(reward.overallRatingDelta) || reward.overallRatingDelta < 0 ||
      !reward.attemptKeys.every((key) => typeof key === 'string')) {
    throw new Error('Completed workout reward is invalid.');
  }
  return serialized(async () => {
    const player = await loadPlayerUnsafe();
    if (player.processedRewardIds.includes(reward.rewardId) || player.completedWorkoutIds.includes(reward.workoutId)) {
      return { player, granted: false };
    }
    const next: PlayerState = {
      ...player,
      xp: Math.min(Number.MAX_SAFE_INTEGER, player.xp + reward.xp),
      coins: Math.min(Number.MAX_SAFE_INTEGER, player.coins + reward.coins),
      overallRating: Math.min(99, player.overallRating + reward.overallRatingDelta),
      processedAttemptKeys: [...new Set([...player.processedAttemptKeys, ...reward.attemptKeys])],
      processedRewardIds: [...player.processedRewardIds, reward.rewardId],
      completedWorkoutIds: [...player.completedWorkoutIds, reward.workoutId],
    };
    await storage.setItem(KEY, JSON.stringify(next));
    return { player: next, granted: true };
  });
}

/** Test-only storage replacement; production always uses AsyncStorage. */
export function setPlayerStorageForTesting(driver: StorageDriver | null): void {
  storage = driver ?? AsyncStorage;
  writeQueue = Promise.resolve();
}
