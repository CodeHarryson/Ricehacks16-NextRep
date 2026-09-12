import type { PoseFrame, TrackingUpdate } from '../../contracts/pose';

export const POSE_MODEL_ASSET = 'pose_landmarker_lite.task';

export interface NativeLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
}

export interface NativePoseResultBundle {
  results: { landmarks: NativeLandmark[][] }[];
  inputImageWidth: number;
  inputImageHeight: number;
}

/** Convert the package's normalized, upright result into the app contract. */
export function normalizePoseResult(
  bundle: NativePoseResultBundle,
  view: 'left' | 'right' | 'unknown',
  timestamp: number,
): PoseFrame | null {
  const landmarks = bundle.results[0]?.landmarks[0];
  if (!landmarks?.length || bundle.inputImageWidth <= 0 || bundle.inputImageHeight <= 0) return null;
  return {
    timestamp,
    timestampUnit: 'milliseconds',
    clock: 'monotonic-session',
    image: { width: bundle.inputImageWidth, height: bundle.inputImageHeight },
    coordinateSpace: 'normalized-image',
    view,
    landmarks: landmarks.map((landmark, index) => ({
      index,
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
      ...(landmark.visibility === undefined ? {} : { visibility: landmark.visibility }),
      ...(landmark.presence === undefined ? {} : { presence: landmark.presence }),
    })),
  };
}

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
