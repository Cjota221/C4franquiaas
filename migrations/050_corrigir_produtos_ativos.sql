-- ============================================
-- Migration 050: Corrigir Produtos Ativos
-- ============================================
-- Descrição: A migration 049 pode ter desativado produtos que já estavam ativos
-- Esta migration restaura o status ativo dos produtos que:
-- 1. Já foram aprovados pelo admin
-- 2. Têm estoque > 0
-- 3. Não foram desativados manualmente
-- Data: 2025-12-31
-- ============================================

-- Restaurar produtos ativos que foram aprovados e têm estoque
UPDATE produtos
SET ativo = true
WHERE admin_aprovado = true
  AND estoque > 0
  AND (desativado_manual IS NULL OR desativado_manual = false)
  AND ativo = false;

-- Verificação
DO $$
DECLARE
  v_count_ativos INTEGER;
  v_count_aprovados INTEGER;
BEGIN
  -- Contar produtos ativos
  SELECT COUNT(*) INTO v_count_ativos
  FROM produtos
  WHERE ativo = true;
  
  -- Contar produtos aprovados
  SELECT COUNT(*) INTO v_count_aprovados
  FROM produtos
  WHERE admin_aprovado = true;
  
  RAISE NOTICE '✅ Migration 050 aplicada!';
  RAISE NOTICE '📊 Produtos ativos: %', v_count_ativos;
  RAISE NOTICE '✅ Produtos aprovados: %', v_count_aprovados;
END $$;

-- ============================================
-- 🚀 EXECUTE ESTE SQL NO SUPABASE IMEDIATAMENTE
-- ============================================
