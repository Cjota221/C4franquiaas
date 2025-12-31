-- ============================================
-- 🚨 COPIE E COLE TUDO DE UMA VEZ!
-- ============================================
-- Este SQL faz TUDO: remove triggers E corrige produtos
-- ============================================

-- PASSO 1: Remover triggers bugados
DROP TRIGGER IF EXISTS trigger_auto_vincular_produto_revendedoras ON produtos;
DROP TRIGGER IF EXISTS trigger_notificar_revendedoras_produtos_novos ON produtos;
DROP TRIGGER IF EXISTS auto_vincular_produto ON produtos;
DROP TRIGGER IF EXISTS notificar_produtos_novos ON produtos;
DROP TRIGGER IF EXISTS auto_vincular_produto_revendedoras ON produtos;
DROP TRIGGER IF EXISTS notificar_revendedoras_produtos_novos ON produtos;

-- PASSO 2: Corrigir produtos
UPDATE produtos
SET 
  ativo = true,
  ultima_sincronizacao = NOW()
WHERE 
  estoque > 0 
  AND ativo = false;

-- PASSO 3: Verificar resultado
SELECT 
  COUNT(*) FILTER (WHERE ativo = true AND estoque > 0) as produtos_corrigidos,
  COUNT(*) FILTER (WHERE ativo = false AND estoque > 0) as ainda_bugados
FROM produtos;

-- ✅ DEVE RETORNAR:
-- produtos_corrigidos: 200+
-- ainda_bugados: 0
