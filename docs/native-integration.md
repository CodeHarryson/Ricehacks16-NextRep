# Native integration decision — 2026-09-11

Selected candidate: **react-native-mediapipe 0.6.0**, MIT, by Charles Parker.
Installed and now connected through `usePoseDetection` in
`src/features/tracking/nativePoseAdapter.tsx`. The detector runs in
`RunningMode.LIVE_STREAM` on the native VisionCamera frame processor; frames never
cross into JavaScript as raw images.

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
  MediaPipeTasksVision **0.10.12** and depends on VisionCamera. Its published
  Android Gradle file pins tasks-vision **0.10.2** and camera-core **1.3.3**.
  NextRep patches Android to **0.10.14**, the nearest inspected release whose
  `NormalizedLandmark` API exposes MediaPipe's optional visibility and presence
  values. The original 0.10.2 API exposes only x/y/z; adding calls to those absent
  methods caused `:react-native-mediapipe:compileDebugKotlin` to fail in EAS build
  `5f04878c-c5b0-48e2-9e7b-02ffe5f5dc9b`. GitHub main instead uses tasks-vision
  0.10.26. The 0.10.14 override and bridge conversion live in
  `patches/react-native-mediapipe+0.6.0.patch` and are reapplied after installs.
  Gradle resolves CameraX transitives; inspect dependency resolution and test on a
  phone before asserting binary compatibility or Android 16 KB page support.
- Upstream's README lists iOS 12 / Android minimum 24, but this app's framework
  minimum is **iOS 15.1 / Android API 24**. Use the higher framework requirement.

## Current adapter and model

1. `assets/pose_landmarker_lite.task` is the official Lite float16 model, version 1,
   SHA-256 `59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a`,
   downloaded from [Google's model URL](https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task).
   `plugins/withPoseLandmarkerModel.js` copies it into Android `assets` and iOS
   Copy Bundle Resources. Confirm the model's current redistribution terms before
   shipping; the npm adapter is MIT and MediaPipe source is Apache-2.0.
2. `usePoseDetection(callbacks, RunningMode.LIVE_STREAM, 'pose_landmarker_lite.task', options)`
   is the exact installed 0.6.0 API. Options are one pose, CPU delegate, 0.5
   detector/presence/tracking minimums, `fpsMode: 15`, `mirrorMode: 'no-mirror'`,
   and forced portrait output/camera orientation. The package hook releases the
   detector handle on unmount. Camera lifecycle, front/back selection, permission,
   and app-active state remain in `CameraPreview`.
3. The package callback does not expose one consistent capture timestamp in its TS
   contract (iOS and Android native implementations differ), so the adapter uses
   monotonic `performance.now()` at result arrival and rejects non-increasing
   callbacks. This is an explicit session clock, not capture time; a future native
   patch should forward monotonic capture timestamps on both platforms.
4. Normalize upright, unmirrored image coordinates and corresponding dimensions
   into PoseFrame. Account for front camera mirroring and preview crop separately.
   Preserve optional visibility/presence only when supplied. Do not fabricate a
   whole-pose confidence from landmarks. Empty/multiple/occluded poses and camera
   failures produce neutral TrackingUpdate guidance, never automatic ratings.
5. Release the detector and invalidate any active attempt on navigation,
   backgrounding, tracking loss and camera switches. Then connect the pure engine.

The workout camera is inside a rounded container that clips its contents. Vision
Camera defaults to Android `SurfaceView`, which does not support clipping, masks,
transparency, or rotation. NextRep selects
`androidPreviewViewType="texture-view"` for this composed preview and marks the
camera ready only after `onPreviewStarted`. Pose inference still consumes native
RGB frames and is unaffected by the preview rendering mode.

## Algorithm reference and licensing

[LearnOpenCV's squat trainer](https://github.com/spmallick/learnopencv/tree/master/AI-Fitness-Trainer-Using-MediaPipe-Analyzing-Squats)
is a Python/Streamlit algorithm reference, not a React Native module. The inspected
exercise listing has no license file; the root GitHub contents listing also had
no file matching `license`, and `/master/LICENSE` returned 404. Applicable reuse
terms remain unresolved. **No LearnOpenCV source, thresholds, videos or assets
were copied.** Obtain applicable permission/license before copying any source;
implement the gameplay state machine independently in TypeScript.

## Stage 4 native build readiness

The evaluated Expo configuration includes foreground camera and location usage
text on iOS, `CAMERA`, `ACCESS_FINE_LOCATION`, and `ACCESS_COARSE_LOCATION` on
Android, and explicitly blocks audio recording. The Expo Location plugin now
sets both iOS Always permission strings, iOS background location, Android
background location, and the Android location foreground service to `false`.
This is necessary because the plugin otherwise generates Always usage strings
from defaults even when the app only uses foreground location. Generated
Info.plist now contains only `NSLocationWhenInUseUsageDescription`; generated
Android configuration contains no background-location or location-service
request. The MapLibre config plugin, development client, VisionCamera permission
plugin, Expo Location plugin, and pose-model config plugin are all part of the
generated native projects. `newArchEnabled=false` remains aligned with the
MediaPipe adapter compatibility decision above.

Development runtime configuration is environment-only: iOS Simulator uses
`EXPO_PUBLIC_SIMULATOR_API_URL`, Android Emulator prefers
`EXPO_PUBLIC_ANDROID_EMULATOR_API_URL`, physical devices use
`EXPO_PUBLIC_API_URL`, and release profiles require a non-placeholder HTTPS
`EXPO_PUBLIC_PRODUCTION_API_URL`. MapTiler key and style URL also come only from
`EXPO_PUBLIC_*` values. Missing or invalid development values appear in an
on-screen startup warning and the development-only diagnostics panel.

The panel reports API URL/device mode/health, MapTiler status, camera and location
permission state, location services, challenge/result sync times, active challenge,
and demo user. It renders only when `__DEV__` is true. Nunito is loaded as
Metro-packaged assets through Expo Font; an error or three-second timeout
permanently selects the system-font fallback for that session. PNG art uses static
React Native `require` calls with 1x/2x/3x files.

Configuration and bundle checks do not prove native compilation or device
behavior. The authoritative pending matrix is
[device-validation.md](device-validation.md).

On 2026-09-12, the regenerated pods and an Xcode 26.3 Debug build succeeded for
an iPhone 17 / iOS 26.5 Simulator. The installed client launched, rendered the
MapTiler style through native MapLibre, reached the local API, showed the expected
permission diagnostics, and survived the simulator recovery cases recorded in
the matrix. This removes the prior Xcode 26.6/fmt blocker for the documented 26.3
toolchain; it does not validate signing, physical cameras, MediaPipe landmarks,
Android compilation, or either physical platform.
