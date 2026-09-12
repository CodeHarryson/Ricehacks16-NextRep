# Native tracking adapter

The adapter uses `react-native-mediapipe@0.6.0`'s `usePoseDetection` live-stream
API with `react-native-vision-camera@4.7.3` and Worklets Core. The official Pose
Landmarker Lite float16 v1 asset is bundled by the Expo config plugin. Expo Go is
unsupported; use an Expo development build with camera permission.

MediaPipe runs on native VisionCamera frames. The JavaScript callback receives only
landmarks and image dimensions. `mirrorMode: no-mirror` plus forced portrait output
means `x` increases rightward and `y` downward in an upright image, origin top-left.
The front-camera preview may be mirrored for the person while analysis coordinates
remain unmirrored. Callback arrival uses monotonic `performance.now()` milliseconds;
this is a session clock because the installed package does not expose a consistent
cross-platform capture timestamp.

`onTracking` reports initializing, tracking, lost, and error separately from
`onFrame`. Invalid or empty results never become squat attempts. The workout screen
passes valid `PoseFrame`s to one `SquatAnalyzer`; its exact-once attempt events drive
the live count. The adapter supplies no synthetic results.

Required native permissions are camera only: iOS `NSCameraUsageDescription` and
Android `android.permission.CAMERA`. Build with `npx expo prebuild --no-install`,
then `npm run ios` or `npm run android` on a signed physical development client.

The camera must report its device and `cover` resize mode to the MediaPipe hook and
request VisionCamera's `rgb` pixel format, matching the installed package's camera
wrapper. The Android 0.6.0 bridge omits MediaPipe visibility and presence values by
default; `patches/react-native-mediapipe+0.6.0.patch` preserves those detector values
without inventing replacements. `patch-package` reapplies this after installation.

During setup, NextRep compares detector-supplied visibility for the left and right
shoulder, hip, knee, and ankle. It selects the usable side with the higher total and
holds that anatomical side for the analyzer session. Until one side is usable, the
screen stays neutral and asks the user to step back. Analyzer rejection reasons are
translated into neutral framing/reacquisition guidance; they never become red reps.

## Comparison reference

The Android comparison app at
<https://github.com/Deiahri/HackRiceAndroidCVApp> was inspected at commit
`b0fd4010f1f31ac453bad3429b9b41d1344c743f` (2026-09-12). Its checked-in mobile
and native-module license files contain the MIT license with Expo's template
copyright notice. No source was copied. We independently adopted the general
integration patterns of explicit frame format, newest-frame processing, visible-side
selection, and visible placement status.

That app drives squat counting with the internal hip-knee-ankle angle. NextRep keeps
its documented thigh inclination relative to image vertical, standing calibration,
time-based persistence, interruption handling, and attempt results. Therefore none
of the comparison app's angle thresholds, form scores, or medical-sounding cues were
transferred.

## Future MediaPipe/native interface

The adapter must continue to emit normalized upright `PoseFrame` values with image
dimensions, selected side metadata, monotonic millisecond timestamps, and only
detector-supplied visibility/presence. It must keep raw frames native, bound work to
the newest available frame, release detector resources on unmount, and report
health independently of completed `AttemptResult` events.

## Not yet validated

Real iOS/Android devices, model inference quality, camera orientation/mirroring,
inference rate, lighting/framing/body-proportion variation, and five-rep accuracy
remain untested in this environment. Native compilation is currently blocked by
the local Xcode 26.6 React Native fmt error and Android has no JDK installed.
