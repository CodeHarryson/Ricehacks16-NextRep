# Proximity challenges

Proximity challenges, shared bodyweight-squat configuration, and challenge-aware
camera sessions are implemented. The server calculates proximity with PostGIS and
returns only an approximate distance; it never sends another user's raw coordinates
to the mobile app.

Challenge scoring uses `score-v1`. Participant results are submitted, validated, and
resolved by the server. Once resolution is confirmed, `battle-reward-v1` grants the
winner, loser, or draw reward locally using an idempotent key. Battle rewards are a
separate system from permanent OVR and never change OVR.

If only one participant submits by the deadline, the server cancels the challenge
for an opponent no-show. Cancelled challenges have no winner, score, or rewards;
late submissions cannot reopen them.

The generated local `demo-*` identity and `x-user-id` headers are demo-only and are
not production authentication or access control. Production authentication,
advanced leaderboards, and richer shops remain planned.
