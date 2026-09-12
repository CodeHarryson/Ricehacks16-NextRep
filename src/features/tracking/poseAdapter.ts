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

type QuarterTurn = 0 | 90 | -90 | 180;

function rotateLandmark(landmark: NativeLandmark, turn: QuarterTurn): NativeLandmark {
  if (turn === 90) return { ...landmark, x: landmark.y, y: 1 - landmark.x };
  if (turn === -90) return { ...landmark, x: 1 - landmark.y, y: landmark.x };
  if (turn === 180) return { ...landmark, x: 1 - landmark.x, y: 1 - landmark.y };
  return landmark;
}

/**
 * MediaPipe 0.6.0 can return live-stream landmarks in sensor orientation even
 * when portrait output was requested. Choose the quarter-turn that makes the
 * supported standing body axis run from shoulders above to ankles below.
 */
export function orientLandmarksUpright(landmarks: readonly NativeLandmark[]): NativeLandmark[] {
  const turns: readonly QuarterTurn[] = [0, 90, -90, 180];
  const suppliedConfidence = (point: NativeLandmark | undefined) => point?.visibility ?? point?.presence ?? 0;
  const bodyIndices = [11, 12, 27, 28] as const;
  const bodyUsable = bodyIndices.every((index) => suppliedConfidence(landmarks[index]) >= 0.5);
  let bestTurn: QuarterTurn = 0;
  let bestScore = -Infinity;
  for (const turn of turns) {
    const rotated = landmarks.map((landmark) => rotateLandmark(landmark, turn));
    let score = -Infinity;
    if (bodyUsable) {
      const leftShoulder = rotated[11]!; const rightShoulder = rotated[12]!;
      const leftAnkle = rotated[27]!; const rightAnkle = rotated[28]!;
      const shoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
      const ankle = { x: (leftAnkle.x + rightAnkle.x) / 2, y: (leftAnkle.y + rightAnkle.y) / 2 };
      score = (ankle.y - shoulder.y) - Math.abs(ankle.x - shoulder.x);
    } else {
      const nose = rotated[0]; const leftEye = rotated[2]; const rightEye = rotated[5];
      const leftEar = rotated[7]; const rightEar = rotated[8];
      if (nose && leftEye && rightEye && leftEar && rightEar) {
        const eyeY = (leftEye.y + rightEye.y) / 2;
        score = Math.abs(rightEar.x - leftEar.x) - Math.abs(rightEar.y - leftEar.y) + (nose.y - eyeY);
      }
    }
    if (score > bestScore) { bestScore = score; bestTurn = turn; }
  }
  return landmarks.map((landmark) => rotateLandmark(landmark, bestTurn));
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
  const nativeLandmarks = bundle.results[0]?.landmarks[0];
  if (!nativeLandmarks?.length || orientedImage.width <= 0 || orientedImage.height <= 0) return null;
  const landmarks = orientLandmarksUpright(nativeLandmarks);
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
