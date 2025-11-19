-- 📊 QUERIES PARA MONITORAR SINCRONIZAÇÃO AUTOMÁTICA

-- ============================================
-- 1️⃣ Ver últimas sincronizações (logs)
-- ============================================
SELECT 
  tipo,
  descricao,
  timestamp,
  sucesso,
  erro,
  payload
FROM logs_sincronizacao 
ORDER BY timestamp DESC 
LIMIT 30;

-- ============================================
-- 2️⃣ Ver estatísticas gerais
-- ============================================
SELECT * FROM vw_estatisticas_sincronizacao;

-- ============================================
-- 3️⃣ Ver produtos sincronizados recentemente
-- ============================================
SELECT 
  id,
  nome,
  facilzap_id,
  estoque,
  sincronizado_facilzap,
  ultima_sincronizacao,
  ativo
FROM produtos
WHERE sincronizado_facilzap = true
ORDER BY ultima_sincronizacao DESC
LIMIT 20;

-- ============================================
-- 4️⃣ Ver produtos que foram DESATIVADOS por estoque zero
-- ============================================
SELECT 
  tipo,
  descricao,
  timestamp,
  payload
FROM logs_sincronizacao
WHERE tipo = 'estoque_zerado'
ORDER BY timestamp DESC
LIMIT 20;

-- ============================================
-- 5️⃣ Ver produtos com estoque zero que ainda estão ativos (PROBLEMA!)
-- ============================================
SELECT * FROM vw_produtos_estoque_zero;

-- ============================================
-- 6️⃣ Contar sincronizações por hora (últimas 24h)
-- ============================================
SELECT 
  DATE_TRUNC('hour', timestamp) as hora,
  tipo,
  COUNT(*) as quantidade,
  SUM(CASE WHEN sucesso = true THEN 1 ELSE 0 END) as sucessos,
  SUM(CASE WHEN sucesso = false THEN 1 ELSE 0 END) as erros
FROM logs_sincronizacao
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp), tipo
ORDER BY hora DESC;

-- ============================================
-- 7️⃣ Ver produtos mais atualizados (top 10)
-- ============================================
SELECT 
  p.nome,
  p.facilzap_id,
  p.estoque,
  p.ultima_sincronizacao,
  COUNT(l.id) as num_atualizacoes
FROM produtos p
LEFT JOIN logs_sincronizacao l ON l.facilzap_id = p.facilzap_id
WHERE p.sincronizado_facilzap = true
GROUP BY p.id, p.nome, p.facilzap_id, p.estoque, p.ultima_sincronizacao
ORDER BY num_atualizacoes DESC
LIMIT 10;

-- ============================================
-- 8️⃣ Ver produtos que NUNCA foram sincronizados
-- ============================================
SELECT 
  id,
  nome,
  id_externo,
  estoque,
  ativo,
  sincronizado_facilzap
FROM produtos
WHERE sincronizado_facilzap = false OR sincronizado_facilzap IS NULL
LIMIT 20;

-- ============================================
-- 9️⃣ Ver erros de sincronização (se houver)
-- ============================================
SELECT 
  tipo,
  descricao,
  erro,
  timestamp,
  payload
FROM logs_sincronizacao
WHERE sucesso = false OR erro IS NOT NULL
ORDER BY timestamp DESC
LIMIT 10;

-- ============================================
-- 🔟 Dashboard completo (execute e salve como view)
-- ============================================
SELECT 
  'Total de produtos' as metrica,
  COUNT(*)::text as valor
FROM produtos
UNION ALL
SELECT 
  'Produtos sincronizados',
  COUNT(*)::text
FROM produtos
WHERE sincronizado_facilzap = true
UNION ALL
SELECT 
  'Produtos com estoque',
  COUNT(*)::text
FROM produtos
WHERE estoque > 0
UNION ALL
SELECT 
  'Produtos esgotados',
  COUNT(*)::text
FROM produtos
WHERE estoque = 0
UNION ALL
SELECT 
  'Sincronizações nas últimas 24h',
  COUNT(*)::text
FROM logs_sincronizacao
WHERE timestamp > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'Última sincronização',
  TO_CHAR(MAX(ultima_sincronizacao), 'DD/MM/YYYY HH24:MI:SS')
FROM produtos
WHERE ultima_sincronizacao IS NOT NULL;
