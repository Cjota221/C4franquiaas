-- Migration 013: Adicionar campos de personalização da loja
-- Data: 2025-10-22
-- Descrição: Campos para Hero Section, SEO, Analytics, Configurações

BEGIN;

-- Adicionar campos de Hero Section
ALTER TABLE lojas
  ADD COLUMN IF NOT EXISTS banner_hero TEXT,
  ADD COLUMN IF NOT EXISTS texto_hero TEXT,
  ADD COLUMN IF NOT EXISTS subtexto_hero TEXT;

-- Adicionar campos de Identidade
ALTER TABLE lojas
  ADD COLUMN IF NOT EXISTS slogan TEXT,
  ADD COLUMN IF NOT EXISTS favicon TEXT;

-- Adicionar campos de Configurações
ALTER TABLE lojas
  ADD COLUMN IF NOT EXISTS mostrar_codigo_barras BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS permitir_carrinho BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS modo_catalogo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS mensagem_whatsapp TEXT DEFAULT 'Olá! Gostaria de saber mais sobre este produto:';

-- Comentários para documentação
COMMENT ON COLUMN lojas.banner_hero IS 'URL da imagem de fundo do hero da home';
COMMENT ON COLUMN lojas.texto_hero IS 'Título principal do hero';
COMMENT ON COLUMN lojas.subtexto_hero IS 'Subtítulo/descrição do hero';
COMMENT ON COLUMN lojas.slogan IS 'Slogan da loja (usado no footer)';
COMMENT ON COLUMN lojas.favicon IS 'URL do favicon da loja';
COMMENT ON COLUMN lojas.mostrar_codigo_barras IS 'Exibir código de barras na PDP';
COMMENT ON COLUMN lojas.permitir_carrinho IS 'Habilitar funcionalidade de carrinho';
COMMENT ON COLUMN lojas.modo_catalogo IS 'Modo catálogo (desabilita carrinho, botão vira WhatsApp)';
COMMENT ON COLUMN lojas.mensagem_whatsapp IS 'Mensagem padrão para WhatsApp';

-- Definir valores padrão para lojas existentes
UPDATE lojas 
SET 
  texto_hero = COALESCE(texto_hero, nome),
  subtexto_hero = COALESCE(subtexto_hero, descricao),
  mensagem_whatsapp = COALESCE(mensagem_whatsapp, 'Olá! Gostaria de saber mais sobre este produto:')
WHERE texto_hero IS NULL OR subtexto_hero IS NULL OR mensagem_whatsapp IS NULL;

COMMIT;
