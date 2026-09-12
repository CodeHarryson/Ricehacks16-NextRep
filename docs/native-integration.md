# Native integration decision — 2026-09-11

Selected candidate: **react-native-mediapipe 0.6.0**, MIT, by Charles Parker.
Installed for native autolinking but deliberately not imported by the missing
adapter: its JavaScript initializes native event emitters/plugins at import time.
No model or detector is connected yet. This is a candidate baseline, not a verified
cross-platform CV stack.

## Evidence and compatibility

- [Upstream source and license](https://github.com/cdiddy77/react-native-mediapipe)
  include Swift/iOS and Kotlin/Android Pose Landmarker implementations, not Python.
- [Pose example](https://github.com/cdiddy77/react-native-mediapipe/blob/main/examples/posedetection/package.json)
  uses RN 0.74.2, VisionCamera ^4.5.3 and Worklets Core ^1.3.3; its Android
  gradle.properties explicitly sets newArchEnabled=false. Package peers are `*`,
  which is not evidence of universal compatibility. Its bridge uses NativeModules
  and NativeEventEmitter. New architecture support is unverified; the open
  [migration issue](https://github.com/cdiddy77/react-native-mediapipe/issues/154)
  is not a compatibility guarantee either.
- [Expo SDK 54](https://expo.dev/changelog/sdk-54) supports RN 0.81 and legacy
  architecture. [Expo architecture guidance](https://docs.expo.dev/guides/new-architecture/)
  says SDK 55+ cannot disable the new architecture. We intentionally select 54,
  newArchEnabled=false, Hermes, VisionCamera **4.7.3** (same v4 API family), and
  Worklets Core **1.6.2**. This is an informed compatibility hypothesis pending
  native compilation and phones, not the upstream example's exact tested matrix.
- [Development builds](https://docs.expo.dev/develop/development-builds/introduction/)
  allow custom native libraries. No concrete Expo incompatibility warrants bare RN
  here. Expo Go cannot load this stack. The camera config plugin and Babel
  Worklets plugin are configured. Two older proposal Babel plugins are explicitly
  pinned because Worklets Core 1.6.2 requests them by name during bundling.
- Inspect the **installed npm artifact**, not only main: its podspec pins
  MediaPipeTasksVision **0.10.12** and depends on VisionCamera. Its Android Gradle
  pins tasks-vision **0.10.2** and camera-core **1.3.3**. GitHub main instead has
  tasks-vision 0.10.26. Do not silently use main's requirements for npm 0.6.0.
  Gradle resolves CameraX transitives; inspect dependency resolution and test on a
  phone before asserting binary compatibility or Android 16 KB page support.
- Upstream's README lists iOS 12 / Android minimum 24, but this app's framework
  minimum is **iOS 15.1 / Android API 24**. Use the higher framework requirement.

## Adapter work before live landmarks

1. Bundle an official Pose Landmarker `.task` asset; record model version, SHA-256
   and applicable model license. Use [Google's model documentation](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker).
   No model is downloaded or redistributed by this scaffold. Native iOS code uses
   Bundle.main; Android uses assets. A Metro asset reference alone does not put the
   file in those locations. Add a repeatable local Expo config plugin to copy the
   asset to Android app assets and register it in iOS Copy Bundle Resources.
2. Wire usePoseDetection / its frameProcessor to the existing camera, starting with
   one pose and LIVE_STREAM. Forward layout, device and orientation callbacks.
   Add initialization/error/cleanup handling. Prevent overlapping detector work.
3. Correct the timestamp bridge: iOS PdConvertHelpers emits timestampMs (missing
   in upstream TypeScript result types); Android ConvertHelpers does not emit it.
   Forward Android result.timestampMs() in a maintained patch/fork. iOS currently
   supplies Unix time and Android uptime. Normalize to a documented monotonic
   session clock; do not substitute inferenceTime (a duration) or pretend callback
   arrival time is capture time. A native monotonic capture timestamp on both
   platforms is preferred. Preserve ordering and reject stale callbacks.
4. Normalize upright, unmirrored image coordinates and corresponding dimensions
   into PoseFrame. Account for front camera mirroring and preview crop separately.
   Preserve optional visibility/presence only when supplied. Do not fabricate a
   whole-pose confidence from landmarks. Empty/multiple/occluded poses and camera
   failures produce neutral TrackingUpdate guidance, never automatic ratings.
5. Release the detector and invalidate any active attempt on navigation,
   backgrounding, tracking loss and camera switches. Then connect the pure engine.

## Algorithm reference and licensing

[LearnOpenCV's squat trainer](https://github.com/spmallick/learnopencv/tree/master/AI-Fitness-Trainer-Using-MediaPipe-Analyzing-Squats)
is a Python/Streamlit algorithm reference, not a React Native module. The inspected
exercise listing has no license file; the root GitHub contents listing also had
no file matching `license`, and `/master/LICENSE` returned 404. Applicable reuse
terms remain unresolved. **No LearnOpenCV source, thresholds, videos or assets
were copied.** Obtain applicable permission/license before copying any source;
implement the gameplay state machine independently in TypeScript.
