# Stage 4 device validation checklist

Updated 2026-09-12. `Automated` means a repository test currently covers the stated contract. `Manual` means it was exercised by a person and evidence was recorded. `Not tested` means no successful device run has been recorded yet. A JavaScript export is not device evidence.

| Validation item | Status | Evidence to record / acceptance condition |
| --- | --- | --- |
| iOS Simulator launch | Not tested | Development client installs, opens, loads Metro, and shows no native-module error. |
| Physical iPhone launch | Not tested | Record model, iOS version, build ID, network, launch, and resume behavior. |
| Android Emulator launch | Not tested | Development client opens with `EXPO_PUBLIC_ANDROID_EMULATOR_API_URL` and renders native modules. |
| Physical Android launch | Not tested | Record model, Android/API version, build ID, network, launch, and resume behavior. |
| Camera permission | Not tested | On both physical platforms: allow, deny, Settings recovery, front/back camera, and no microphone prompt. Static permission entries and state messages are Automated, but runtime behavior is not. |
| Location permission | Not tested | On both physical platforms: allow, deny, Settings recovery, foreground-only use, and no background-location prompt. Static permission entries and state messages are Automated, but runtime behavior is not. |
| Map rendering | Not tested | MapLibre loads the configured MapTiler style on iOS and Android; attribution, user marker, nearby marker, and failure message render correctly. |
| API health | Automated | Mobile request/error handling and server `/health` behavior have tests. Confirm `reachable` in the device diagnostics panel on every device run. |
| Two-device presence | Not tested | Two distinct demo IDs appear to each other, distance is approximate, expiry works, and stopped sharing removes presence. |
| Challenge creation | Automated | API/domain tests cover creation rules. Create from one real device and observe it on the other before marking Manual. |
| Challenge acceptance | Automated | API/domain tests cover shared configuration and acceptance invalidation. Verify both device views before marking Manual. |
| Shared countdown | Automated | Timing/controller tests cover the shared start contract. Compare the visible countdown on two devices before marking Manual. |
| Rep counting | Automated | Deterministic landmark replay covers the TypeScript analyzer. Live MediaPipe landmarks and counts on phones remain Not tested. |
| Result resolution | Automated | Server and client polling tests cover resolution/no-show behavior. A full two-device result flow remains Not tested. |
| Reward persistence | Automated | Idempotent reward/storage tests cover retry and reload behavior. Device storage persistence remains Not tested. |
| Background/foreground recovery | Not tested | During map, countdown, camera, active workout, and result polling, background then resume each device without duplicate reps/rewards or stale state. |
| Re-entering an active challenge | Automated | Navigation/challenge state tests cover the state transition. Background, force-close, relaunch, and re-entry on devices remain Not tested. |

## Per-run evidence

For each manual run, record the date, commit, EAS/local build ID, device model and OS, API URL host (never secrets), MapTiler style status, each permission decision, screenshots/logs, and any failure. Change a row to `Manual` only after its acceptance condition was exercised and that evidence was saved here or linked from an issue.
