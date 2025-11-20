-- ============================================
-- 🔍 QUERIES SIMPLES PARA MONITORAMENTO
-- ============================================
-- Versão simplificada sem assumir estrutura da tabela

-- ============================================
-- 1️⃣ VER ÚLTIMOS LOGS (SEM ASSUMIR NOMES DE COLUNAS)
-- ============================================
SELECT * FROM logs_sincronizacao 
ORDER BY id DESC 
LIMIT 20;

-- ============================================
-- 2️⃣ CONTAR LOGS POR TIPO
-- ============================================
SELECT 
  tipo,
  COUNT(*) as total
FROM logs_sincronizacao
GROUP BY tipo
ORDER BY total DESC;

-- ============================================
-- 3️⃣ VER ÚLTIMOS 10 PRODUTOS SINCRONIZADOS
-- ============================================
SELECT 
  id,
  nome,
  estoque,
  ultima_sincronizacao,
  sincronizado_facilzap
FROM produtos
ORDER BY ultima_sincronizacao DESC NULLS LAST
LIMIT 10;

-- ============================================
-- 4️⃣ VERIFICAR SE ESTOQUE É NUMÉRICO
-- ============================================
SELECT 
  nome,
  estoque,
  pg_typeof(estoque) as tipo
FROM produtos
LIMIT 5;

-- ✅ Esperado: tipo = 'integer' ou 'numeric'

-- ============================================
-- 5️⃣ CONTAR PRODUTOS POR STATUS
-- ============================================
SELECT 
  'Total de Produtos' as status,
  COUNT(*) as quantidade
FROM produtos

UNION ALL

SELECT 
  'Sincronizados com FácilZap',
  COUNT(*)
FROM produtos
WHERE sincronizado_facilzap = true

UNION ALL

SELECT 
  'Com Estoque > 0',
  COUNT(*)
FROM produtos
WHERE estoque > 0

UNION ALL

SELECT 
  'Ativos',
  COUNT(*)
FROM produtos
WHERE ativo = true;

-- ============================================
-- 6️⃣ VER PRODUTOS COM ESTOQUE = 0
-- ============================================
SELECT 
  id,
  nome,
  estoque,
  ativo,
  ultima_sincronizacao
FROM produtos
WHERE estoque = 0
ORDER BY ultima_sincronizacao DESC NULLS LAST
LIMIT 10;

-- ============================================
-- 7️⃣ BUSCAR PRODUTO ESPECÍFICO PARA TESTE
-- ============================================
SELECT 
  id,
  facilzap_id,
  id_externo,
  nome,
  estoque,
  preco_base,
  ativo,
  ultima_sincronizacao
FROM produtos
WHERE nome ILIKE '%Rasteirinha%'
LIMIT 5;

-- ============================================
-- 8️⃣ VERIFICAR SE HÁ DUPLICATAS (facilzap_id)
-- ============================================
SELECT 
  facilzap_id,
  COUNT(*) as ocorrencias
FROM produtos
WHERE facilzap_id IS NOT NULL
GROUP BY facilzap_id
HAVING COUNT(*) > 1
ORDER BY ocorrencias DESC;

-- ✅ Esperado: 0 registros (sem duplicatas)

-- ============================================
-- 9️⃣ VERIFICAR PRODUTOS SEM facilzap_id
-- ============================================
SELECT 
  COUNT(*) as sem_facilzap_id
FROM produtos
WHERE facilzap_id IS NULL OR facilzap_id = '';

-- ✅ Esperado: 0 (todos devem ter facilzap_id)

-- ============================================
-- 🔟 VER TODOS OS LOGS (SEM FILTRO)
-- ============================================
-- Mostra todos os logs ordenados por ID
-- Use esta query para identificar possíveis erros manualmente
SELECT * FROM logs_sincronizacao
ORDER BY id DESC
LIMIT 20;

-- Alternativa: Se souber os nomes das colunas, filtre assim:
-- SELECT * FROM logs_sincronizacao
-- WHERE [nome_da_coluna_texto] ILIKE '%erro%' 
-- ORDER BY id DESC;

-- ============================================
-- ✅ CHECKLIST RÁPIDO
-- ============================================
-- Execute cada query acima:
-- 
-- ✅ Query 1: Ver logs recentes?
-- ✅ Query 2: Contar tipos de log?
-- ✅ Query 3: Produtos sincronizados recentemente?
-- ✅ Query 4: Estoque é numérico (integer/numeric)?
-- ✅ Query 5: Estatísticas fazem sentido?
-- ✅ Query 6: Produtos com estoque 0?
-- ✅ Query 7: Buscar produto teste?
-- ✅ Query 8: Sem duplicatas?
-- ✅ Query 9: Todos têm facilzap_id?
-- ✅ Query 10: Sem erros nos logs?
--
-- Se todas ✅: Sistema OK! 🎉
