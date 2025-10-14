-- Migration: add last_synced_at timestamptz column to produtos
-- Run this in Supabase SQL editor or via psql using a service role key

BEGIN;

ALTER TABLE IF EXISTS produtos
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

COMMIT;

-- After running this migration the sync process will populate last_synced_at for upserted rows.