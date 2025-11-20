-- ============================================
-- 🔍 QUERIES BÁSICAS - GARANTIDO QUE FUNCIONA
-- ============================================
-- Apenas queries que usam colunas que SABEMOS que existem

-- ============================================
-- 1️⃣ VER ESTRUTURA DA TABELA produtos
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'produtos'
ORDER BY ordinal_position;

-- ============================================
-- 2️⃣ VER ESTRUTURA DA TABELA logs_sincronizacao
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'logs_sincronizacao'
ORDER BY ordinal_position;

-- ============================================
-- 3️⃣ ÚLTIMOS PRODUTOS (10 MAIS RECENTES POR ID)
-- ============================================
SELECT 
  id,
  nome,
  estoque,
  preco_base,
  ativo
FROM produtos
ORDER BY id DESC
LIMIT 10;

-- ============================================
-- 4️⃣ VERIFICAR TIPO DE DADOS DO ESTOQUE
-- ============================================
SELECT 
  id,
  nome,
  estoque,
  pg_typeof(estoque) as tipo_de_dado
FROM produtos
WHERE id IS NOT NULL
LIMIT 5;

-- ✅ CRÍTICO: Deve mostrar 'integer' ou 'numeric'
-- ❌ Se mostrar 'text' ou outro tipo: normalizeEstoque() não foi aplicado

-- ============================================
-- 5️⃣ ESTATÍSTICAS BÁSICAS DE PRODUTOS
-- ============================================
SELECT 
  COUNT(*) as total_produtos,
  COUNT(CASE WHEN estoque > 0 THEN 1 END) as com_estoque,
  COUNT(CASE WHEN estoque = 0 THEN 1 END) as sem_estoque,
  COUNT(CASE WHEN ativo = true THEN 1 END) as ativos,
  COUNT(CASE WHEN ativo = false THEN 1 END) as inativos
FROM produtos;

-- ============================================
-- 6️⃣ PRODUTOS COM MAIOR ESTOQUE
-- ============================================
SELECT 
  id,
  nome,
  estoque,
  preco_base
FROM produtos
WHERE estoque > 0
ORDER BY estoque DESC
LIMIT 10;

-- ============================================
-- 7️⃣ PRODUTOS COM ESTOQUE ZERADO
-- ============================================
SELECT 
  id,
  nome,
  estoque,
  ativo,
  preco_base
FROM produtos
WHERE estoque = 0
ORDER BY id DESC
LIMIT 10;

-- ============================================
-- 8️⃣ VERIFICAR DUPLICATAS POR facilzap_id
-- ============================================
SELECT 
  facilzap_id,
  COUNT(*) as quantidade_duplicadas,
  STRING_AGG(id::text, ', ') as ids_duplicados
FROM produtos
WHERE facilzap_id IS NOT NULL
  AND facilzap_id != ''
GROUP BY facilzap_id
HAVING COUNT(*) > 1
ORDER BY quantidade_duplicadas DESC;

-- ✅ ESPERADO: 0 registros (sem duplicatas)
-- ⚠️ Se houver registros: Aplicar migration 035

-- ============================================
-- 9️⃣ PRODUTOS SEM facilzap_id
-- ============================================
SELECT 
  id,
  nome,
  estoque,
  id_externo,
  facilzap_id
FROM produtos
WHERE facilzap_id IS NULL 
   OR facilzap_id = ''
LIMIT 10;

-- ✅ ESPERADO: 0 registros (todos devem ter facilzap_id)

-- ============================================
-- 🔟 BUSCAR PRODUTO ESPECÍFICO
-- ============================================
-- Troque 'Rasteirinha' pelo produto que você quer testar
SELECT 
  id,
  facilzap_id,
  id_externo,
  nome,
  estoque,
  preco_base,
  ativo
FROM produtos
WHERE nome ILIKE '%Rasteirinha%'
   OR nome ILIKE '%Sandalia%'
   OR nome ILIKE '%Chinelo%'
LIMIT 10;

-- ============================================
-- 1️⃣1️⃣ VER TODOS OS LOGS (SEM FILTROS)
-- ============================================
SELECT * 
FROM logs_sincronizacao
ORDER BY id DESC
LIMIT 30;

-- ============================================
-- 1️⃣2️⃣ CONTAR LOGS (SE A TABELA EXISTIR)
-- ============================================
SELECT COUNT(*) as total_logs
FROM logs_sincronizacao;

-- ============================================
-- 1️⃣3️⃣ TESTE RÁPIDO: Um Produto Aleatório
-- ============================================
SELECT 
  id,
  nome,
  estoque,
  pg_typeof(estoque) as tipo_estoque,
  facilzap_id,
  id_externo,
  ativo
FROM produtos
WHERE id = (SELECT MIN(id) FROM produtos)
LIMIT 1;

-- ============================================
-- ✅ CHECKLIST SIMPLIFICADO
-- ============================================
-- Execute as queries acima e verifique:
-- 
-- ✅ Query 4: pg_typeof(estoque) = 'integer' ou 'numeric'?
-- ✅ Query 5: Estatísticas fazem sentido?
-- ✅ Query 8: 0 duplicatas por facilzap_id?
-- ✅ Query 9: 0 produtos sem facilzap_id?
-- ✅ Query 11: Logs existem?
--
-- Se TODAS ✅: Sistema funcionando! 🎉
-- Se ALGUMA ❌: Consulte CORRIGIR_CONFLITO_CHAVES.md
