-- ================================================
-- Migration 025: Adicionar Configurações de Frete
-- ================================================
-- Descrição: Adiciona colunas para configuração de frete grátis
-- Autor: Sistema
-- Data: 2025-10-30
-- ================================================

-- 1. Adicionar colunas de frete na tabela lojas
ALTER TABLE lojas
ADD COLUMN IF NOT EXISTS frete_gratis_valor NUMERIC(10,2) DEFAULT 150.00,
ADD COLUMN IF NOT EXISTS valor_frete NUMERIC(10,2) DEFAULT 15.90;

-- 2. Comentários explicativos
COMMENT ON COLUMN lojas.frete_gratis_valor IS 'Valor mínimo de compra para frete grátis (em reais)';
COMMENT ON COLUMN lojas.valor_frete IS 'Valor padrão do frete (em reais)';

-- 3. Atualizar lojas existentes com valores padrão (caso sejam NULL)
UPDATE lojas
SET 
  frete_gratis_valor = 150.00,
  valor_frete = 15.90
WHERE frete_gratis_valor IS NULL OR valor_frete IS NULL;

-- ================================================
-- Verificação
-- ================================================
-- SELECT id, dominio, frete_gratis_valor, valor_frete FROM lojas;
