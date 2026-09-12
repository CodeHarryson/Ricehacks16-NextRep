ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS winner_id TEXT,
  ADD COLUMN IF NOT EXISTS resolution_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS winning_score INTEGER;

CREATE TABLE IF NOT EXISTS challenge_participant_results (
  result_id UUID PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES challenges(challenge_id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,
  config_version INTEGER NOT NULL,
  exercise TEXT NOT NULL,
  counted_reps INTEGER NOT NULL,
  green_reps INTEGER NOT NULL,
  yellow_reps INTEGER NOT NULL,
  red_attempts INTEGER NOT NULL,
  neutral_attempts INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  score_policy_version TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idempotency_key TEXT NOT NULL UNIQUE,
  UNIQUE (challenge_id, participant_id)
);
CREATE INDEX IF NOT EXISTS challenge_results_challenge_idx ON challenge_participant_results (challenge_id);
