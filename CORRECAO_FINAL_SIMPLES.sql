-- ============================================
-- 🔧 CORREÇÃO DEFINITIVA: REMOVER TRIGGERS + UPDATE
-- ============================================
-- IMPORTANTE: Execute TUDO de uma vez!
-- ============================================

-- PASSO 1: REMOVER TRIGGERS BUGADOS (OBRIGATÓRIO!)
-- ============================================
DROP TRIGGER IF EXISTS trigger_auto_vincular_produto_revendedoras ON produtos;
DROP TRIGGER IF EXISTS trigger_notificar_revendedoras_produtos_novos ON produtos;
DROP TRIGGER IF EXISTS auto_vincular_produto ON produtos;
DROP TRIGGER IF EXISTS notificar_produtos_novos ON produtos;
DROP TRIGGER IF EXISTS auto_vincular_produto_revendedoras ON produtos;
DROP TRIGGER IF EXISTS notificar_revendedoras_produtos_novos ON produtos;

-- PASSO 2: FAZER O UPDATE (agora vai funcionar!)
-- ============================================
UPDATE produtos
SET 
  ativo = true,
  ultima_sincronizacao = NOW()
WHERE 
  estoque > 0 
  AND ativo = false;

-- PASSO 3: VERIFICAR RESULTADO
-- ============================================
SELECT 
  COUNT(*) FILTER (WHERE ativo = true AND estoque > 0) as produtos_corrigidos,
  COUNT(*) FILTER (WHERE ativo = false AND estoque > 0) as ainda_bugados,
  COUNT(*) FILTER (WHERE ativo = false AND estoque = 0) as corretos_sem_estoque
FROM produtos;

-- ESPERADO:
-- produtos_corrigidos: 200+
-- ainda_bugados: 0
-- corretos_sem_estoque: número qualquer (OK)
-- ============================================

-- PASSO 4: VER EXEMPLOS DE PRODUTOS CORRIGIDOS
-- ============================================
SELECT 
  id,
  nome,
  estoque,
  ativo,
  ultima_sincronizacao
FROM produtos
WHERE estoque > 0
ORDER BY ultima_sincronizacao DESC NULLS LAST
LIMIT 10;

-- ESPERADO:
-- ✅ ativo = true
-- ✅ ultima_sincronizacao = timestamp recente (não null)
-- ============================================
