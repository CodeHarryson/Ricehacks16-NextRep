/** Adapter normalizes coordinates to the upright, unmirrored input image. */
export interface PoseFrame {
  timestamp: number;
  timestampUnit: 'milliseconds';
  clock: 'monotonic-session';
  image: { width: number; height: number };
  coordinateSpace: 'normalized-image';
  /** x/y: top-left origin, right/down positive, divided by width/height.
   * z: MediaPipe relative depth, hip midpoint origin, smaller is nearer,
   * approximately the same scale as x. Not meters. Values may leave [0,1]. */
  landmarks: readonly PoseLandmark[];
  /** Only pass through a score actually supplied by the native detector. */
  confidence?: number;
}

export interface PoseLandmark {
  /** MediaPipe Pose Landmarker index (0–32). */
  index: number;
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
  confidence?: number;
}

/** Continuous health; never awards reps or XP. */
export interface TrackingUpdate {
  status: 'not-connected' | 'initializing' | 'tracking' | 'lost' | 'error';
  observedAt: number;
  timestampUnit: 'milliseconds';
  clock: 'unix';
  guidance: string;
}
