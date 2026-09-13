# Stage 4 device validation checklist

Updated 2026-09-12. `Automated` means a repository check covers the stated
contract. `Manual` means the stated native runtime path was exercised and the run
is recorded below. `Not tested` means no successful run has been recorded. A
bundle export, prebuild, or unsigned generic-device compile is never device
evidence.

| Validation item | Status | Result and evidence |
| --- | --- | --- |
| iOS Simulator launch | Manual | Pass on iPhone 17 / iOS 26.5. The rebuilt Debug client installed, loaded Metro, and displayed the home screen without a native-module error. |
| Physical iPhone launch | Not tested | `xcrun devicectl list devices` found no connected devices; signing/install was therefore not attempted. |
| Android Emulator launch | Not tested | Host has no JDK, Android SDK, `adb`, emulator, or AVD. Gradle exited before configuration. |
| Physical Android launch | Not tested | Same host-tooling blocker; no Android device was connected or tested. |
| Environment URL selection | Automated | Resolver tests cover iOS Simulator loopback, Android Emulator `10.0.2.2`, physical-device LAN, missing values, and production HTTPS rejection. |
| API health — iOS Simulator | Manual | Pass. Developer diagnostics showed `http://127.0.0.1:3000`, mode `simulator`, and health `reachable`. Host `/health` also returned `{"ok":true}` over loopback and the configured LAN address. |
| API health — physical/Android targets | Not tested | LAN reachability from this Mac does not prove reachability from a phone or Android emulator/device. |
| Map rendering — iOS Simulator | Manual | Pass. Native MapLibre rendered the configured MapTiler base-v4 streets style, attribution, Houston labels, and the demo user marker. |
| Development location recenter | Manual | Pass after fix. Switching from real simulator GPS (San Francisco) to Player B immediately moved the existing MapLibre camera to Houston without remounting. |
| Map rendering — Android/physical targets | Not tested | Requires rebuilt Android and signed physical clients. |
| Camera permission messaging — iOS Simulator | Manual | Pass. Granted state reached the workout; after simulator revocation the UI showed Allow camera, Settings guidance, and Open Settings. No microphone prompt appeared. |
| Camera preview and front/back camera selection | Not tested | The simulator has no camera hardware. Switching changed the native empty state from “No front camera” to “No back camera” without a crash, but preview frames, mirroring, and landmarks require phones. |
| Camera recovery through Settings | Not tested | Permission was restored with `simctl` and the flow recovered, but the Settings-screen toggle itself was not exercised. |
| Foreground location permission — iOS Simulator | Manual | Pass. Real GPS mode reported `granted` and services `enabled`; revocation produced “Location permission denied” plus Settings guidance; a restored permission was detected on retry. |
| Location recovery through Settings | Not tested | Recovery after programmatic simulator grant passed; the Settings-screen toggle must still be tested on each target platform. |
| Location permission — Android/physical targets | Not tested | Confirm allow/deny/retry, foreground-only prompts, and absence of background-location requests on targets. |
| Native permission declarations | Automated | Expo/native-config tests require iOS camera + When In Use only, Android camera + fine/coarse foreground location, and removal of microphone/background location. |
| Font and asset packaging | Automated | Bundle checks resolve all Nunito faces and avatar/navigation/workout density assets; the iOS Simulator home screen also visibly used the packaged UI assets and fonts. |
| Two-device presence | Manual | Pass between iPhone 17 and iPhone 17 Pro simulators. Player A/B produced distinct IDs; both clients reported one nearby at approximately 100 m and showed both map markers. Expiry/stop-sharing was not timed. |
| Challenge creation | Manual | Pass between the two simulators. Sender selected the nearby marker and the receiver displayed the incoming waiting challenge. |
| Challenge acceptance | Manual | Pass between the two simulators. Receiver accepted, both clients accepted the shared configuration, settings locked, and both displayed the same challenge ID. |
| Shared countdown | Automated | Native partial pass: sender displayed the 10-second shared countdown and receiver auto-entered the same active challenge, but both visible countdown values were not captured simultaneously. Timing/controller tests cover the contract. |
| Rep counting | Automated | Deterministic landmark replay is covered; live MediaPipe landmarks and counts on phones are Not tested. |
| Result resolution | Automated | Server/client polling tests cover resolution and no-show behavior; a two-client native result flow is Not tested. |
| Reward persistence | Automated | Idempotent storage tests cover retry/reload; native-device persistence is Not tested. |
| Background/foreground — map browsing | Manual | Pass on iOS Simulator. The native map and developer state remained present after Home then foreground. |
| Background/foreground — countdown | Manual | Pass on iOS Simulator. A solo countdown resumed into the active workout with the timer advanced. This is not a two-device shared-countdown pass. |
| Background/foreground — camera workout | Manual | Pass on iOS Simulator for UI/lifecycle: the active workout and permission UI resumed with the timer advanced. Camera frames were unavailable. |
| Background/foreground — active challenge | Manual | Pass on iPhone 17 Simulator before invitation expiry: the same active challenge ID and advanced timer remained after Home then foreground. Repeat on target phones. |
| Background/foreground — result polling | Not tested | Requires a submitted two-client challenge result. |
| Re-entering an active challenge | Not tested | The simulator attempt exposed premature server expiry after two minutes. The server now extends active expiry through countdown + workout + 120-second result grace, verified by server tests and a real local API/database run (430 seconds for a 300-second match). Native force-close/re-entry must be repeated with the restarted server. |

## Run record — iOS Simulator

- Test date: 2026-09-12 (America/Chicago).
- Device: Apple iPhone 17 Simulator; iOS 26.5 runtime; simulator UDID
  `E554B14A-B74C-46B1-972C-140BF7A2FF4D`.
- Build ID: local Debug build from commit `174d4ab` plus the Stage 4 working-tree
  permission fix; `CFBundleVersion` 1.
- Toolchain: Xcode 26.3 (`17C529`) selected per command, CocoaPods 1.17.0,
  Node 24.18.0, npm 11.16.0.
- Build evidence: simulator-target `xcodebuild` completed with `** BUILD
  SUCCEEDED **`; app installed with `simctl`; Metro `/status` returned
  `packager-status:running`.
- Runtime evidence: accessibility/UI inspection recorded API `reachable`, map
  configuration `configured`, camera `granted` before revocation, location
  `granted`, and location services `enabled`. Screenshots were captured during
  the local run in `/tmp/nextrep-stage4-launch.png`; `/tmp` evidence is ephemeral
  and is not a repository artifact.
- Permission manipulation: `simctl privacy revoke/grant` was used to force state
  transitions. This validates app messaging/state recovery, not manual Settings
  navigation.
- Result: partial pass for the rows marked Manual. No real camera frames or live
  pose landmarks exist in Simulator, so rep counting was not attempted.

## Run record — two iOS Simulators

- Test date: 2026-09-12 (America/Chicago).
- Devices: the iPhone 17 above and Apple iPhone 17 Pro Simulator / iOS 26.5,
  UDID `6816992A-CD6D-48ED-82F3-E91DB38F5227`; same local Debug build ID.
- Result: presence, native MapLibre markers, challenge creation, receiver
  acceptance, two-party configuration acceptance/locking, shared start, and the
  same active challenge ID passed. A first development-client load selected a
  stale Metro endpoint and showed `RCTFatal`; selecting the active Metro endpoint
  on port 8082 loaded the app normally.
- Defect found: active challenges retained the 120-second invitation expiry even
  after starting. Force-close/relaunch after that boundary showed no challenge.
  The start route now extends `expires_at` to session start + countdown + match
  duration + 120-second result grace. A temporary updated server on port 3001
  created and started a synthetic challenge with a 430-second TTL and returned it
  from the participant list. The native re-entry UI was not rerun against that
  temporary endpoint, so the checklist row remains Not tested.
- Defect found: changing Player A/B after MapLibre mounted updated presence and
  markers but left the camera at the previous GPS position. `startSimulation`
  now flies the existing native camera to the selected test coordinate; a live
  San Francisco → Player B/Houston switch passed without remounting.

## Host and target blockers

- Physical iOS: the Xcode 26.3 unsigned generic iPhoneOS build passed, but there
  was no connected device, signing team, certificate, or provisioning evidence.
  A generic unsigned device compile is compilation evidence only.
- Android: install JDK 17 and Android Studio components (SDK Platform 36, Build
  Tools 36.0.0, platform-tools, emulator, NDK 27.1.12297006, CMake), set
  `JAVA_HOME` and `ANDROID_HOME`, create/start an AVD, and rerun the build.
- Production: provide a real deployed HTTPS
  `EXPO_PUBLIC_PRODUCTION_API_URL`; no release API/device run was performed.
- Full Stage 4 exit still requires signed iPhone and Android clients, physical
  camera/location checks, two-device presence/challenge/result/reward flows, and
  all remaining recovery rows above.
