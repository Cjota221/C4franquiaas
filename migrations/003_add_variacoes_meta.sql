-- migration: add variacoes_meta jsonb column to store per-variation overrides (barcode, estoque)
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS variacoes_meta jsonb DEFAULT '[]'::jsonb;
