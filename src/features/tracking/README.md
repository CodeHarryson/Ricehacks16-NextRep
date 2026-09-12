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
capture timestamp. The workout screen converts analyzer attempt times to Unix
milliseconds (`monotonicToUnixMilliseconds`) before checking them against the
session deadline, as the `AttemptResult` contract requires.

`onTracking` reports initializing, tracking, lost, and error separately from
`onFrame`. Invalid or empty results never become squat attempts. The workout screen
passes valid `PoseFrame`s to one `SquatAnalyzer`; its exact-once attempt events drive
the live count. The adapter supplies no synthetic results.

The only required camera permission is iOS `NSCameraUsageDescription`. Build with
`npx expo prebuild --no-install`, then `npm run ios` on a signed physical
development client.

The camera must report its device and `contain` resize mode to the MediaPipe hook and
request VisionCamera's `rgb` pixel format, matching the installed package's camera
wrapper.

Physical camera buffers commonly retain a landscape sensor size even while the
detector outputs upright portrait landmarks. The adapter uses
`ViewCoordinator.getFrameDims(...)` from each result callback for the corresponding
upright image dimensions and does not force the sensor orientation to portrait.
This keeps normalized landmarks and the pixel geometry used for thigh inclination
in the same coordinate system.

The installed live-stream bridge may still return landmark coordinates in the
sensor's landscape orientation. Before emitting a `PoseFrame`, the adapter evaluates
the four quarter-turns and selects the upright squat orientation in which the
shoulder midpoint is above the ankle midpoint and the shoulder-to-ankle body axis is
most vertical. This affects only orientation; it does not alter confidence or infer
new landmarks.

During setup, NextRep compares detector-supplied visibility for the left and right
shoulder, hip, knee, and ankle. It selects the usable side with the higher total and
holds that anatomical side for the analyzer session. Until one side is usable, the
screen stays neutral and asks the user to step back. Analyzer rejection reasons are
translated into neutral framing/reacquisition guidance; they never become red reps.
The workout preview uses `contain` so the complete portrait analysis image remains
visible. Its overlay maps the same upright coordinates onto shoulder, hip, knee, and
ankle dots and connections; green dots identify the side selected for analysis.
The installed bridge's front-camera landmark coordinates already align with the
mirrored VisionCamera preview after upright normalization, so the overlay does not
apply a second horizontal flip.

## Face start gate

Before squat setup, the workout uses the Pose Landmarker nose, eye, and ear points
to check that a face is visible, centered, and large enough for eight consecutive
frames. A face oval and those five points are the only overlay shown. After the gate
succeeds, the overlay is removed and the normal full-body side selection and standing
calibration begin. When ankles are off-screen during this close-face step, upright
orientation uses the visible eye/ear line and nose position.

This is a local start gesture, not facial recognition or identity tracking. It does
not create a face embedding, identify a person, or prevent another person from
entering the frame after activation.

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

Real iPhones, model inference quality, camera orientation/mirroring,
inference rate, lighting/framing/body-proportion variation, and five-rep accuracy
remain untested in this environment. Native compilation is currently blocked by
the local Xcode 26.6 React Native fmt error.
