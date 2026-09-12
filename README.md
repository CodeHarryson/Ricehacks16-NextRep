# Ricehacks16-NextRep
RiceHacks competition project 

NextRep is a React Native fitness-game scaffold for HackRice 16. Target: physical
iOS and Android phones; team deadline Sunday, September 13, 2026, 8 a.m. Central.
Scope: camera setup → native pose boundary → future five-squat set → saved upgrade.

The current product scope, battle/consistency decisions, ownership, milestones, and
actual implemented-versus-planned status are in the [implementation plan](docs/IMPLEMENTATION_PLAN.md).

## Setup

Use Node 24 (validated with 24.18.0) and npm (validated with 11.16.0).
Node must be at least 20.19.4. The base app can run without Tiger Data, but the
nearby map requires the presence server, a Tiger Data connection, and
`EXPO_PUBLIC_API_URL`. Do not use Expo Go; custom native code requires a
development build. No frames are uploaded, recorded or stored by this scaffold.

```sh
git clone https://github.com/CodeHarryson/Ricehacks16-NextRep.git
cd Ricehacks16-NextRep
npm ci
npm run typecheck
npm run lint
npm run check:bundle
npm run prebuild
```

Native directories are generated and gitignored. Keep durable native changes in
local modules/config plugins or explicit maintained dependency patches. Do not
run `prebuild --clean` over teammates' uncommitted native work. The root was
scaffolded in place; its original README text and `.claude-flow` are preserved.

### iPhone (Mac required)

Install Xcode and its iOS platform, select Xcode in Settings → Locations → Command
Line Tools, accept its license, and install CocoaPods. This host has Xcode 26.6,
Swift 6.3.3 and CocoaPods 1.17.0. Minimum phone OS is iOS 15.1.

```sh
npm run prebuild
pod install --project-directory=ios
npm run ios
# Later JS-only sessions, after the development app is installed:
npm start
```

Connect and trust the iPhone, enable Developer Mode, and select it when prompted.
In `ios/NextRep.xcworkspace`, select your own Development Team under Signing &
Capabilities if signing fails. The default bundle ID is `com.nextrep.hackrice`;
change app.json if your team needs a unique ID. No team, certificate, provisioning
profile, Expo project, or credentials have been configured by this task.

Unsigned compile check (does not install on a phone):

```sh
xcodebuild -workspace ios/NextRep.xcworkspace -scheme NextRep \
  -configuration Debug -sdk iphoneos -destination 'generic/platform=iOS' \
  -derivedDataPath /tmp/nextrep-derived CODE_SIGNING_ALLOWED=NO
```

### Android

Install JDK 17 and Android Studio with Android SDK Platform 36, Build Tools 36.0.0,
platform-tools, NDK 27.1.12297006 and CMake. Set JAVA_HOME to your JDK and
ANDROID_HOME to your SDK (macOS default below). Minimum phone OS is API 24.

```sh
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
java -version
adb devices
npm run prebuild
npm run android
# Optional USB Metro connection:
adb reverse tcp:8081 tcp:8081
npm start
```

Enable USB debugging and accept the computer authorization on the phone. Linux
and Windows developers should use their local JDK/SDK paths. Standalone native
check: `cd android && ./gradlew :app:assembleDebug`.

## Selected versions

All direct versions are exact; package-lock.json locks the transitive npm graph.
Expo's bundled dependency map and online `expo install --check` agree with this
React/React Native selection.

| Package | Version |
| --- | --- |
| Expo / development client | 54.0.37 / 6.0.21 |
| React Native / React | 0.81.5 / 19.1.0 |
| VisionCamera / Worklets Core | 4.7.3 / 1.6.2 |
| react-native-mediapipe (live-stream integration; phone validation pending) | 0.6.0 |
| AsyncStorage / safe-area-context | 2.2.0 / 5.6.0 |
| TypeScript | 5.9.2 |
| ESLint / Expo lint config | 9.39.1 / 10.0.0 |

Legacy architecture is explicitly enabled via `newArchEnabled: false`. This keeps
the candidate's legacy bridge path available. Native compatibility is provisional
until both platforms compile and run on phones. See the inspected upstream source,
licenses, SDK rationale, native dependency pins and known gaps in
[native-integration.md](docs/native-integration.md). Expo development builds can
host the native integration; there is no demonstrated need for bare RN.

## Ownership and status

| Owner | Files | Status |
| --- | --- | --- |
| Camera + native pose | src/features/tracking | VisionCamera + MediaPipe live-stream adapter, bundled Lite model, permission/lifecycle flow; physical devices pending |
| Squat algorithm | src/features/squat | CV core implemented with pixel-space thigh inclination, calibration, smoothing, gating, temporal phases, ratings, replay fixtures and deterministic tests; real landmark/device calibration planned |
| Workout UI + audio | src/features/workout/WorkoutScreen.tsx, src/components | Home/setup/progression UI implemented; event feedback and audio planned |
| Controller + storage | src/features/workout/controller.ts, src/features/progression | Live five-rep set controller, idempotent local completion reward, and schema-v2 XP/OVR/coin persistence implemented; rest/upgrades planned |

Shared contracts live in `src/contracts`; five-rep and location thresholds live in
`src/config`. The demo nearby map is available from the home screen.
Screens are intentionally simple local navigation with Android back handling.
Tracking now reports native initialization, tracking, lost and error states and
feeds valid landmarks into the pure analyzer. No simulated counts, ratings, or
rewards are shown in the real workout. Camera and storage behavior remain untested
on physical devices; a bundle passing does not validate native code.

See [workout ownership notes](src/features/workout/README.md) for end-of-attempt
rating semantics, neutral tracking loss, controller-owned totals, and the
idempotent local XP/OVR grant. Do not connect rewards directly to frames.

## Tiger Data presence setup

The Stage 3 Step 2 presence API is under `server/`. It keeps Tiger Data
credentials server-side and uses PostGIS geography plus a Timescale hypertable
when the extensions are available. The mobile app only receives the public API
URL; it never receives `TIGER_DATABASE_URL`.

After creating `server/.env` from [server/.env.example](server/.env.example), run:

```sh
npm run --prefix server migrate
npm run --prefix server start
```

Set `EXPO_PUBLIC_API_URL` in a local ignored `.env` (see `.env.example`) to the
reachable API URL for the development device. The map uses a generated demo user
ID stored locally until authentication exists. This is demo-only behavior, not
identity or access control. Presence is foreground-only, expires after 60 seconds,
and is quantized before other users see it; use `npm run --prefix server cleanup`
for scheduled expired-row cleanup.

One-device API/map-path testing is complete. Two-device proximity testing remains
planned for the next stage. The demo API accepts client-generated demo user IDs;
these are not production authentication.

## First real-phone test: camera → landmarks

- [ ] Install the development build on one iPhone and one Android. Record OS,
  model, build version and any native compile errors.
- [ ] Verify allow/deny/Settings/re-entry, front/back preview, background/resume,
  and navigation cleanup. Confirm the full body fits and no audio permission occurs.
- [ ] Verify the bundled licensed `.task` model is present in both native targets,
  record its hash, and confirm the live frame processor emits landmarks on device.
- [ ] Fix Android timestamp forwarding, verify clock units/order, and map image
  dimensions, orientation, mirroring and 33 landmarks into PoseFrame.
- [ ] Add a labeled development landmark overlay; inspect shoulders, hips, knees
  and ankles on both phones. Preserve provided visibility/presence; invent no scores.
- [ ] Verify empty/occluded/multiple-person cases and detector failures produce
  neutral guidance. Measure callback cadence and check stale results after resume.
- [ ] Only then implement the TypeScript squat engine and connect attempt events
  to controller/persistence, including duplicate-event and tracking-loss checks.

## Validation

Validation results and exact native blockers are recorded in
[validation.md](docs/validation.md). Nothing was pushed or deployed.
