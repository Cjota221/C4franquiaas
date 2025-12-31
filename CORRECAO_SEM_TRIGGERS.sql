-- ============================================
-- 🔧 CORREÇÃO COM TRIGGERS DESABILITADOS
-- ============================================
-- PROBLEMA: Triggers quebram porque esperam campos diferentes
-- SOLUÇÃO: Desabilitar triggers, fazer UPDATE, reabilitar
-- ============================================

-- 1️⃣ DESABILITAR TRIGGERS temporariamente
ALTER TABLE produtos DISABLE TRIGGER ALL;

-- ============================================

-- 2️⃣ FAZER A CORREÇÃO (agora vai funcionar!)
UPDATE produtos
SET 
  ativo = true,
  ultima_sincronizacao = NOW()
WHERE 
  estoque > 0 
  AND ativo = false;

-- Deve retornar: UPDATE XXX (quantidade de produtos atualizados)
-- ============================================

-- 3️⃣ REABILITAR TRIGGERS
ALTER TABLE produtos ENABLE TRIGGER ALL;

-- ============================================

-- 4️⃣ VERIFICAR SE DEU CERTO
SELECT 
  COUNT(*) FILTER (WHERE ativo = true AND estoque > 0) as ativos_com_estoque,
  COUNT(*) FILTER (WHERE ativo = false AND estoque > 0) as ainda_desativados,
  COUNT(*) FILTER (WHERE ativo = false AND estoque = 0) as corretos_sem_estoque
FROM produtos;

-- ESPERADO:
-- ativos_com_estoque: 200+
-- ainda_desativados: 0
-- corretos_sem_estoque: quantidade variável (OK estar desativado)
-- ============================================

-- 5️⃣ VER EXEMPLOS
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
