-- Migration 004: Add codigo_barras and ensure variacoes_meta exists
-- Run this in Supabase SQL editor or via your migration tool

BEGIN;

-- Ensure variacoes_meta (JSONB) exists (safe to run if previous migration already added it)
ALTER TABLE IF EXISTS produtos
  ADD COLUMN IF NOT EXISTS variacoes_meta jsonb DEFAULT '[]'::jsonb;

-- Add a top-level codigo_barras column to store the primary barcode (first found)
ALTER TABLE IF EXISTS produtos
  ADD COLUMN IF NOT EXISTS codigo_barras text;

-- Index the codigo_barras column for fast lookups (partial index when not null)
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras 
  ON produtos(codigo_barras) 
  WHERE codigo_barras IS NOT NULL;

COMMIT;
