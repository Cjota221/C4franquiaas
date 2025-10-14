-- Migration: add imagens jsonb column to produtos
-- Run this in Supabase SQL editor or via psql using a service role key

BEGIN;

ALTER TABLE IF EXISTS produtos
  ADD COLUMN IF NOT EXISTS imagens jsonb DEFAULT '[]'::jsonb;

COMMIT;

-- After running this migration you can re-run the sync to persist all images.