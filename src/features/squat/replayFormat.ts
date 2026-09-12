import type { PoseFrame } from '../../contracts/pose';

/** JSON-safe replay envelope for landmarks only; raw frames/video never belong here. */
export interface ReplayFixture {
  schemaVersion: 1;
  description: string;
  frames: readonly PoseFrame[];
}

export function serializeReplay(frames: readonly PoseFrame[], description = 'landmark replay'): string {
  const fixture: ReplayFixture = { schemaVersion: 1, description, frames };
  return JSON.stringify(fixture, null, 2);
}

export function deserializeReplay(serialized: string): ReplayFixture {
  const parsed: unknown = JSON.parse(serialized);
  if (!parsed || typeof parsed !== 'object' || !('schemaVersion' in parsed) || parsed.schemaVersion !== 1 ||
      !('frames' in parsed) || !Array.isArray(parsed.frames) ||
      !parsed.frames.every((frame): frame is PoseFrame => Boolean(frame) && typeof frame === 'object' &&
        'timestamp' in frame && typeof frame.timestamp === 'number' && 'landmarks' in frame && Array.isArray(frame.landmarks))) {
    throw new Error('Unsupported replay fixture');
  }
  return parsed as ReplayFixture;
}
