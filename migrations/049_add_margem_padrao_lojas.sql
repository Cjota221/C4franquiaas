-- ============================================================================
-- Migration 049: Adicionar Margem Padrão para Revendedora Pro
-- ============================================================================
-- Description: Adiciona campo margem_padrao na tabela lojas
--              Produtos novos já vêm com essa margem aplicada automaticamente
-- Date: 2025-01-09
-- ============================================================================

-- STEP 1: Adicionar coluna margem_padrao
ALTER TABLE lojas 
ADD COLUMN IF NOT EXISTS margem_padrao DECIMAL(5,2) DEFAULT 70.00;

-- STEP 2: Comentário explicativo
COMMENT ON COLUMN lojas.margem_padrao IS 'Margem de lucro padrão (%) aplicada automaticamente em produtos novos';

-- STEP 3: Atualizar lojas existentes para margem padrão de 70%
UPDATE lojas 
SET margem_padrao = 70.00 
WHERE margem_padrao IS NULL;

-- ============================================================================
-- ✅ APLICADO COM SUCESSO
-- ============================================================================
