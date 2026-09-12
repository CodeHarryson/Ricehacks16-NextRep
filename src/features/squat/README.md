# Squat analysis core

This directory contains a pure TypeScript analyzer. It accepts normalized,
timestamped pose landmarks and emits completed `AttemptResult` events. It imports
only the shared pose/attempt contracts; it has no React Native, camera, storage,
audio, UI, network, or raw-frame dependency.

## Reference and attribution

The primary algorithm reference is LearnOpenCV’s [AI Fitness Trainer Using MediaPipe:
Squats Analysis](https://github.com/spmallick/learnopencv/tree/master/AI-Fitness-Trainer-Using-MediaPipe-Analyzing-Squats).
The `master` branch directory and linked files were inspected on September 12,
2026. The repository’s exercise directory did not expose a license file, and the
applicable reuse terms were not verified; no source, thresholds, media, or assets
were copied. Obtain permission/license and add attribution if any upstream source
is later reused. The exact commit was not available from the inspected page, so the
reference is recorded as `master` at that inspection date rather than inventing a
commit hash.

LearnOpenCV’s useful concepts are the thigh-inclination feature, standing versus
descending/ascending movement phases, a minimum range before counting, a counter
that advances after returning upright, and feedback tied to the movement. Its
Python/Streamlit program is not executable inside React Native.

### Meaningful deviations

This implementation deliberately does not copy the upstream counter or numeric
thresholds. It adds a standing calibration baseline, selected-side locking,
explicit landmark visibility/framing and optional whole-pose-confidence gates,
time-based exponential smoothing, transition persistence, timestamp ordering,
frame-gap and abrupt-jump rejection, attempt timeouts, stable reacquisition, and
exactly-once attempt IDs. Upstream feedback is coupled to its posture flags and
counter; here movement rating is emitted only after a complete observed attempt,
while tracking health remains a separate neutral status. Upstream’s inactivity
reset behavior is not used: interruptions invalidate only the active attempt and
preserve completed totals. Numeric values below are new gameplay defaults and are
not claims about medical correctness.

## Feature and coordinates

`SquatAnalyzer` uses the selected side’s hip (MediaPipe 23/24) and knee (25/26).
It converts normalized image coordinates (`x` right, `y` down, origin top-left) to
pixels using the frame width/height, then calculates:

```text
thighInclination = atan2(abs(kneePixel.x - hipPixel.x),
                         abs(kneePixel.y - hipPixel.y)) × 180 / π
rangeFromStanding = max(0, thighInclination - calibratedStandingInclination)
```

Zero degrees means the thigh points vertically; larger degrees mean it is more
horizontal. This is thigh inclination relative to image vertical, not the internal
hip-knee-ankle angle. The ankle and shoulder are required for framing/side-view
checks, but they are not folded into the movement feature. The feature is angular
degrees, not a distance, percent, or clinical score.

The future native adapter must provide upright, unmirrored `normalized-image`
landmarks, image dimensions, monotonic session timestamps in milliseconds, selected
side metadata when available, and only detector-supplied visibility/presence values.
It should preserve timestamp order, expose detector/tracking health separately, and
never upload raw frames to this module. The adapter must also document how it maps
MediaPipe callback timestamps to the analyzer clock.

## State machine

The analyzer calibrates a standing baseline from valid frames, then follows:

`READY → DESCENDING → MINIMUM_RANGE_REACHED → ASCENDING → READY`

Movement-start and minimum thresholds require time persistence. A stable return to
the calibrated standing tolerance completes an attempt. Peak range is retained over
the whole attempt, so a bottom hold or bounce remains one attempt. A small standing
movement never starts one. A meaningful return below minimum emits an assessable red
partial result. Timeout emits an assessable red incomplete result.

Visibility, full-image framing, selected-side view, limb geometry, timestamp gaps,
and abrupt feature jumps are checked before analysis. Tracking interruption or
invalid framing emits one neutral/null attempt when an attempt is active, preserves
completed attempts, and requires stable standing reacquisition before a new attempt.
Callbacks with duplicate timestamps or older timestamps are ignored. No attempt is
emitted from an isolated frame.

## Rubric

- Green: preferred range reached, complete, `countDelta: 1`.
- Yellow: minimum range reached but preferred range missed, complete,
  `countDelta: 1`.
- Red: meaningful attempt did not complete the minimum range, incomplete,
  `countDelta: 0`.
- Neutral: invalid tracking/interruption/unsupported view/insufficient visibility,
  `rating: null`, `assessable: false`, `countDelta: 0`.

Colors are gameplay feedback, not medical form assessment. Knee collapse,
spinal-alignment, injury prevention, and automatic exercise recognition are outside
this module.

## Tunable assumptions

`DEFAULT_RUBRIC` is a gameplay starting point, not medically correct thresholds:

| Threshold | Default | Meaning |
| --- | ---: | --- |
| Calibration | 12 frames | Valid standing samples for the baseline |
| Visibility | 0.65 | Minimum supplied landmark visibility/presence |
| Whole-pose confidence | 0.5 | Minimum only when the native adapter supplies a whole-pose score |
| Movement start | 8° | Range change required before an attempt starts |
| Minimum | 32° | Range required before a rep can complete |
| Preferred | 48° | Range required for green |
| Standing tolerance | 7° | Range considered returned to baseline |
| Persistence | 100–140 ms | Hysteresis-like temporal confirmation |
| Smoothing constant | 120 ms | Time-based exponential smoothing |
| Jump limit | 45° | One-frame feature discontinuity rejected |
| Frame gap | 650 ms | Gap treated as tracking loss |
| Attempt timeout | 6 s | Active attempt abandoned after this duration |

Tune and version these values using independently reviewed participant sequences.
Do not copy LearnOpenCV’s numeric thresholds: its feature and coordinate details
must first be proven equivalent.

## Commands

From the repository root:

```sh
npm test
npm run replay
```

The tests use deterministic synthetic landmarks and are logic validation only; they
do not prove real-world accuracy. `npm run replay` prints phases, frame timestamps,
attempts, ratings, reasons, peak ranges, detected reps, and assumptions for a clean
five-squat synthetic fixture. Future captured landmark JSON can be serialized and
replayed without retaining video; add model/version/device metadata beside frames.

## Not yet validated

- Real MediaPipe landmark quality or model asset behavior.
- Actual iOS behavior and actual Android behavior.
- Real-device inference rate and capture-to-analysis latency.
- Camera mirroring and orientation mapping.
- Different body proportions, lighting, framing, clothing, and occlusion.
- Real-world rep-count accuracy or threshold calibration on participants.
- Agreement between gameplay ratings and independently reviewed movement examples.
