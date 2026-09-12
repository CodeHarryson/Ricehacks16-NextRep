import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlayerState {
  schemaVersion: 1;
  xp: number;
  characterLevel: number;
  processedAttemptKeys: string[];
}

export const initialPlayer = (): PlayerState => ({
  schemaVersion: 1, xp: 0, characterLevel: 1, processedAttemptKeys: [],
});
const KEY = '@nextrep/player/v1';

export async function loadPlayer(): Promise<PlayerState> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw === null) {
    const player = initialPlayer();
    await savePlayer(player);
    return player;
  }
  const p: unknown = JSON.parse(raw);
  if (!p || typeof p !== 'object' || !('schemaVersion' in p) || p.schemaVersion !== 1 ||
      !('xp' in p) || !Number.isSafeInteger(p.xp) || (p.xp as number) < 0 ||
      !('characterLevel' in p) || !Number.isSafeInteger(p.characterLevel) || (p.characterLevel as number) < 1 ||
      !('processedAttemptKeys' in p) || !Array.isArray(p.processedAttemptKeys) ||
      !p.processedAttemptKeys.every((key: unknown) => typeof key === 'string')) {
    throw new Error('Saved player data is unsupported. It has not been overwritten.');
  }
  return p as PlayerState;
}

/** Future controller must serialize writes and save XP + dedup keys together. */
export const savePlayer = (player: PlayerState): Promise<void> =>
  AsyncStorage.setItem(KEY, JSON.stringify(player));
