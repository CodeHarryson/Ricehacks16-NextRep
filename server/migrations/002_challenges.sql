CREATE TABLE IF NOT EXISTS challenges (
  challenge_id UUID PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  sender_display_name TEXT NOT NULL CHECK (char_length(sender_display_name) BETWEEN 1 AND 80),
  receiver_display_name TEXT NOT NULL CHECK (char_length(receiver_display_name) BETWEEN 1 AND 80),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  proximity_meters DOUBLE PRECISION NOT NULL CHECK (proximity_meters >= 0)
);

CREATE INDEX IF NOT EXISTS challenges_sender_idx ON challenges (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS challenges_receiver_idx ON challenges (receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS challenges_expiry_idx ON challenges (expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS challenges_pending_pair_unique_idx
  ON challenges (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id))
  WHERE status = 'pending';
