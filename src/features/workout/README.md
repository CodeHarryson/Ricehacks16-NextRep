# Workout ownership

UI/audio owner: WorkoutScreen and components. Later render completed AttemptResult
events with both text and color; optional audio cues must follow those same events.
Do not request microphone access to play audio. Audio is not implemented yet.

Controller/storage owner: controller.ts and progression. Own session/set IDs, five-rep
sets, rest, totals, XP policy, upgrades and persistence. acceptAttempt establishes
in-memory deduplication; it is not connected to a detector or reward system.

Before adding rewards: hydrate the persisted processedAttemptKeys, serialize event
processing, validate runtime events, and save XP plus the dedup key in one player
record before showing success. On failed persistence, keep the event pending and
retry the same ID; never award again. AsyncStorage is not a multi-writer transaction
store: use one controller writer. Do not prune keys while events can be replayed.

Squat owner: implement the pure engine in ../squat. Green means preferred completion
(+1); yellow means minimum completion (+1); red is an assessable partial attempt
below minimum (+0); neutral is unassessable (+0). End the observed attempt before
rating. Tracking loss invalidates only the in-progress attempt and requires a fresh
start; it must not erase completed totals. Calibrate a versioned gameplay rubric
later; this scaffold contains no posture thresholds.

Tracking owner: ../tracking owns permission, preview, native lifecycle, model and
normalization. PoseFrame and continuous TrackingUpdate are separate from completed
AttemptResult events. Never turn a detector error into a red attempt.
