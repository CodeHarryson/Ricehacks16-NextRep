# Validation — 2026-09-11

## Stage 4 readiness update — 2026-09-12

No simulator, emulator, or physical device was launched during Stage 4, so none
of the native runtime behavior below is represented as verified. The pending
matrix and evidence requirements are in
[device-validation.md](device-validation.md).

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
- `npm run check:bundle`: passed for iOS (810 modules) and Android (818 modules).
  The export listed all three Nunito faces and all avatar/navigation/workout PNG
  density variants. This remains JavaScript/asset evidence only.
- `npm run prebuild`: passed without cleaning the generated projects. Generated
  iOS/Android files contain the foreground camera/location entries, microphone
  removal, and pose model. Existing non-blocking warnings remain: no custom app
  icon and `expo-system-ui` is not installed.

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

Node 24.18.0, npm 11.16.0, Xcode 26.6 (17F113), Swift 6.3.3, CocoaPods 1.17.0.
Java runtime and adb were not available. No physical devices were tested.

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

**iOS:** unsigned `xcodebuild` command from README ran and failed in RN's bundled
fmt 11.0.2 (`ios/Pods/fmt/include/fmt/format-inl.h`, lines 59, 60, 1387, 1391,
1394): `call to consteval function ... is not a constant expression`. Exit 65.
This is a compiler/dependency issue before app validation, not a signing failure.
Local full log: `/tmp/nextrep-xcodebuild.log` (not a repository artifact).

The observed failure matches the upstream
[fmt report for Apple clang 21](https://github.com/fmtlib/fmt/issues/4740) and
[React Native report](https://github.com/facebook/react-native/issues/55601).
No speculative patch was applied to generated Pods. To retry with an older
installed Xcode toolchain, use a per-command selection (does not change global
settings), for example after installing Xcode 26.3 at that path:

```sh
DEVELOPER_DIR=/Applications/Xcode_26.3.app/Contents/Developer \
  xcodebuild -workspace ios/NextRep.xcworkspace -scheme NextRep \
  -configuration Debug -sdk iphoneos -destination 'generic/platform=iOS' \
  -derivedDataPath /tmp/nextrep-derived-26-3 CODE_SIGNING_ALLOWED=NO
```

That workaround is **not tested here**. If a phone requires a newer Xcode,
integrate and validate the upstream fmt fix through a repeatable Expo config
plugin/maintained patch before rebuilding. Preserve C++20 for RN/Worklets; do not
globally downgrade C++ or claim that compiler flags alone fix fmt. Once native
compilation passes, run `npm run ios` with your own signing team and phone.

**Android:** `cd android && ./gradlew :app:assembleDebug` was attempted and exits
before Gradle with `Unable to locate a Java Runtime`. Install JDK 17 plus the
Android prerequisites in README, set JAVA_HOME/ANDROID_HOME, then rerun that
command and `npm run android`. CameraX/MediaPipe resolution and Android native
compilation remain unverified.

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
