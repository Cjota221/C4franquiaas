-- ============================================
-- 🔥 SOLUÇÃO FINAL: DROPAR AS FUNÇÕES DOS TRIGGERS
-- ============================================
-- Os triggers chamam funções PL/pgSQL que estão bugadas
-- Precisamos DROPAR AS FUNÇÕES, não os triggers!
-- ============================================

-- DROPAR FUNÇÕES BUGADAS
DROP FUNCTION IF EXISTS notificar_revendedoras_produtos_novos() CASCADE;
DROP FUNCTION IF EXISTS auto_vincular_produto_revendedoras() CASCADE;

-- CASCADE vai remover automaticamente os triggers que usam essas funções
-- ============================================

-- AGORA SIM FAZER O UPDATE
UPDATE produtos
SET 
  ativo = true,
  ultima_sincronizacao = NOW()
WHERE 
  estoque > 0 
  AND ativo = false;

-- VERIFICAR RESULTADO
SELECT 
  COUNT(*) FILTER (WHERE ativo = true AND estoque > 0) as produtos_corrigidos,
  COUNT(*) FILTER (WHERE ativo = false AND estoque > 0) as ainda_bugados
FROM produtos;

-- ✅ AGORA VAI FUNCIONAR!
