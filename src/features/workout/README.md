# Workout ownership

UI/audio owner: WorkoutScreen and components. Later render completed AttemptResult
events with both text and color; optional audio cues must follow those same events.
Do not request microphone access to play audio. Audio is not implemented yet.

Controller/storage owner: controller.ts and progression. The controller owns stable
session/set IDs, five-rep capped totals, attempt-key and attempt-ID deduplication,
and the one-time completion event. WorkoutScreen sends every completed analyzer
attempt to it; continuous frames and tracking updates never receive rewards.
Challenge-aware camera navigation, synchronized countdown/deadline sessions,
multi-set accounting, rest periods, `score-v1` scoring, and result finalization
for both completed and timed-out sessions are implemented. Solo performance
records are persisted locally; challenge results are server-validated and
idempotently submitted. Battle rewards, advanced leaderboards, and richer
performance synchronization remain planned. Demo header identity is not
production authentication.

Progression serializes AsyncStorage read-modify-write operations. A completed set
uses deterministic completion/reward IDs and saves XP, OVR, coins, completed-workout
and processed-reward IDs in one record before the UI reports success. A failed save
stays retryable with the same IDs; duplicate delivery or reload cannot grant twice.
Do not prune IDs while events can be replayed.

Squat owner: implement the pure engine in ../squat. Green means preferred completion
(+1); yellow means minimum completion (+1); red is an assessable partial attempt
below minimum (+0); neutral is unassessable (+0). End the observed attempt before
rating. Tracking loss invalidates only the in-progress attempt and requires a fresh
start; it must not erase completed totals. Calibrate a versioned gameplay rubric
later; this scaffold contains no posture thresholds.

Tracking owner: ../tracking owns permission, preview, native lifecycle, model and
normalization. PoseFrame and continuous TrackingUpdate are separate from completed
AttemptResult events. Never turn a detector error into a red attempt.
