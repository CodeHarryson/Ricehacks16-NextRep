import type { Challenge } from './api';

/**
 * In-memory last known challenge list, shared across ChallengeScreen mounts. Re-entering the screen shows
 * the last known state immediately and lets the first poll detect challenges that expired while away.
 * Not persisted: an app restart starts empty.
 */
interface CacheEntry { userId: string; challenges: Challenge[]; syncedAt: number; }
let entry: CacheEntry | null = null;

export function readChallengeCache(userId: string): { snapshot: Challenge[]; syncedAt: number } | null {
  return entry && entry.userId === userId ? { snapshot: entry.challenges, syncedAt: entry.syncedAt } : null;
}

export function writeChallengeCache(userId: string, challenges: Challenge[], syncedAt: number): void {
  entry = { userId, challenges, syncedAt };
}

/** Tests only. */
export function clearChallengeCacheForTesting(): void { entry = null; }
