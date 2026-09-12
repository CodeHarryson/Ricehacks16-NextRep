ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS exercise TEXT NOT NULL DEFAULT 'bodyweight_squat',
  ADD COLUMN IF NOT EXISTS set_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS target_reps INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS rest_seconds INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS match_time_limit_seconds INTEGER NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS config_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sender_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receiver_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_status_check;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'challenges_status_check') THEN
    ALTER TABLE challenges ADD CONSTRAINT challenges_status_check
      CHECK (status IN ('pending', 'accepted', 'configuring', 'ready', 'active', 'declined', 'expired', 'cancelled'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'challenges_config_bounds_check') THEN
    ALTER TABLE challenges ADD CONSTRAINT challenges_config_bounds_check CHECK (
      exercise = 'bodyweight_squat' AND set_count BETWEEN 1 AND 3 AND target_reps BETWEEN 1 AND 50
      AND rest_seconds BETWEEN 0 AND 300 AND match_time_limit_seconds BETWEEN 30 AND 1800 AND config_version >= 1
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS challenges_status_expiry_idx ON challenges (status, expires_at);
