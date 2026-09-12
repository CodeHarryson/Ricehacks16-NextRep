# Validation — 2026-09-11

## Environment and repository

Inspected Git status/history, root files and ancestor AGENTS.md locations. The
provided Ruflo instructions apply; no ToolSearch or Ruflo MCP tool was available
in the exposed tool inventory. No [INTELLIGENCE] suggestions were present.
Initial tree: original README plus untracked `.claude-flow/`, preserved.
No generator was run over the repository root. No push, deploy or signing change.

Node 24.18.0, npm 11.16.0, Xcode 26.6 (17F113), Swift 6.3.3, CocoaPods 1.17.0.
Java runtime and adb were not available. No physical devices were tested.

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
compatibility. There is no live landmark or physical-device validation to report.
The native detector, model resources and timestamp bridge work remain explicit
next steps in native-integration.md.

## Dependency advisories

`npm audit` reports **19 vulnerabilities: 10 moderate, 9 high** in this SDK 54
graph, including Expo CLI/Metro, image-size, postcss, uuid and xcode dependencies.
Several npm proposed fixes move Expo/dev-client to SDK 57 and cannot be applied
blindly to this legacy-native baseline. No `audit fix --force` was run. Review
compatible backports or validate a newer architecture/adapter before distribution.
These are real unresolved dependency advisories; this scaffold is a hackathon
development baseline, not a security-reviewed release.
