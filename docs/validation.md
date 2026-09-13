# Validation — 2026-09-11

## Stage 4 readiness update — 2026-09-12

A newly regenerated iOS Debug client was compiled with Xcode 26.3, installed on
an iPhone 17 / iOS 26.5 Simulator, and exercised interactively. It launched from
Metro, rendered the configured MapTiler style through native MapLibre, reached
the simulator API at `127.0.0.1:3000`, displayed correct camera/location denial
guidance, recovered after programmatic permission restoration, and retained the
tested map/countdown/camera-workout states across background/foreground. Exact
scope and caveats are in [device-validation.md](device-validation.md).

No physical device or Android runtime was available. Simulator camera switching
reached the expected no-front/no-back-hardware states, but there were no preview
frames or MediaPipe landmarks. Settings-screen toggles, two-device presence and
physical-device networking, result polling, and reward persistence therefore
remain unverified at that target-device level.

A second iOS 26.5 simulator was subsequently added to the run. Player A/B
presence, both native map markers, challenge creation/acceptance, two-party
configuration locking, shared start, and background/foreground recovery during
the active challenge passed. A force-close/re-entry attempt then exposed that the
server retained the 120-second invitation expiry after a five-minute match
started. The start route now extends expiry through the 10-second countdown,
configured match window, and 120-second result grace. Server tests pass, and a
temporary updated server against the configured development database returned an
active 300-second match with a 430-second TTL and kept it in the participant list.
The native re-entry UI was not rerun against that temporary endpoint; it remains
open in the checklist.

The same run found that changing to Player A/B after the map had initialized
updated the location but left the camera at the old GPS viewport because
`defaultSettings` only applies at mount. The simulation selector now calls the
native camera's `flyTo`; a live San Francisco-to-Houston switch passed without a
remount.

- `npm test`: passed, 123/123 tests.
- `npm test --prefix server`: passed, 16/16 tests.
- Root and server `typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- `npm run check:native-config`: passed five native/configuration checks and
  `expo config --type public` evaluation.
- `npx expo install --check`: passed using Expo's local SDK 54 dependency map;
  network lookup was unavailable. This check identified and Stage 4 updated
  `expo-device` from 7.0.3 to the SDK-compatible 8.0.10.
- `npm run check:bundle`: passed for iOS (820 modules) and Android (801 modules).
  The export listed all three Nunito faces and all avatar/navigation/workout PNG
  density variants. This remains JavaScript/asset evidence only.
- `npm run prebuild`: passed without cleaning the generated projects. Generated
  iOS/Android files contain the foreground camera/location entries, microphone
  removal, and pose model. Existing non-blocking warnings remain: no custom app
  icon and `expo-system-ui` is not installed.
- `pod install --project-directory=ios`: passed after prebuild; 96 dependencies
  and 97 pods were installed, including Expo Device/Location/Font, MapLibre,
  VisionCamera, Worklets, and MediaPipe.
- Xcode 26.3 Simulator Debug build: passed and launched on iPhone 17 / iOS 26.5.
- Xcode 26.3 generic iPhoneOS Debug build with code signing disabled: passed.
- Android `:app:assembleDebug`: blocked before Gradle because no Java runtime is
  installed; no Android build pass is claimed.

Because Stage 4 changes permissions, EAS profiles, and the native `expo-device`
dependency, a new development client must be built. The historical compiler/tool
blockers and all physical-device tests below remain open until new evidence
replaces them.

## Environment and repository

Inspected Git status/history, root files and ancestor AGENTS.md locations. The
provided Ruflo instructions apply; no ToolSearch or Ruflo MCP tool was available
in the exposed tool inventory. No [INTELLIGENCE] suggestions were present.
Initial tree: original README plus untracked `.claude-flow/`, preserved.
No generator was run over the repository root. No push, deploy or signing change.

Node 24.18.0, npm 11.16.0, selected Xcode 26.6 (17F113), additional Xcode 26.3
(17C529), and CocoaPods 1.17.0. The successful native builds used a per-command
Xcode 26.3 selection. Java runtime, Android SDK, `adb`, emulator, and AVD were not
available. `xcrun devicectl list devices` found no physical iOS device.

## Two-device presence test

The development map includes local Test Player A/B coordinates so testing does
not depend on the iOS Simulator Features → Location menu. Start the API with
`npm run --prefix server start`, then launch `npx expo start --dev-client --lan --clear`.
Keep `EXPO_PUBLIC_API_URL` set to the Mac LAN address and
`EXPO_PUBLIC_SIMULATOR_API_URL=http://127.0.0.1:3000` in the same ignored `.env`.
The runtime selects the LAN URL on a physical phone and loopback on an iOS
Simulator; no environment change or rebuild is needed. Select Test
Player A on one device and Test Player B on the other, keep both map screens
open, and verify the diagnostics card reports a reachable API and recent
publishes/polls. Presence expires after approximately one minute. Use “Use real
device GPS” to return to normal foreground location behavior.

## Checks

- `npm install`: succeeded with exact direct versions and package-lock.json.
- `npm ci`: succeeded; lockfile resolves without legacy-peer-deps or force.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run check:bundle`: passed for iOS (644 modules) and Android (642 modules),
  producing Hermes bundles in ignored `dist/`. Initial failures exposed three
  missing Worklets Babel dependencies; all are now pinned in devDependencies.
- `npx expo install --check`: online check passed, dependencies up to date.
- `npm run prebuild`: iOS/Android generation passed. Non-blocking notices: no
  custom icon; expo-system-ui not installed (native Android theme preference is
  not set, but the app's own surfaces explicitly use dark colors).
- Camera permission entries verified in generated Info.plist and Android manifest;
  microphone permission is excluded.
- `pod install --project-directory=ios`: passed after allowing network/cache
  access; 94 pods installed. Native autolinking found MediaPipe, VisionCamera and
  Worklets Core with frame processors enabled.
- `git diff --check`: passed.

## Native compilation blockers

**iOS:** selected Xcode 26.6 still fails in RN's bundled fmt 11.0.2
(`ios/Pods/fmt/include/fmt/format-inl.h`) with `call to consteval function ... is
not a constant expression`. Xcode 26.3 is installed and is the validated local
workaround: after regenerating and installing 97 pods, its iPhone 17 / iOS 26.5
Simulator Debug build completed, installed, and launched. Its unsigned generic
iPhoneOS Debug build also completed with `** BUILD SUCCEEDED **`. The local build
logs/derived data used `/tmp/nextrep-stage4-simulator` and
`/tmp/nextrep-stage4-device-build.log` / `/tmp/nextrep-stage4-device`.

The observed failure matches the upstream
[fmt report for Apple clang 21](https://github.com/fmtlib/fmt/issues/4740) and
[React Native report](https://github.com/facebook/react-native/issues/55601).
No speculative patch was applied to generated Pods. Use the validated older
toolchain with a per-command selection (which does not change global settings):

```sh
DEVELOPER_DIR=/Applications/Xcode_26.3.app/Contents/Developer \
  xcodebuild -workspace ios/NextRep.xcworkspace -scheme NextRep \
  -configuration Debug -sdk iphoneos -destination 'generic/platform=iOS' \
  -derivedDataPath /tmp/nextrep-derived-26-3 CODE_SIGNING_ALLOWED=NO
```

The same toolchain also built the Simulator target successfully. Generic-device
compilation does not install, sign, or validate a phone. If a target phone
requires newer Xcode, integrate and validate the upstream fmt fix through a
repeatable Expo config plugin/maintained patch. Preserve C++20 for RN/Worklets;
do not globally downgrade C++ or claim that compiler flags alone fix fmt. A
signed `npm run ios` run with a team and connected phone is still required.

**Android:** `cd android && ./gradlew :app:assembleDebug` was attempted again and
exited before Gradle with `Unable to locate a Java Runtime`. This host also has no
Android SDK directory, `adb`, emulator, or AVD. Install JDK 17 plus the Android
prerequisites in README, set `JAVA_HOME`/`ANDROID_HOME`, then rerun that command,
`npm run android:emulator`, and `npm run android`. CameraX/MediaPipe resolution and
Android native compilation remain unverified.

Neither successful pod resolution nor JavaScript bundling proves native adapter
compatibility. The adapter is now wired with the installed `usePoseDetection`
LIVE_STREAM API, CPU delegate, 15-FPS native throttling, forced portrait/no-mirror
output, and monotonic callback-arrival timestamps. The model is present in both
generated native projects, but there is no live landmark or physical-device
validation to report.

## Integration checks after adapter wiring

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: passed, 12/12 deterministic analyzer tests.
- `npm run replay`: passed; clean five-squat fixture produced 5 reps, 5 unique
  attempt IDs, and READY final phase.
- `npm run check:bundle`: passed; iOS 654 and Android 652 Metro modules.
- `npx expo prebuild --no-install`: passed; model copied to both native projects.

Next physical test: build a signed development client, confirm permission and
preview, verify landmarks reach `SquatAnalyzer`, then compare five squats on one
iPhone and one Android while recording analyzed FPS and interruption behavior.

## Dependency advisories

`npm audit` reports **19 vulnerabilities: 10 moderate, 9 high** in this SDK 54
graph, including Expo CLI/Metro, image-size, postcss, uuid and xcode dependencies.
Several npm proposed fixes move Expo/dev-client to SDK 57 and cannot be applied
blindly to this legacy-native baseline. No `audit fix --force` was run. Review
compatible backports or validate a newer architecture/adapter before distribution.
These are real unresolved dependency advisories; this scaffold is a hackathon
development baseline, not a security-reviewed release.
