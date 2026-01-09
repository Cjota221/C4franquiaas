-- ============================================================================
-- Migration 049: Adicionar Margem Padrão para Revendedora Pro
-- ============================================================================
-- Description: Adiciona campo margem_padrao na tabela lojas
--              Produtos novos já vêm com essa margem aplicada automaticamente
-- Date: 2025-01-09
-- ============================================================================

-- STEP 1: Adicionar coluna margem_padrao (SEM valor padrão - revendedora escolhe)
ALTER TABLE lojas 
ADD COLUMN IF NOT EXISTS margem_padrao DECIMAL(5,2) DEFAULT NULL;

-- STEP 2: Comentário explicativo
COMMENT ON COLUMN lojas.margem_padrao IS 'Margem de lucro padrão (%) aplicada automaticamente em produtos novos. NULL = revendedora precisa configurar';

-- ============================================================================
-- ✅ APLICADO COM SUCESSO
-- ============================================================================
