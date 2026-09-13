# NextRep implementation backlog

This backlog records work that remains after each implementation stage. Items stay open until they are implemented and verified on the target devices.

## Stage 4 — Native build and device validation

**Status:** Open. A rebuilt iOS Simulator client now compiles, launches, renders
the native map, reaches the API, and passes the recorded simulator permission and
recovery checks. Android and physical-device acceptance remain pending.

### Completed evidence

- Mobile test suite passes: 123 tests.
- Server test suite passes: 16 tests.
- Typecheck, lint, diff checks, native configuration checks, iOS/Android bundle export, and Expo prebuild pass.
- Permission handling, MapTiler configuration, startup diagnostics, and native readiness checks are implemented.
- Xcode 26.3 builds and installs the Debug client on iPhone 17 / iOS 26.5
  Simulator. MapLibre/MapTiler rendering, simulator API health, location
  denial/restoration, camera denied/no-hardware states, and map/countdown/workout
  background recovery are recorded in `docs/device-validation.md`.
- Xcode 26.3 also passes an unsigned generic iPhoneOS build. This proves device
  architecture compilation, not signing, installation, or physical behavior.
- The Expo Location configuration now explicitly disables both iOS Always usage
  strings and all iOS/Android background-location options; generated projects
  contain foreground location only.
- Two iOS 26.5 simulators passed presence, challenge creation/acceptance,
  two-party configuration locking, shared start, and active-challenge
  background/foreground recovery. The run exposed and fixed premature active
  challenge expiry; server tests and a live development-database API run verify
  the corrected countdown + match + result-grace TTL.
- Switching between real GPS and Player A/B now recenters the already-mounted
  MapLibre camera; the fix was exercised in the rebuilt simulator client.

### Remaining acceptance work

- Build/install signed physical iOS and Android development clients and build an
  Android Emulator client after installing the missing Android toolchain.
- Verify camera allow/deny/Settings recovery, live preview, front/back camera,
  mirroring, MediaPipe landmarks, and rep counts on physical phones.
- Verify foreground location allow/deny/Settings recovery and native map/user and
  nearby markers on Android and both physical platforms.
- Verify device-side API health for Android Emulator (`10.0.2.2`) and both LAN
  phones. A real HTTPS production API remains required for release validation.
- Repeat two-device presence/challenge/shared-countdown behavior on the target
  physical platforms, including presence expiry and stop-sharing.
- Verify recovery during active challenge/result polling and re-entry, then repeat
  all recovery cases on target phones.
- Record each target device model, OS version, signed/EAS build ID, result, and
  durable evidence in `docs/device-validation.md`.
- Install JDK 17, Android SDK Platform 36/Build Tools/platform-tools/emulator,
  NDK/CMake, and an AVD. The iOS Xcode 26.6 `fmt` issue is avoided with the
  locally validated Xcode 26.3 per-command selection.

### Exit criteria

Fresh signed development clients install and run on the target devices, the manual validation matrix is updated with evidence, and camera, pose tracking, map, permissions, API connectivity, presence, and challenge flows are confirmed in native runtime testing.

## Stage 5 — Production identity and persistence

- Replace demo `x-user-id` identity with the production authentication flow.
- Enforce server-side authorization for presence, challenges, workout results, and profile data.
- Persist challenge history, workout history, profiles, progression, and rewards with production-safe migrations.
- Add loading, retry, empty, and unauthorized states for network-backed screens.

## Stage 6 — Multiplayer and social expansion

- Add real-time challenge updates with WebSockets or push notifications.
- Add friend discovery, invitations, notifications, and challenge history.
- Add leaderboards and support for multiple simultaneous or team challenges.

## Stage 7 — Exercise, location, and progression expansion

- Add more supported exercises only after squat tracking remains reliable.
- Define privacy-safe background location behavior and retention rules.
- Add weekly targets, streaks, rewards, shop/cosmetics, and inactivity-based overall decay.
- Replace remaining simulated progression and reward behavior with production-backed rules.

## Product polish backlog

- Add the final custom app icon and evaluate whether `expo-system-ui` is needed for the release build.
- Continue visual polish against the Figma reference while preserving large, glanceable workout controls and accessible contrast.
