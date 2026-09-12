import type { PoseFrame, TrackingUpdate } from '../../contracts/pose';

export interface PoseAdapter {
  readonly implementation: 'missing' | 'native-mediapipe';
  /** Return cleanup; the native implementation must release detector resources. */
  start(listeners: {
    onFrame: (frame: PoseFrame) => void;
    onTracking: (update: TrackingUpdate) => void;
  }): () => void;
}

/** Deliberately emits no frames, scores, or attempt results. */
export const poseAdapter: PoseAdapter = {
  implementation: 'missing',
  start({ onTracking }) {
    onTracking({
      status: 'not-connected', observedAt: Date.now(),
      timestampUnit: 'milliseconds', clock: 'unix',
      guidance: 'Pose tracking not connected',
    });
    return () => {};
  },
};
