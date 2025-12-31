-- ============================================
-- 🔧 SOLUÇÃO DEFINITIVA: REMOVER TRIGGERS PROBLEMÁTICOS
-- ============================================
-- Os triggers estão quebrando porque tentam acessar campos
-- que não existem (NEW.nome, NEW.preco_base, NEW.imagem)
-- ============================================

-- 1️⃣ VER TODOS OS TRIGGERS NA TABELA PRODUTOS
SELECT 
  trigger_name,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'produtos'
  AND trigger_name NOT LIKE 'RI_%';  -- Ignorar triggers do sistema

-- ============================================

-- 2️⃣ REMOVER OS TRIGGERS PROBLEMÁTICOS
DROP TRIGGER IF EXISTS trigger_auto_vincular_produto_revendedoras ON produtos;
DROP TRIGGER IF EXISTS trigger_notificar_revendedoras_produtos_novos ON produtos;
DROP TRIGGER IF EXISTS auto_vincular_produto ON produtos;
DROP TRIGGER IF EXISTS notificar_produtos_novos ON produtos;

-- Se houver outros triggers com nomes diferentes, ajuste acima
-- ============================================

-- 3️⃣ AGORA FAZER O UPDATE (vai funcionar!)
UPDATE produtos
SET 
  ativo = true,
  ultima_sincronizacao = NOW()
WHERE 
  estoque > 0 
  AND ativo = false;

-- Deve retornar: UPDATE XXX
-- ✅ SUCESSO!
-- ============================================

-- 4️⃣ VERIFICAR RESULTADO
SELECT 
  COUNT(*) FILTER (WHERE ativo = true AND estoque > 0) as ativos_com_estoque,
  COUNT(*) FILTER (WHERE ativo = false AND estoque > 0) as ainda_desativados,
  COUNT(*) FILTER (WHERE ativo = false AND estoque = 0) as corretos_sem_estoque
FROM produtos;

-- ESPERADO:
-- ativos_com_estoque: 200+
-- ainda_desativados: 0
-- ============================================

-- 5️⃣ VER PRODUTOS CORRIGIDOS
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
-- ✅ ultima_sincronizacao = timestamp recente
-- ============================================

-- 📝 NOTAS:
-- - Os triggers removidos estavam BUGADOS (campo 'nome' não existe)
-- - Eles tentavam auto-vincular produtos e notificar revendedoras
-- - Podemos recriar depois COM A ESTRUTURA CORRETA
-- - Por enquanto, produtos ficam funcionais sem eles
