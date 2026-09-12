import type { PoseFrame, TrackingUpdate } from '../../contracts/pose';
import type { AttemptResult } from '../../contracts/attempt';

/** Pure TypeScript owner implements features, temporal state and rubric here.
 * No React, camera, storage, XP, or medical thresholds belong in this module.
 * A lost/error tracking update invalidates the active attempt; completed
 * totals remain in the workout controller. No engine is implemented yet. */
export interface SquatEngine {
  observe(frame: PoseFrame): readonly AttemptResult[];
  updateTracking(update: TrackingUpdate): readonly AttemptResult[];
  reset(): void;
}
