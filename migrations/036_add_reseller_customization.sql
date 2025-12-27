-- ============================================================================
-- Migration 036: Campos de Personalização para Revendedoras
-- ============================================================================
-- Description: Adiciona campos extras de personalização para o catálogo
-- Date: 2025-12-27

-- Adicionar campos de personalização
ALTER TABLE resellers 
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{
  "button_style": "rounded",
  "card_style": "shadow",
  "header_style": "gradient",
  "show_prices": true,
  "show_stock": false,
  "show_whatsapp_float": true
}'::jsonb;

-- Comentários explicativos
COMMENT ON COLUMN resellers.banner_url IS 'URL da imagem do banner principal';
COMMENT ON COLUMN resellers.instagram IS 'Username do Instagram (sem @)';
COMMENT ON COLUMN resellers.facebook IS 'URL ou username do Facebook';
COMMENT ON COLUMN resellers.bio IS 'Descrição curta da loja';
COMMENT ON COLUMN resellers.theme_settings IS 'Configurações de tema: button_style (rounded/square), card_style (shadow/flat/bordered), header_style (gradient/solid/transparent), etc';

-- Atualizar registros existentes com theme_settings padrão
UPDATE resellers 
SET theme_settings = '{
  "button_style": "rounded",
  "card_style": "shadow",
  "header_style": "gradient",
  "show_prices": true,
  "show_stock": false,
  "show_whatsapp_float": true
}'::jsonb
WHERE theme_settings IS NULL;
