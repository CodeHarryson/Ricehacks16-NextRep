import type { AttemptResult } from '../../contracts/attempt';
import type { PoseFrame, PoseLandmark } from '../../contracts/pose';

export type SquatPhase = 'CALIBRATING' | 'READY' | 'DESCENDING' | 'MINIMUM_RANGE_REACHED' | 'ASCENDING';
export type TrackingState = 'tracking' | 'lost' | 'reacquiring' | 'unsupported';
export interface TrackingStatus {
  state: TrackingState;
  /** Null means the detector supplied no whole-pose confidence. */
  confidence: number | null;
  reason: string | null;
}

export interface SquatRubric {
  rubricVersion: string;
  calibrationFrames: number;
  minLandmarkVisibility: number;
  /** If a native whole-pose confidence exists, it must meet this value. */
  minTrackingConfidence: number;
  /** Inclination change from standing, in degrees. */
  movementStartRangeDeg: number;
  minimumRangeDeg: number;
  preferredRangeDeg: number;
  standingToleranceDeg: number;
  descentPersistenceMs: number;
  minimumPersistenceMs: number;
  standingPersistenceMs: number;
  smoothingTimeConstantMs: number;
  maxFeatureJumpDeg: number;
  maxFrameGapMs: number;
  attemptTimeoutMs: number;
  reacquisitionStandingFrames: number;
}

export const DEFAULT_RUBRIC: SquatRubric = {
  rubricVersion: 'squat-thigh-inclination-v1', calibrationFrames: 12,
  minLandmarkVisibility: 0.65, minTrackingConfidence: 0.5, movementStartRangeDeg: 8, minimumRangeDeg: 32,
  preferredRangeDeg: 48, standingToleranceDeg: 7, descentPersistenceMs: 120,
  minimumPersistenceMs: 100, standingPersistenceMs: 140,
  smoothingTimeConstantMs: 120, maxFeatureJumpDeg: 45, maxFrameGapMs: 650,
  attemptTimeoutMs: 6000, reacquisitionStandingFrames: 3,
};

export interface AnalyzerOutput {
  phase: SquatPhase;
  tracking: TrackingState;
  timestamp: number | null;
  frameTimestamp: number | null;
  feature: { thighInclinationDeg: number; rangeFromStandingDeg: number } | null;
  peakRange: number;
  attempts: readonly AttemptResult[];
  rejectedReason: string | null;
  trackingInterrupted: boolean;
}

export interface SquatAnalyzerOptions {
  sessionId: string;
  setId: string;
  selectedSide: 'left' | 'right';
  rubric?: Partial<SquatRubric>;
}

export interface SquatEngine {
  observe(frame: PoseFrame): readonly AttemptResult[];
  updateTracking(frame: PoseFrame | null): readonly AttemptResult[];
  reset(): void;
}

const SIDES = {
  left: { hip: 23, knee: 25, ankle: 27, shoulder: 11 },
  right: { hip: 24, knee: 26, ankle: 28, shoulder: 12 },
} as const;
const rubricWith = (partial?: Partial<SquatRubric>): SquatRubric => ({ ...DEFAULT_RUBRIC, ...partial });
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Independent analysis using thigh inclination relative to image vertical.
 * Convert the selected hip and knee to pixels, then calculate
 * `atan2(abs(kneeX - hipX), abs(kneeY - hipY))` in degrees. 0° is vertical;
 * increasing values are a more horizontal thigh. This is not the internal
 * hip-knee-ankle angle and is not a medical posture measure.
 */
export class SquatAnalyzer implements SquatEngine {
  readonly rubric: SquatRubric;
  readonly selectedSide: 'left' | 'right';
  private readonly sessionId: string;
  private readonly setId: string;
  private phase: SquatPhase = 'CALIBRATING';
  private tracking: TrackingState = 'tracking';
  private calibration: number[] = [];
  private baseline: number | null = null;
  private smoothed: number | null = null;
  private previousRaw: number | null = null;
  private previousTimestamp: number | null = null;
  private transitionSince: number | null = null;
  private active: { id: string; startedAt: number; peakRange: number } | null = null;
  private attemptNumber = 0;
  private reacquisitionFrames = 0;
  private seenTimestamps = new Set<number>();
  private lastOutput: AnalyzerOutput = {
    phase: 'CALIBRATING', tracking: 'tracking', timestamp: null, frameTimestamp: null,
    feature: null, peakRange: 0, attempts: [], rejectedReason: null, trackingInterrupted: false,
  };

  constructor(options: SquatAnalyzerOptions) {
    this.sessionId = options.sessionId; this.setId = options.setId;
    this.selectedSide = options.selectedSide; this.rubric = rubricWith(options.rubric);
    if (this.rubric.minimumRangeDeg <= this.rubric.movementStartRangeDeg || this.rubric.preferredRangeDeg < this.rubric.minimumRangeDeg) {
      throw new Error('Rubric ranges must increase: movement start < minimum <= preferred');
    }
  }

  get snapshot(): AnalyzerOutput { return this.lastOutput; }
  observe(frame: PoseFrame): readonly AttemptResult[] { return this.process(frame).attempts; }

  process(frame: PoseFrame): AnalyzerOutput {
    const empty = (reason: string | null, interrupted = false, feature: AnalyzerOutput['feature'] = null): AnalyzerOutput => {
      this.lastOutput = { phase: this.phase, tracking: this.tracking, timestamp: frame.timestamp,
        frameTimestamp: frame.timestamp, feature, attempts: [], peakRange: this.active?.peakRange ?? 0,
        rejectedReason: reason, trackingInterrupted: interrupted };
      return this.lastOutput;
    };
    if (this.seenTimestamps.has(frame.timestamp) || (this.previousTimestamp !== null && frame.timestamp < this.previousTimestamp)) {
      return empty('Duplicate or out-of-order frame ignored');
    }
    this.seenTimestamps.add(frame.timestamp); this.previousTimestamp = frame.timestamp;
    if (this.lastOutput.timestamp !== null && frame.timestamp - this.lastOutput.timestamp > this.rubric.maxFrameGapMs) {
      return this.interrupt(frame.timestamp, 'Frame gap exceeded tracking limit');
    }
    const validation = this.readFeature(frame);
    if (!validation.ok) return this.interrupt(frame.timestamp, validation.reason);
    const raw = validation.value;
    if (this.tracking !== 'reacquiring' && this.previousRaw !== null && Math.abs(raw - this.previousRaw) > this.rubric.maxFeatureJumpDeg) return this.interrupt(frame.timestamp, 'Abrupt landmark jump rejected');
    this.previousRaw = raw;
    if (this.tracking === 'reacquiring') {
      const range = this.baseline === null ? 0 : Math.max(0, raw - this.baseline);
      this.reacquisitionFrames = range <= this.rubric.standingToleranceDeg ? this.reacquisitionFrames + 1 : 0;
      if (this.reacquisitionFrames < this.rubric.reacquisitionStandingFrames) return empty('Tracking reacquiring; hold a stable standing position', false, { thighInclinationDeg: raw, rangeFromStandingDeg: range });
      this.tracking = 'tracking'; this.phase = this.baseline === null ? 'CALIBRATING' : 'READY'; this.transitionSince = null;
    }
    const dt = this.lastOutput.timestamp === null ? 0 : Math.max(0, frame.timestamp - this.lastOutput.timestamp);
    const alpha = this.smoothed === null || dt <= 0 ? 1 : 1 - Math.exp(-dt / this.rubric.smoothingTimeConstantMs);
    this.smoothed = this.smoothed === null ? raw : this.smoothed + alpha * (raw - this.smoothed);
    if (this.baseline === null) {
      this.calibration.push(this.smoothed);
      if (this.calibration.length >= this.rubric.calibrationFrames) {
        this.baseline = this.calibration.reduce((sum, n) => sum + n, 0) / this.calibration.length; this.phase = 'READY';
      }
      return empty('Calibrating standing baseline', false, { thighInclinationDeg: this.smoothed, rangeFromStandingDeg: 0 });
    }
    const range = Math.max(0, this.smoothed - this.baseline);
    const attempts = this.advance(frame.timestamp, range);
    this.lastOutput = { phase: this.phase, tracking: this.tracking, timestamp: frame.timestamp, frameTimestamp: frame.timestamp,
      feature: { thighInclinationDeg: this.smoothed, rangeFromStandingDeg: range }, attempts,
      peakRange: this.active?.peakRange ?? (attempts[0]?.peakRange ?? 0), rejectedReason: null, trackingInterrupted: false };
    return this.lastOutput;
  }

  updateTracking(frame: PoseFrame | null): readonly AttemptResult[] {
    if (frame === null) return this.interrupt(Date.now(), 'Tracking interrupted').attempts;
    return this.process(frame).attempts;
  }

  reset(): void {
    this.phase = 'CALIBRATING'; this.tracking = 'tracking'; this.calibration = []; this.baseline = null;
    this.smoothed = null; this.previousRaw = null; this.previousTimestamp = null; this.transitionSince = null;
    this.active = null; this.attemptNumber = 0; this.reacquisitionFrames = 0; this.seenTimestamps.clear();
  }

  private readFeature(frame: PoseFrame): { ok: true; value: number } | { ok: false; reason: string } {
    if (frame.coordinateSpace !== 'normalized-image' || frame.image.width <= 0 || frame.image.height <= 0) return { ok: false, reason: 'Unsupported coordinate space or image dimensions' };
    if (frame.confidence !== undefined && frame.confidence < this.rubric.minTrackingConfidence) return { ok: false, reason: 'Tracking confidence is below rubric minimum' };
    if (frame.view !== undefined && frame.view !== this.selectedSide) return { ok: false, reason: 'Unsupported or unlocked side view' };
    const side = SIDES[this.selectedSide];
    const points = [side.shoulder, side.hip, side.knee, side.ankle].map((index) => frame.landmarks.find((landmark) => landmark.index === index));
    if (points.some((point): point is undefined => point === undefined)) return { ok: false, reason: 'Required side landmarks are missing' };
    const landmarks = points as PoseLandmark[];
    if (landmarks.some((point) => (point.visibility ?? point.presence ?? 0) < this.rubric.minLandmarkVisibility)) return { ok: false, reason: 'Required landmark visibility is below rubric minimum' };
    if (landmarks.some((point) => point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1)) return { ok: false, reason: 'Full-body framing is outside the image bounds' };
    const [shoulder, hip, knee, ankle] = landmarks;
    if (shoulder === undefined || hip === undefined || knee === undefined || ankle === undefined) return { ok: false, reason: 'Required side landmarks are missing' };
    const hipPx = { x: hip.x * frame.image.width, y: hip.y * frame.image.height };
    const kneePx = { x: knee.x * frame.image.width, y: knee.y * frame.image.height };
    const shoulderPx = { x: shoulder.x * frame.image.width, y: shoulder.y * frame.image.height };
    const anklePx = { x: ankle.x * frame.image.width, y: ankle.y * frame.image.height };
    if (distance(hipPx, kneePx) < 8 || distance(kneePx, anklePx) < 8 || distance(shoulderPx, hipPx) < 8) return { ok: false, reason: 'Supported side view not established' };
    return { ok: true, value: Math.atan2(Math.abs(kneePx.x - hipPx.x), Math.max(Math.abs(kneePx.y - hipPx.y), Number.EPSILON)) * 180 / Math.PI };
  }

  private advance(timestamp: number, range: number): readonly AttemptResult[] {
    const out: AttemptResult[] = [];
    if (this.active !== null && timestamp - this.active.startedAt > this.rubric.attemptTimeoutMs) {
      out.push(this.finish(timestamp, false, 'Attempt timed out before stable return to standing', 'red')); return out;
    }
    const standing = range <= this.rubric.standingToleranceDeg;
    const start = range >= this.rubric.movementStartRangeDeg;
    const minimum = range >= this.rubric.minimumRangeDeg;
    if (this.phase === 'READY' && start) {
      if (this.transitionSince === null) this.transitionSince = timestamp;
      if (timestamp - this.transitionSince >= this.rubric.descentPersistenceMs) {
        this.phase = 'DESCENDING'; this.active = { id: `${this.sessionId}:${this.setId}:attempt-${++this.attemptNumber}`, startedAt: this.transitionSince, peakRange: range }; this.transitionSince = null;
      }
    } else if (this.phase === 'DESCENDING') {
      if (this.active !== null) this.active.peakRange = Math.max(this.active.peakRange, range);
      if (minimum) {
        if (this.transitionSince === null) this.transitionSince = timestamp;
        if (timestamp - this.transitionSince >= this.rubric.minimumPersistenceMs) { this.phase = 'MINIMUM_RANGE_REACHED'; this.transitionSince = null; }
      } else if (standing) {
        if (this.transitionSince === null) this.transitionSince = timestamp;
        if (timestamp - this.transitionSince >= this.rubric.standingPersistenceMs) out.push(this.finish(timestamp, false, 'Partial attempt did not reach the minimum range', 'red'));
      } else this.transitionSince = null;
    } else if (this.phase === 'MINIMUM_RANGE_REACHED') {
      if (this.active !== null) this.active.peakRange = Math.max(this.active.peakRange, range);
      if (range < (this.active?.peakRange ?? range) - this.rubric.movementStartRangeDeg) this.phase = 'ASCENDING';
    } else if (this.phase === 'ASCENDING') {
      if (this.active !== null) this.active.peakRange = Math.max(this.active.peakRange, range);
      if (standing) {
        if (this.transitionSince === null) this.transitionSince = timestamp;
        if (timestamp - this.transitionSince >= this.rubric.standingPersistenceMs) {
          const preferred = (this.active?.peakRange ?? 0) >= this.rubric.preferredRangeDeg;
          out.push(this.finish(timestamp, true, preferred ? 'Preferred target range reached' : 'Minimum target range reached', preferred ? 'green' : 'yellow'));
        }
      } else this.transitionSince = null;
    }
    return out;
  }

  private finish(timestamp: number, completed: boolean, reason: string, rating: 'green' | 'yellow' | 'red'): AttemptResult {
    const active = this.active; if (active === null) throw new Error('Cannot finish without an active attempt');
    const peakRange = active.peakRange; this.active = null; this.phase = 'READY'; this.transitionSince = null;
    if (completed) {
      return { sessionId: this.sessionId, setId: this.setId, attemptId: active.id, startedAt: active.startedAt, endedAt: timestamp,
        assessable: true, completed: true, countDelta: 1, rating: rating === 'green' ? 'green' : 'yellow', reason, peakRange, rubricVersion: this.rubric.rubricVersion };
    }
    return { sessionId: this.sessionId, setId: this.setId, attemptId: active.id, startedAt: active.startedAt, endedAt: timestamp,
      assessable: true, completed: false, countDelta: 0, rating: 'red', reason, peakRange, rubricVersion: this.rubric.rubricVersion };
  }

  private interrupt(timestamp: number, reason: string): AnalyzerOutput {
    const attempt = this.active === null ? [] : [this.invalidateActive(timestamp, reason)];
    this.tracking = 'reacquiring'; this.phase = this.baseline === null ? 'CALIBRATING' : 'READY';
    this.reacquisitionFrames = 0; this.transitionSince = null;
    this.lastOutput = { phase: this.phase, tracking: this.tracking, timestamp, frameTimestamp: timestamp, feature: null,
      attempts: attempt, peakRange: attempt[0]?.peakRange ?? 0, rejectedReason: reason, trackingInterrupted: true };
    return this.lastOutput;
  }

  private invalidateActive(timestamp: number, reason: string): AttemptResult {
    const active = this.active; if (active === null) throw new Error('Cannot invalidate without an active attempt');
    const peakRange = active.peakRange; this.active = null; this.phase = 'READY'; this.transitionSince = null;
    return { sessionId: this.sessionId, setId: this.setId, attemptId: active.id, startedAt: active.startedAt, endedAt: timestamp,
      assessable: false, completed: false, countDelta: 0, rating: null, reason, peakRange, rubricVersion: this.rubric.rubricVersion };
  }
}

export const createSquatAnalyzer = (options: SquatAnalyzerOptions) => new SquatAnalyzer(options);
