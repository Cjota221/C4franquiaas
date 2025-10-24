-- ============================================================================
-- MIGRATION 016: Barra do Topo - campos de personalização
-- ============================================================================
BEGIN;

-- Adiciona campos para personalizar a régua/barra do topo (cor, cor do texto, tamanho da fonte e velocidade)
ALTER TABLE lojas
ADD COLUMN IF NOT EXISTS barra_topo_cor VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS barra_topo_texto_cor VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS barra_topo_font_size INTEGER DEFAULT 14,
ADD COLUMN IF NOT EXISTS barra_topo_speed INTEGER DEFAULT 50;

COMMIT;

-- ✅ Migration 016 concluída
