-- ============================================
-- 🔍 MONITORAMENTO ALTERNATIVO (Netlify Logs Offline)
-- ============================================
-- Use estas queries enquanto os logs do Netlify estiverem indisponíveis

-- ============================================
-- 1️⃣ VERIFICAR SE SCHEDULED FUNCTION ESTÁ RODANDO
-- ============================================
-- A scheduled function grava logs na tabela logs_sincronizacao
-- Se ela está rodando, você verá registros recentes (< 2 minutos)

SELECT 
  created_at,
  tipo,
  mensagem,
  detalhes->>'total' as total_processados,
  detalhes->>'new' as novos,
  detalhes->>'updated' as atualizados,
  detalhes->>'unchanged' as inalterados,
  NOW() - created_at as "tempo_atras"
FROM logs_sincronizacao
WHERE tipo = 'scheduled_sync'
ORDER BY created_at DESC
LIMIT 10;

-- ✅ Esperado: Registros a cada 1 minuto
-- ⚠️ Se não há registros recentes: Scheduled function não está executando

-- ============================================
-- 2️⃣ VERIFICAR ÚLTIMA SINCRONIZAÇÃO
-- ============================================
-- Produtos devem ter ultima_sincronizacao atualizado recentemente

SELECT 
  COUNT(*) as total_produtos,
  MAX(ultima_sincronizacao) as ultima_sync,
  NOW() - MAX(ultima_sincronizacao) as "tempo_desde_ultima_sync",
  COUNT(CASE WHEN ultima_sincronizacao > NOW() - INTERVAL '5 minutes' THEN 1 END) as "atualizados_ultimos_5min"
FROM produtos
WHERE sincronizado_facilzap = true;

-- ✅ Esperado: tempo_desde_ultima_sync < 2 minutos
-- ⚠️ Se > 5 minutos: Sincronização parou

-- ============================================
-- 3️⃣ VER HISTÓRICO DE SINCRONIZAÇÕES (ÚLTIMAS 24H)
-- ============================================
-- Mostra quantas sincronizações ocorreram por hora

SELECT 
  DATE_TRUNC('hour', created_at) as hora,
  COUNT(*) as total_sincronizacoes,
  SUM((detalhes->>'new')::int) as total_novos,
  SUM((detalhes->>'updated')::int) as total_atualizados,
  AVG((detalhes->>'total')::int) as media_processados
FROM logs_sincronizacao
WHERE tipo = 'scheduled_sync'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hora DESC;

-- ✅ Esperado: ~60 sincronizações por hora (1 por minuto)

-- ============================================
-- 4️⃣ VERIFICAR SE WEBHOOK ESTÁ FUNCIONANDO
-- ============================================
-- Webhooks também geram logs na tabela

SELECT 
  created_at,
  tipo,
  mensagem,
  detalhes->>'facilzap_id' as produto_id,
  detalhes->>'estoque_anterior' as estoque_antes,
  detalhes->>'estoque_novo' as estoque_depois,
  NOW() - created_at as "tempo_atras"
FROM logs_sincronizacao
WHERE tipo ILIKE '%webhook%'
ORDER BY created_at DESC
LIMIT 20;

-- ✅ Esperado: Registros quando você altera produtos no FácilZap
-- ⚠️ Se vazio: Webhook não configurado ou não está recebendo eventos

-- ============================================
-- 5️⃣ DETECTAR PROBLEMAS NA SINCRONIZAÇÃO
-- ============================================
-- Erros são registrados com nivel = 'error'

SELECT 
  created_at,
  tipo,
  mensagem,
  detalhes,
  NOW() - created_at as "tempo_atras"
FROM logs_sincronizacao
WHERE nivel = 'error'
ORDER BY created_at DESC
LIMIT 10;

-- ✅ Esperado: 0 registros (sem erros)
-- ⚠️ Se houver erros: Investigar o campo 'detalhes'

-- ============================================
-- 6️⃣ TESTAR SE ESTOQUE ESTÁ NUMÉRICO (PÓS-CORREÇÃO)
-- ============================================
-- Após aplicar as correções, estoque deve ser sempre numérico

SELECT 
  id,
  nome,
  estoque,
  pg_typeof(estoque) as tipo_dado,
  ultima_sincronizacao
FROM produtos
WHERE sincronizado_facilzap = true
ORDER BY ultima_sincronizacao DESC
LIMIT 10;

-- ✅ Esperado: tipo_dado = 'integer' ou 'numeric'
-- ⚠️ Se diferente: normalizeEstoque() não está sendo aplicado

-- ============================================
-- 7️⃣ VERIFICAR PRODUTOS COM ESTOQUE = 0 (DESATIVADOS?)
-- ============================================
-- Produtos com estoque 0 devem estar desativados nas franquias

SELECT 
  p.id,
  p.nome,
  p.estoque,
  p.ativo as ativo_master,
  COUNT(DISTINCT pfp.franqueada_id) FILTER (WHERE pfp.ativo_no_site = true) as franquias_ativas,
  COUNT(DISTINCT rp.reseller_id) FILTER (WHERE rp.is_active = true) as revendedoras_ativas
FROM produtos p
LEFT JOIN produtos_franqueadas pf ON pf.produto_id = p.id
LEFT JOIN produtos_franqueadas_precos pfp ON pfp.produto_franqueada_id = pf.id
LEFT JOIN reseller_products rp ON rp.product_id = p.id
WHERE p.estoque = 0
GROUP BY p.id, p.nome, p.estoque, p.ativo
HAVING COUNT(DISTINCT pfp.franqueada_id) FILTER (WHERE pfp.ativo_no_site = true) > 0 
    OR COUNT(DISTINCT rp.reseller_id) FILTER (WHERE rp.is_active = true) > 0
ORDER BY franquias_ativas + revendedoras_ativas DESC;

-- ✅ Esperado: 0 registros (produtos zerados estão desativados)
-- ⚠️ Se houver registros: Regra de desativação não está funcionando

-- ============================================
-- 8️⃣ COMPARAR PRODUTO ESPECÍFICO (TESTE MANUAL)
-- ============================================
-- Use para testar alteração de estoque no FácilZap

-- PASSO 1: Anote o estoque atual
SELECT 
  facilzap_id,
  nome,
  estoque,
  ultima_sincronizacao,
  NOW() as "consultado_em"
FROM produtos
WHERE nome ILIKE '%Rasteirinha%'  -- Troque pelo produto de teste
LIMIT 1;

-- PASSO 2: Altere o estoque no painel FácilZap
-- PASSO 3: Aguarde 1-2 minutos
-- PASSO 4: Execute a query acima novamente

-- ✅ Esperado: estoque mudou, ultima_sincronizacao atualizado
-- ⚠️ Se não mudou: Sincronização não está funcionando

-- ============================================
-- 9️⃣ ESTATÍSTICAS GERAIS DO SISTEMA
-- ============================================

SELECT 
  'Total de Produtos' as metrica,
  COUNT(*) as valor
FROM produtos

UNION ALL

SELECT 
  'Produtos Sincronizados',
  COUNT(*)
FROM produtos
WHERE sincronizado_facilzap = true

UNION ALL

SELECT 
  'Produtos com Estoque > 0',
  COUNT(*)
FROM produtos
WHERE estoque > 0

UNION ALL

SELECT 
  'Últimas 24h: Sincronizações',
  COUNT(*)
FROM logs_sincronizacao
WHERE tipo = 'scheduled_sync'
  AND created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'Últimas 24h: Webhooks',
  COUNT(*)
FROM logs_sincronizacao
WHERE tipo ILIKE '%webhook%'
  AND created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'Últimas 24h: Erros',
  COUNT(*)
FROM logs_sincronizacao
WHERE nivel = 'error'
  AND created_at > NOW() - INTERVAL '24 hours';

-- ============================================
-- 🔟 LIMPAR LOGS ANTIGOS (MANUTENÇÃO)
-- ============================================
-- Execute apenas se a tabela logs_sincronizacao estiver muito grande

-- Deletar logs com mais de 30 dias (manter apenas recentes)
-- DELETE FROM logs_sincronizacao 
-- WHERE created_at < NOW() - INTERVAL '30 days';

-- Ver quantos registros seriam deletados (sem deletar)
SELECT 
  COUNT(*) as registros_antigos,
  MIN(created_at) as mais_antigo,
  MAX(created_at) as mais_recente
FROM logs_sincronizacao
WHERE created_at < NOW() - INTERVAL '30 days';

-- ============================================
-- 📊 DASHBOARD VISUAL (COPIE RESULTADO PARA EXCEL/SHEETS)
-- ============================================

WITH stats AS (
  SELECT 
    DATE_TRUNC('hour', created_at) as hora,
    COUNT(*) as sincronizacoes,
    SUM((detalhes->>'new')::int) as novos,
    SUM((detalhes->>'updated')::int) as atualizados
  FROM logs_sincronizacao
  WHERE tipo = 'scheduled_sync'
    AND created_at > NOW() - INTERVAL '12 hours'
  GROUP BY DATE_TRUNC('hour', created_at)
)
SELECT 
  TO_CHAR(hora, 'YYYY-MM-DD HH24:00') as hora,
  sincronizacoes,
  novos,
  atualizados,
  ROUND(sincronizacoes::numeric / 60, 1) as "taxa_min"  -- Deve ser ~1.0
FROM stats
ORDER BY hora DESC;

-- ============================================
-- ✅ CHECKLIST RÁPIDO
-- ============================================
-- Execute cada query acima e verifique:
-- 
-- ✅ Query 1: Logs recentes (< 2 min)?
-- ✅ Query 2: ultima_sincronizacao recente?
-- ✅ Query 3: ~60 syncs por hora?
-- ✅ Query 4: Webhooks registrados?
-- ✅ Query 5: Sem erros?
-- ✅ Query 6: Estoque é numérico?
-- ✅ Query 7: Produtos zerados desativados?
-- ✅ Query 9: Estatísticas fazem sentido?
--
-- Se todas ✅: Sistema funcionando perfeitamente! 🎉
-- Se alguma ⚠️: Investigar o problema específico
