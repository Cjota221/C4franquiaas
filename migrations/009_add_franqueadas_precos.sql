-- ============================================================================
-- Migration 009: Add produtos_franqueadas_precos for custom pricing
-- ============================================================================
-- Description: Allows franqueadas to customize product prices and control visibility
-- Author: GitHub Copilot
-- Date: 2025-10-21
-- ============================================================================

-- Create table for franqueada-specific product pricing
CREATE TABLE IF NOT EXISTS produtos_franqueadas_precos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_franqueada_id UUID NOT NULL REFERENCES produtos_franqueadas(id) ON DELETE CASCADE,
  preco_base DECIMAL(10,2) NOT NULL,           -- Admin's base price
  ajuste_tipo VARCHAR(20),                      -- 'fixo' or 'porcentagem'
  ajuste_valor DECIMAL(10,2),                   -- Adjustment value
  preco_final DECIMAL(10,2) NOT NULL,           -- Calculated final price
  ativo_no_site BOOLEAN DEFAULT false,          -- Active on franqueada's site
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(produto_franqueada_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_produtos_franqueadas_precos_produto ON produtos_franqueadas_precos(produto_franqueada_id);
CREATE INDEX IF NOT EXISTS idx_produtos_franqueadas_precos_ativo ON produtos_franqueadas_precos(ativo_no_site);

-- Add RLS policies
ALTER TABLE produtos_franqueadas_precos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the table was created:
--
-- SELECT * FROM produtos_franqueadas_precos LIMIT 1;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'produtos_franqueadas_precos';
-- ============================================================================
