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

const SIDE_LANDMARKS = {
  left: [11, 23, 25, 27],
  right: [12, 24, 26, 28],
} as const;

/** Select the side whose required shoulder/hip/knee/ankle landmarks are most visible. */
export function selectVisibleSide(
  frame: PoseFrame,
  minimumVisibility = 0.65,
): 'left' | 'right' | null {
  const evaluate = (side: keyof typeof SIDE_LANDMARKS) => {
    const values = SIDE_LANDMARKS[side].map((index) => {
      const landmark = frame.landmarks.find((candidate) => candidate.index === index);
      return landmark?.visibility ?? landmark?.presence;
    });
    if (values.some((value) => value === undefined || value < minimumVisibility)) return null;
    return values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  };
  const left = evaluate('left');
  const right = evaluate('right');
  if (left === null && right === null) return null;
  return (right ?? -1) > (left ?? -1) ? 'right' : 'left';
}

/** Convert the package's normalized, upright result into the app contract. */
export function normalizePoseResult(
  bundle: NativePoseResultBundle,
  view: 'left' | 'right' | 'unknown',
  timestamp: number,
  orientedImage = { width: bundle.inputImageWidth, height: bundle.inputImageHeight },
): PoseFrame | null {
  const landmarks = bundle.results[0]?.landmarks[0];
  if (!landmarks?.length || orientedImage.width <= 0 || orientedImage.height <= 0) return null;
  return {
    timestamp,
    timestampUnit: 'milliseconds',
    clock: 'monotonic-session',
    image: orientedImage,
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
