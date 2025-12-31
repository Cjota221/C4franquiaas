-- ============================================
-- 🔧 CORREÇÃO URGENTE: ATIVAR PRODUTOS COM ESTOQUE
-- ============================================
-- PROBLEMA: Produtos com estoque = 11 mas ativo = false
-- CAUSA: Nunca foram sincronizados (ultima_sincronizacao = null)
-- SOLUÇÃO: Ativar todos produtos que têm estoque
-- ============================================

-- 1️⃣ VER O PROBLEMA (antes de corrigir)
SELECT 
  COUNT(*) as total_produtos_com_estoque_desativados
FROM produtos
WHERE estoque > 0 
  AND ativo = false;

-- Deve retornar um número alto (ex: 200+)
-- ============================================


-- 2️⃣ CORRIGIR: Ativar produtos com estoque
UPDATE produtos
SET 
  ativo = true,
  ultima_sincronizacao = NOW()
WHERE 
  estoque > 0 
  AND ativo = false;

-- ✅ Isso vai ativar TODOS os produtos que têm estoque
-- ============================================


-- 3️⃣ VERIFICAR SE CORRIGIU
SELECT 
  COUNT(*) as total_ativos_com_estoque,
  'Produtos agora disponíveis nos sites' as status
FROM produtos
WHERE estoque > 0 
  AND ativo = true;

-- ============================================


-- 4️⃣ VER EXEMPLOS DE PRODUTOS CORRIGIDOS
SELECT 
  id,
  nome,
  estoque,
  ativo,
  ultima_sincronizacao
FROM produtos
WHERE estoque > 0
ORDER BY ultima_sincronizacao DESC
LIMIT 20;

-- Agora deve mostrar:
-- ✅ ativo = true
-- ✅ ultima_sincronizacao = agora
-- ============================================


-- 📝 NOTAS IMPORTANTES:
-- - Esta query ativa APENAS produtos com estoque > 0
-- - Produtos sem estoque permanecem inativos (correto)
-- - Após executar, produtos aparecerão nos sites IMEDIATAMENTE
-- - Se tiver Realtime ativo, sites atualizam em 1-2 segundos
-- - Se não tiver, clientes precisam dar F5
