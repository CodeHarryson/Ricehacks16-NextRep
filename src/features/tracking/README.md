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
