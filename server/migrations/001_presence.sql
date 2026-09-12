CREATE EXTENSION IF NOT EXISTS postgis;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS timescaledb;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'TimescaleDB extension unavailable; continuing without it';
END
$$;

CREATE TABLE IF NOT EXISTS presence_events (
  event_id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 80),
  captured_at TIMESTAMPTZ NOT NULL,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  accuracy_meters DOUBLE PRECISION NOT NULL CHECK (accuracy_meters >= 0 AND accuracy_meters <= 10000),
  expires_at TIMESTAMPTZ NOT NULL,
  location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS
    (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED
);

CREATE INDEX IF NOT EXISTS presence_events_user_id_idx ON presence_events (user_id);
CREATE INDEX IF NOT EXISTS presence_events_captured_at_idx ON presence_events (captured_at DESC);
CREATE INDEX IF NOT EXISTS presence_events_expires_at_idx ON presence_events (expires_at);
CREATE INDEX IF NOT EXISTS presence_events_location_gist_idx ON presence_events USING GIST (location);

-- Timescale requires every unique index on a hypertable to include its time key.
DO $$
BEGIN
  ALTER TABLE presence_events DROP CONSTRAINT IF EXISTS presence_events_pkey;
  ALTER TABLE presence_events ADD CONSTRAINT presence_events_pkey PRIMARY KEY (event_id, captured_at);
EXCEPTION WHEN duplicate_object THEN
  NULL;
END
$$;

DO $$
BEGIN
  PERFORM create_hypertable('presence_events', 'captured_at', if_not_exists => TRUE);
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'TimescaleDB is unavailable; presence_events remains a regular PostgreSQL table';
END
$$;
