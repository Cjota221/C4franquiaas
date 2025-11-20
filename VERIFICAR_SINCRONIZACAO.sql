-- 🔍 VERIFICAR SE A SINCRONIZAÇÃO ESTÁ FUNCIONANDO

-- ============================================
-- 1️⃣ Ver os produtos mais recentemente sincronizados
-- ============================================
-- Se a sincronização está funcionando, você verá timestamps recentes (últimos minutos)
SELECT 
  id,
  nome,
  estoque,
  ultima_sincronizacao,
  NOW() - ultima_sincronizacao as "tempo_desde_sync",
  sincronizado_facilzap
FROM produtos
WHERE sincronizado_facilzap = true
ORDER BY ultima_sincronizacao DESC
LIMIT 10;

-- ============================================
-- 2️⃣ Verificar se os timestamps estão sendo atualizados
-- ============================================
-- Execute esta query AGORA, depois execute novamente daqui a 2 minutos
-- Se os timestamps mudarem, a sincronização ESTÁ funcionando!
SELECT 
  COUNT(*) as total_produtos,
  MAX(ultima_sincronizacao) as ultima_sync,
  MIN(ultima_sincronizacao) as primeira_sync,
  NOW() - MAX(ultima_sincronizacao) as "tempo_desde_ultima_sync"
FROM produtos
WHERE sincronizado_facilzap = true;

-- ============================================
-- 3️⃣ Ver produtos que foram atualizados nos últimos 5 minutos
-- ============================================
-- Se retornar produtos, significa que a sincronização está rodando!
SELECT 
  id,
  nome,
  estoque,
  ultima_sincronizacao,
  EXTRACT(EPOCH FROM (NOW() - ultima_sincronizacao)) as "segundos_atras"
FROM produtos
WHERE sincronizado_facilzap = true
  AND ultima_sincronizacao > NOW() - INTERVAL '5 minutes'
ORDER BY ultima_sincronizacao DESC;

-- ============================================
-- 4️⃣ Comparar um produto específico (troque o ID)
-- ============================================
-- Anote o estoque de um produto AGORA
-- Mude o estoque no FácilZap
-- Aguarde 1-2 minutos
-- Execute novamente e veja se o estoque mudou
SELECT 
  id,
  nome,
  estoque,
  preco_base,
  ativo,
  ultima_sincronizacao,
  facilzap_id
FROM produtos
WHERE nome ILIKE '%Rasteirinha%'  -- Troque pelo nome do produto que você testou
LIMIT 5;
