# Figma design integration plan

Status: plan only, no UI code changed. Inspected September 12, 2026.

## Sources inspected

| Source | What it is |
| --- | --- |
| `/Users/codeharryson/Documents/NextRep-Figma-Design-Reference/prototype` | Figma Make export: React 19 + Vite + Tailwind v4 web app rendered inside a 390×844 phone frame. Screens are in `src/components/*.tsx`, the shell is in `src/App.tsx`, and tokens and keyframes are in `src/index.css`. All data is hard-coded mock data. |
| `assets/design/figma-reference/` (this repo, untracked) | Byte-identical copy of the prototype's `src/imports/` folder: 9 Figma frame/vector folders plus 20 PNG/JPG reference images. |
| `prototype/.figma/attachments/image-0…3.png` | 20–114 px raster gear icons (shield, hat, wand, gauntlet). Not copied. Vector versions exist. |

The prototype is **not** imported or run by the Expo app. It uses DOM elements,
Tailwind classes, CSS keyframes, CSS gradients, `backdrop-filter`, and web fonts
from `static.figma.com`, none of which work in React Native. Port the visuals, not the code.

## 1. Figma screens and components

### Screens (from `prototype/src`)

| # | Figma screen | File | Contents |
| --- | --- | --- | --- |
| S1 | **App shell + bottom nav** | `App.tsx` | Tabs: Ranks (calendar icon), centre Map button that becomes a red **Workout** CTA while on the map, Profile. The map tab is the default "home". |
| S2 | **Battle map (home)** | `MapScreen.tsx` | Illustrated SVG map background; "me" sprite with gold outline; wandering `PlayerMarker`s (Lvl pill + sprite); `StreakStrip` HUD; `PlayerPopover` sheet with scrim. |
| S3 | **Pre-battle VS** | `BattleFlow.tsx › PreBattleAnim` | "BATTLE REQUEST ACCEPTED" slam-in title, diagonal red/blue split, opponent top-left, me bottom-right, flashing gold "VS", "Set Battle Goals →" CTA. |
| S4 | **Battle goals** | `BattleFlow.tsx › BattleGoals` | "STEP 2 OF 4", selectable goal cards (squats, push-ups, jumping jacks, lunges, each with a time limit), agree/continue CTA. |
| S5 | **Workout recording** | `BattleFlow.tsx › WorkoutRecording` | Exit ✕, 4-step indicator, countdown timer (red at ≤10 s), user-vs-opponent segmented progress bar, rep-quality label, camera area with skeleton overlay, reps chip, BP chip, Start/Recording CTA, "Session Complete" summary with a 3-stat grid and quality strip. |
| S6 | **Post-battle result** | `BattleFlow.tsx › PostBattleResult` | Confetti, "VICTORY!" headline, winner/loser sprites with animated bump/knock-down, per-player quality bars, "Rewards earned" table, "Return to Map" CTA. |
| S7 | **Progress: calendar** | `CalendarScreen.tsx › CalendarView` | Segmented control (Calendar / Leaderboard), month grid of day states, streak pill, legend, "Session Progress" line chart. |
| S8 | **Progress: leaderboards and friends** | `CalendarScreen.tsx › LeaderboardView` | City leaderboard top 3 + "see all", friends leaderboard, add-friend search, friend requests (accept/decline), full-screen expanded list, friend profile with "Challenge to Battle". |
| S9 | **Profile + shop** | `ProfileScreen.tsx` | Hero (city rank, avatar card with edit pen, name, @handle, Lvl pill, BP pill), Wins / Losses / Win rate stat row, 2-column shop grid with affordable and unaffordable states. |

### Components

| Component | Where | Notes |
| --- | --- | --- |
| `CharacterSprite` | `components/CharacterSprite.tsx` | Parametric SVG avatar. Sizes xs 40, sm 56, md 112, lg 196 (height); aspect 134:232.5. Props: `flip`, `animate` (bobble), `skin`, `skinOutline`, `eye`, `shirt`, `hat`, `shield`, `weapon: 'wand' \| 'gauntlet'`. Uses SVG masks, inner-shadow filters and `mixBlendMode`. |
| Gear icons | `imports/LowTierShield`, `MagicWand`, `Gauntlet`, `WarlockHat` | Standalone shop icons and sprite overlays. |
| `FlameIcon` | `imports/FlameIcon` | Streak flame (#FF9600 fill, #C97200 stroke, #FFD700 highlight). |
| `BottomNav` + nav icons | `App.tsx` | Calendar, map pin, profile, dumbbell icons; active and inactive colours. |
| `StreakStrip` | `MapScreen.tsx` | Avatar circle + pill track, yellow fill, flame and empty-circle milestones, star with next level number. |
| `ProfileChip` | `MapScreen.tsx` | Avatar + name + Lvl. **Defined but never rendered.** |
| `PlayerMarker` | `MapScreen.tsx` | Lvl pill above sprite; hop/bobble animation. |
| `PlayerPopover` | `MapScreen.tsx` | Tinted header band, avatar tile, Lvl pill, W–L, BP row, secondary + primary buttons. |
| `StepIndicator` | `BattleFlow.tsx` | Done (green ✓), current (blue), upcoming (grey) circles joined by bars. |
| `CompetitionProgressBar` | `BattleFlow.tsx` | Segmented quality blocks; opponent at 30 % opacity under the user. |
| `SkeletonOverlay` | `BattleFlow.tsx` | Static decorative stick figure tinted by rep quality. |
| Goal option card | `BattleFlow.tsx` | Radio-style selectable card. |
| Stat grid / rewards table | `BattleFlow.tsx` | Label/value rows with a total divider. |
| `DayCell`, legend, `WorkoutProgressChart` | `CalendarScreen.tsx` | Calendar states; SVG line chart. |
| `RankBadge`, `LocalRow`, `FriendRow`, `PersonRow`, `SeeMoreButton`, `ExpandedList`, `FriendProfile` | `CalendarScreen.tsx` | List rows and full-screen list/profile. |
| `ShopItemCard`, `Pen` | `ProfileScreen.tsx` | Shop tile; edit badge. |

### Imported Figma frames (reference only)

`imports/GameAppDesignOverview`, `GameAppDesignOverview-1` and `Container` are
raw Figma-to-code exports of **earlier iterations** of the profile, map and streak
strip. The prototype uses nothing from them except the pen-icon paths from
`GameAppDesignOverview/svg-8d6d6pxw63.ts`. Treat them as superseded.

## 2. Screen mapping to the current React Native app

| RN target | Current RN implementation | Figma source | Integration notes |
| --- | --- | --- | --- |
| **Home** | `App.tsx` `screen === 'home'`: title, tagline, card, 3 `Action` buttons | S1 shell + S2 HUD (`StreakStrip` / `ProfileChip`) | Figma has no separate home; the map *is* home. Keep the existing `screen` state machine and add a shell (top HUD + bottom nav) that calls `setScreen`. The map must stay mounted-but-hidden while on the challenge screen, since presence depends on it. |
| **Nearby map** | `src/features/location/MapScreen.tsx`: MapLibre `MapView` (360 px, inside the app `ScrollView`), dot `MarkerView`s, selected-opponent card, dev simulation and diagnostics cards | S2 | **Keep MapLibre.** Do not port the illustrated `MapBackground`. Restyle markers (Lvl pill + avatar) and turn the selected-opponent card into a `PlayerPopover`-style card. Keep the dev cards behind `__DEV__`, visually de-emphasised. |
| **Challenge setup** | `src/features/challenge/ChallengeScreen.tsx`: nearby list, incoming/outgoing, shared squat config (± steppers), acceptance status, start | S3 VS header, S4 goal card styling, S8 `FriendProfile` challenge button, S2 popover | The RN flow is richer than Figma: server handshake, per-field config, dual acceptance, lock. Use Figma styling only. Show VS when status becomes `accepted`, and render config as S4-style cards with steppers. |
| **Workout camera** | `src/features/workout/WorkoutScreen.tsx` + `tracking/CameraPreview.tsx` / `PoseOverlay.tsx`: long text readout of countdown, set, phase, measurement, tracking detail, reps | S5 | Restyle chrome: step indicator, timer, rep chip, score chip, quality label, framed camera, bottom CTA. The debug readouts (phase, range°, tracking detail) move into a collapsible dev panel. `PoseOverlay` keeps its landmark logic; only colours and guide styling change. |
| **Results** | Inline in `WorkoutScreen.tsx`: score card, resolution card, reward/save status, retry buttons | S6 + S5 "Session Complete" summary | Extract a **presentational** results panel that receives values already computed in `WorkoutScreen`, with no changes to finalisation, submission or reward code. Cover every real state (see "Results states" below), not just "VICTORY". |
| **Profile / progression** | `src/features/progression/ProgressionScreen.tsx`: OVR · XP · coins text in a card | S9 hero + stat row; S7 calendar | Hero with avatar, display name, OVR pill (not "Lvl"), coins pill (not "BP"), XP. Show the Wins/Losses/Win rate row only once real data exists. Shop, city rank, calendar and leaderboards are deferred (see §7). |

### Results states the RN panel must cover

From `WorkoutScreen.tsx` / `workout/resultCopy.ts` / `challenge/rewards.ts`:
solo `saving` → `saved`; challenge `submission_pending` → `submitted`; resolution
`pending`, `resolved` (winner / loser / draw, with `BATTLE_REWARDS` xp/coins), and
`cancelled` (opponent no-show: no winner or reward); `resultError` with retry; time
expired; reward status `failed` with retry. Figma only designs the winner case.

## 3. Reusable visual components to build

All go in `src/components/` (presentational, no feature logic). The existing
`ui.tsx` exports (`Action`, `Card`, `styles`) stay as thin compatibility wrappers
until every screen has migrated.

| Component | Figma origin | Variants and states |
| --- | --- | --- |
| `Button` | CTAs across S3–S6, S8 | `primary` (green), `danger`/battle (red), `accent` (blue), `warning` (orange, VS CTA), `secondary` (surface + border), `disabled`; pressed = scale 0.95 or opacity; optional leading icon; `size: md \| lg`. |
| `IconButton` | Exit ✕, back chevron, accept/decline circles | 34 px circle, surface bg, 2 px border. |
| `Card` / `Panel` | Surfaces with 2–2.5 px `#c8d0e0` border | `default` (#f5f7fb), `selected` (#eff5ff + #4a90e2 border + soft shadow), `highlight` (me row), `warning`. |
| `ScreenHeader` | "Agree on Goals", "Progress", expanded list header | Eyebrow ("STEP 2 OF 4"), title, subtitle, optional back button. Uses safe-area insets instead of Figma's fixed `pt-14`. |
| `Pill` / `Badge` | Lvl pill, YOU badge, streak pill, BP pill, count badge | `level` (accent), `currency` (amber), `streak` (orange), `danger` count, `success`. |
| `StatRow` | Wins / Losses / Win rate; Reps / BP / Great reps | 2–3 columns with vertical dividers, coloured value + small caps label. |
| `AvatarDisplay` | `CharacterSprite` in circle (xs/sm), tile (64), hero card (160×200 + edit badge) | Phase 1 renders an initials/placeholder silhouette; Phase 3 swaps in the SVG sprite with the same props. |
| `ProgressBar` | `StreakStrip` track, XP/OVR progress | Track + fill + optional milestone slots; value is always passed in, never faked. |
| `QualityBar` | `CompetitionProgressBar`, result quality strip | Segments coloured green/yellow/red/**neutral**; optional ghost series at 30 % opacity. |
| `StepIndicator` | S5 | done / current / upcoming. |
| `ChallengeCard` | `PlayerPopover`, incoming challenge, `FriendRow` | Avatar + name + distance/status + action slot. States: `available` (Challenge button), `pending`, `incoming` (Accept/Decline), `accepted/configuring/ready/active` status, `expired/declined`. |
| `ConfigStepperRow` | S4 card styling + current ± controls | Label, value, −/+, `locked` disabled state. |
| `VsBanner` | S3 | Two avatars + names + VS; Animated slide-in (optional). |
| `ResultHeadline` | S6 | `victory` / `defeat` / `draw` / `cancelled` / `pending`. |
| `BottomNav` | S1 | 3 slots; centre CTA enlarged/red when on map. |

## 4. Asset inventory

### Use directly (data only)

The `svg-*.ts` modules are plain `export default { pXXXX: "M…" }` path strings with
no DOM dependency. Copy the needed ones into `src/components/art/paths/` rather
than importing from `assets/design`.

| Module | Used for |
| --- | --- |
| `AvatarCharacterspriteBase/svg-g0jev4nvz8.ts` | Avatar body, head, hands |
| `LowTierShield/svg-kbybzq1rfb.ts`, `MagicWand/svg-189sfn0wi7.ts`, `Gauntlet/svg-8403qowjv7.ts`, `WarlockHat/svg-ya5fdplm2l.ts` | Gear overlays and shop icons |
| `FlameIcon/svg-mzbm4m5qkv.ts` | Streak flame |
| `GameAppDesignOverview/svg-8d6d6pxw63.ts` | Pen (edit) icon only |

Colour values, sizes and layout numbers in the prototype `.tsx` files can also be
copied directly into tokens (§5).

### Needs conversion to React Native SVG

These need `react-native-svg`. See the dependency note below.

| Source | Conversion |
| --- | --- |
| `CharacterSprite.tsx` + `AvatarCharacterspriteBase/index.tsx` | Port to `Svg`/`G`/`Path`/`Line`/`Mask`. **Drop or approximate** the `feColorMatrix`/`feComposite arithmetic` inner-shadow filters and every `mixBlendMode` (`multiply`, `plus-darker`, `plus-lighter`, `overlay`, `lighten`): treat them as unsupported and replace with a second offset path at low opacity. Verify masks on both platforms. Keep the per-instance id approach (`useId`). |
| Gear `index.tsx` (shield, wand, gauntlet, hat) | Same: paths + fills/strokes, filters and blend modes approximated. |
| `FlameIcon/index.tsx` | Trivial: 2 paths, no filters. |
| Inline icons: dumbbell, calendar, map pin, profile (`App.tsx`); star, unlock, close (`MapScreen.tsx`); camera, check, close (`BattleFlow.tsx`); back/forward chevrons, search, check/cross (`CalendarScreen.tsx`) | Small `Svg` components in `src/components/icons/`. The ✕/✓/chevron glyphs can use `Text` or `View` until the SVG dependency lands. |
| `SkeletonOverlay` | **Do not port as art.** The real overlay is landmark-driven (`PoseOverlay`). Borrow only the quality colours and the joint-dot look. |
| `WorkoutProgressChart` | Deferred with the calendar (§7). |

### Convert to plain RN styles or Animated (no asset)

- CSS `linear-gradient` buttons and VS background: use solid colours plus a darker
  bottom border (the "chunky" 3D button look from the Duolingo inspiration). No gradient dependency.
- `box-shadow` glows: RN `shadowColor/Offset/Opacity/Radius` (iOS) plus `elevation` (Android).
- `backdrop-filter: blur`: drop it and use a semi-opaque white (`#ffffffee`).
- Keyframes (`fadeSlideUp`, `popIn`, `slamIn`, `vsSlide*`, `mapBobble`, `mapHop`,
  `flamePulse`, `resultBounce`, `winnerCharge`, `loserKnocked`, `confettiFall`):
  use RN `Animated` (already used in `MapScreen`). No Reanimated needed. Confetti is last-priority polish.
- Emoji (🏋️ ⚔ 👑 🎉 📅 🏆) render natively in `Text`.

### Do not ship (reference or inspiration only)

| File(s) in `assets/design/figma-reference/` | What it is | Why not |
| --- | --- | --- |
| `IMG_2732.jpg` | Hand-drawn wireframe of 6 screens | Reference only |
| `Screenshot_2026-09-12_at_*.png` (10 files; `4.38.41_AM-1.png` is a byte-identical duplicate) | Earlier Figma iterations: purple "Warden/Tank" archetypes, dark VS screen, older streak strip with "Unlocked Lvl 10" badge | Superseded by the current prototype code ("archetypes are gone") |
| `image.png`, `image-6.png`, `image-7.png` | Pokémon GO screenshots | Third-party copyrighted |
| `image-1.png` | Miitopia-style battle screenshot | Third-party copyrighted |
| `image-2.png` | Low-poly stock character sheet | Unlicensed stock art |
| `image-3.png`, `image-4.png`, `image-5.png` | Duolingo screens | Third-party copyrighted |
| `image-8.png` | Shutterstock VS banner **with watermark** | Unlicensed stock art |
| `GameAppDesignOverview*/index.tsx`, `Container/index.tsx` | Old frame exports | Superseded |

`assets/design/` is currently untracked in git. Before committing it, exclude or
remove the third-party images above (`image.png` alone is 3 MB). Metro only bundles
files that are `require`d, so they are not a bundle risk, but they should not live in the repo.

### Dependency decisions

| Dependency | Needed? | Justification |
| --- | --- | --- |
| `react-native-svg` (Expo SDK 54 bundles **15.12.1**; install with `npx expo install react-native-svg`) | **Yes, from Phase 3** | Required for the parametric avatar (runtime skin/shirt/gear recolouring, which PNGs cannot do), gear, flame, star and nav icons. It is a native module, so it **requires a new dev-client build on every test device**. Phases 0–2 are designed to avoid it so they ship via Metro reload only. |
| `expo-font` + `@expo-google-fonts/nunito` | Optional, Phase 4 | Nunito (SIL OFL) is the design's display face. `expo-font` currently exists only as a nested dependency of `expo`; add it explicitly with `npx expo install expo-font` before importing. Until then, use the system font at weight 800/900. Inter is optional; the system font is close. |
| `expo-linear-gradient` | No | Replaced by solid colours and borders. |
| `react-native-reanimated`, `expo-blur` | No | `Animated` covers the motion; blur is dropped. |

## 5. Design tokens

Extracted from `prototype/src/index.css` (`@theme`) and inline styles. Put them in
`src/theme/tokens.ts`.

### Colours

| Token | Value | Use |
| --- | --- | --- |
| `bg` | `#ffffff` | Screen background |
| `canvas` | `#e8edf5` | Track background, disabled button bg, inactive step |
| `surface` | `#f5f7fb` | Cards, secondary buttons, rows |
| `surface2` | `#ebeef6` | Alternate surface |
| `border` | `#c8d0e0` | Default 2–2.5 px border, dividers |
| `gridLine` | `#e2e8f2` | Chart grid |
| `text` | `#1a2b4a` | Primary text, sprite outline |
| `textMuted` | `#7a8ba8` | Secondary text, labels |
| `iconInactive` | `#9aaac4` | Inactive nav, placeholder icons, "sent" disabled |
| `primary` / `primaryDark` | `#58cc02` / `#3d9100` | Main CTA, success, trained day, active tab, green rep |
| `accent` / `accentBg` | `#4a90e2` / `#eff5ff` | Level pills, selection, current step, today, "me" highlight |
| `danger` / `dangerLight` | `#ff4b4b` / `#ff6b6b` | Battle CTA, losses, missed day, red rep, timer warning |
| `dangerBg` / `dangerBorder` | `#fff0f0` / `#fecaca` | "Defeated" badge |
| `streak` / `streakDark` | `#ff9600` / `#c97200` | Flame, streak pill text |
| `streakBg` / `streakBorder` | `#fff8ec` / `#ffd093` | Streak pill |
| `gold` / `goldFill` / `goldStroke` | `#ffd700` / `#ffc300` / `#ad6404` | Yellow rep, VS, star, streak fill, winner badge |
| `currency` / `currencyText` / `currencyBg` / `currencyBorder` | `#f59e0b` / `#b45309` / `#fffbeb` / `#fde68a` | Coin/BP pill |
| `purple` | `#a855f7` | XP row, chart series |
| `medalSilver` / `medalBronze` | `#c0c0c0` / `#cd7f32` | Rank badges |
| `scrim` | `rgba(0,0,0,0.35)` | Popover backdrop |
| `quality.green` / `.yellow` / `.red` | `#58cc02` / `#ffd700` (label text `#f59e0b`) / `#ff4b4b` | Rep quality |
| `quality.neutral` | **not in Figma**. Proposed: `#9aaac4` | RN has a neutral attempt state |

Avatar defaults: skin `#f0c68d`, outline `#be8d4b`, eye `#874c24`, shirt `#c3a0e6`.
Prototype shirt palette: `#e98a8a #7fb0e0 #b98be0 #c3a0e6 #9abae0 #f2b366 #8fd6b0 #f2c94c`.

### Typography

Families: **Nunito** (`font-game`) for headings, numbers, buttons and labels; **Inter** for body.

| Token | Size / line height | Weight | Examples |
| --- | --- | --- | --- |
| `hero` | 72 | 900 | "VS" (gold fill, orange 3 px stroke) |
| `display` | 48 | 900 | "VICTORY!" (+ 4 letter spacing) |
| `title` | 24 / 32 | 900 | Screen titles, timer, stat values |
| `titleSm` | 22 / 28 | 900 | Profile name, city rank |
| `section` | 20 / 28 | 900 | "Shop", month name, list header |
| `buttonLg` | 18–20 | 900 | Main CTAs |
| `bodyLg` | 16 / 24 | 900 or 700 | Card titles, goal labels |
| `body` | 14 / 20 | 700 or 400 | Rows, subtitles |
| `caption` | 12 / 16 | 700 | Shop item name, chips |
| `micro` | 10–11 / 15 | 400–700 | Stat labels (uppercase), nav labels, legends |
| `nano` | 9 | 700–900 | Marker Lvl pill, YOU badge |

Eyebrows ("STEP 2 OF 4", "REWARDS EARNED") are 14 px bold muted. The slam
title uses 0.15 em letter spacing.

### Spacing, radii, borders, elevation

- **Spacing scale (4-based):** 2, 4, 6, 8, 12, 16, 20, 24, 32. Screen gutters are 16
  (lists, workout), 20 (profile) and 24 (battle screens). Card padding is 12–16; row padding is 12 × 10.
- **Radii:** 12 (day cells, chips, small buttons), 16 (cards, buttons, avatar tile),
  24 (popover sheet), 9999 (pills, avatars, icon buttons).
- **Borders:** default 2 px `border` (Figma's 2.028 / 2.5 values normalise to 2); 3 px for
  the emphasised centre nav CTA and avatar circle; 1–1.5 px for tiny chips.
- **Elevation:** `card` none; `selected` `0 4 16 accent@18%`; `cta` `0 8 28 primary@40%`
  (danger/orange variants); `sheet` `0 20 60 black@16%`. RN: iOS shadow props plus Android `elevation` 2/4/8.
- **Layout:** Figma frame is 390×844 with an 80 px bottom nav and a 56–68 px centre CTA.
  RN uses `SafeAreaView` insets instead of fixed top padding.

### Visual states

| State | Treatment |
| --- | --- |
| Button pressed | `scale 0.95` (0.9 for icon buttons) |
| Button disabled | `canvas` bg, `textMuted` text, `border` outline, no shadow |
| Selected card | `accentBg` bg, `accent` 2 px border, soft accent shadow, filled radio ✓ |
| Nav tab active / inactive | `primary` / `iconInactive`; centre CTA red and enlarged on map |
| Step indicator | done `primary` + ✓; current `accent`; upcoming `canvas` + `border` |
| Timer | `text`; `danger` at ≤ 10 s |
| Rep quality | green "Great!" +2, yellow "Good" +1, red "Poor Form" +0 (Figma); RN uses `score-v1` (green 110 / yellow 100 / red 0 / neutral 0) |
| Recording CTA | idle green "▶ Start Recording"; running red "● Recording…" (disabled) |
| Challenge sent | `iconInactive` bg, ✓ "Battle Request Sent", helper text |
| Shop item | affordable `currencyBg`/`currencyBorder`/`currencyText`; unaffordable `surface`/`border`/`textMuted` |
| Calendar day | trained green/`#f0fff0` + flame; missed red/`#fff0f0` + ✕; rest `surface` + dot; future transparent; today `accent`/`accentBg` |
| Leaderboard row | "me" row `accentBg` + `accent` border + YOU badge; medals gold/silver/bronze for top 3 |
| Streak strip | filled segment `goldFill`/`goldStroke`; reached milestone flame; pending empty circle; star grey until reached |
| Result | winner gold 👑 badge; loser `dangerBg` "Defeated" badge and shrink/tilt; **RN-only:** draw, cancelled, pending, error |

## 6. Safe implementation order

Guardrails for every phase:

- **Do not modify** logic in `src/features/workout` (controller, scoring,
  sessionClock, finalization, sessionAccounting), `src/features/tracking` (camera,
  adapters, face gate), `src/features/squat`, `src/features/location` (api,
  identity, simulation, throttle, presence publishing, MapLibre setup),
  `src/features/challenge/api.ts` / `rewards.ts`, `src/features/progression/storage.ts`, or `server/`.
- Screen files may change **JSX and styles only**. New presentational components
  receive already-computed values as props. No new state, effects, or API calls.
- Keep the `App.tsx` behaviour that keeps `MapScreen` mounted while the challenge screen is open.
- Each step must pass `npm run typecheck && npm run lint && npm test`, plus a
  simulator check. Challenge steps also need a two-device run (Test Player A/B).

| Phase | Scope | Deps / rebuild | Exit check |
| --- | --- | --- | --- |
| **0. Tokens + primitives** | `src/theme/tokens.ts`; `Button`, `IconButton`, `Card`, `ScreenHeader`, `Pill`, `StatRow`, `ProgressBar`, `QualityBar`, `StepIndicator`, `AvatarDisplay` (placeholder). Re-point `ui.tsx` `Action`/`Card`/`styles` at tokens so existing screens pick them up. | None. Metro reload | All screens still render; tests green |
| **1. Home shell** | Light theme (`StatusBar` `dark-content`); home HUD (avatar placeholder, display name, OVR pill, coins pill); `BottomNav` (Progress · Map/Workout · Profile) wired to the existing `setScreen`; home CTAs restyled. | None. `app.json` `userInterfaceStyle: "light"` is native config: batch it into the Phase 3 rebuild | Navigate to every screen and back; map presence still survives the challenge screen |
| **2a. Map → challenge entry** | Map card container and header; `PlayerPopover`-style selected-opponent card; nearby count; dev cards collapsed. Marker restyle limited to `View`-based pills. | None | Tap a nearby user, see the popover, open the challenge screen with that opponent |
| **2b. Challenge setup** | `ChallengeCard` for nearby, incoming and outgoing; `VsBanner` on `accepted`; `ConfigStepperRow` cards; acceptance chips; start CTA; error card. | None | Two devices: send → accept → change config (acceptance resets) → both accept → start |
| **2c. Workout camera chrome** | `StepIndicator`, timer (red ≤ 10 s), rep chip, score chip, latest-attempt quality label, framed `CameraPreview`, countdown and rest cards, collapsible dev readout; `PoseOverlay` colours only. | None | Solo and challenge sessions run; reps and timer unchanged |
| **2d. Results panel** | Presentational `ResultsPanel` with `ResultHeadline`, `StatRow`, `QualityBar`, rewards rows, retry buttons; every state in §2. | None | Solo save; challenge win/lose/draw; no-show cancel; forced error → retry |
| **3. Art (rebuild)** | `npx expo install react-native-svg`; port `CharacterSprite` + gear + flame/star/nav icons; swap `AvatarDisplay` placeholder; apply `app.json` light mode. **Rebuild the dev client on all devices.** | `react-native-svg`, native rebuild | Avatar renders on iOS and Android, masks correct, no filter crashes |
| **4. Typography** | `expo-font` + Nunito; apply type tokens. | JS deps (verify no rebuild needed) | Fonts load before first paint (splash hold) |
| **5. Polish** | Map avatar markers, Animated pop-in / VS slide / bobble, result confetti. | None | Performance OK with camera and map |
| **6. Profile / progression** | Profile hero with real OVR/XP/coins; progress toward next OVR; later calendar, streak and leaderboards as those features ship. | None | Matches stored `PlayerState` |

Phases 0 → 2d deliver the home shell plus one complete styled challenge flow
(map → challenge → camera → result) without any native rebuild.

## 7. Unfinished or likely-to-change areas

| Area | Marker | Evidence |
| --- | --- | --- |
| S7 Calendar + session chart | ⚠️ **UNFINISHED / blocked** | All mock data (Sept 2026, "4 Day Streak", Strength/Cardio/Mobility series). Weekly target, streak and last-workout persistence are not implemented in RN (`IMPLEMENTATION_PLAN.md`). |
| S8 Leaderboards, friends, requests, friend profile | ⚠️ **UNFINISHED / deferred** | Hard-coded "Dallas" lists; add-friend and requests are no-ops. Advanced leaderboards and production auth are planned only. There is no friends backend. |
| S9 Shop + edit avatar | ⚠️ **UNFINISHED / likely to change** | "Browse All" and the edit pen do nothing; items owned by nobody. Shops are deferred in the repo plan. Avatar customisation has no storage. |
| S9 hero data (city rank, @handle, Lvl, BP, W/L) | ⚠️ **Likely to change** | RN has `displayName` "Demo athlete", OVR 60–99, XP and coins. No level, handle, rank or win/loss totals. |
| S4 Battle goals | ⚠️ **Likely to change** | Offers push-ups, jumping jacks and lunges, but only bodyweight squats are tracked. There are no sets/reps/rest/time fields and no dual acceptance, all of which the RN challenge already has. Use its card style, not its content. |
| S3 VS screen | ⚠️ **Recently changed** | Screenshots show a dark purple "Warden" version; code is a light diagonal red/blue split. Expect more iteration. |
| S5 Competition progress bar (opponent track) | ⚠️ **Not supported by backend** | The opponent series is simulated. The server only receives results at the end, so live opponent progress needs an API change. Ship user-only segments. |
| S5 Skeleton overlay | ℹ️ Decorative | Static figure, not landmark-driven. |
| S6 Result | ⚠️ **UNFINISHED** | Always "VICTORY!" with hard-coded "+24 BP / +50 BP / +1 EXP". Needs defeat, draw, cancelled and pending states and real `BATTLE_REWARDS` values. |
| S2 Streak strip | ⚠️ **Placeholder data** | Progress fixed at 55 %, two flames hard-coded. Render only when streak data exists. |
| S2 Popover "Add Friend", `ProfileChip` | ℹ️ No-op / unused | No friends feature; `ProfileChip` is never rendered. |
| S2 Illustrated map background | ❌ **Will not be used** | Replaced by the real MapLibre map. |
| Imported `GameAppDesignOverview*`, `Container` frames and screenshots | ❌ **Superseded** | Older iterations (archetypes removed). |

## Open decisions for the team

1. **Theme:** adopt Figma's light theme (app is currently dark: `#101713`, `userInterfaceStyle: "dark"`)? This plan assumes yes.
2. **Naming:** Figma "BP" is a spendable currency; in the repo, *coins* are currency
   and *battle points* are per-match score. Pick the labels before building pills.
3. **"Lvl" vs OVR:** show OVR (60–99) in level pills, or add a level concept?
4. **City label:** Figma says Dallas; the demo location is Houston.
5. **Neutral rep colour** (not in Figma): proposed `#9aaac4`.
6. **When to take the native rebuild** for `react-native-svg` (and `app.json` light mode).
