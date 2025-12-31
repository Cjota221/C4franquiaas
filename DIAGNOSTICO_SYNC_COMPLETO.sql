-- ============================================
-- 🔍 DIAGNÓSTICO: POR QUE A SINCRONIZAÇÃO PAROU
-- ============================================
-- Execute estas queries para descobrir a raiz do problema
-- ============================================

-- 1️⃣ VERIFICAR ÚLTIMA SINCRONIZAÇÃO BEM-SUCEDIDA
-- Mostra quando foi a última vez que produtos foram atualizados
SELECT 
  'Última Sync' as tipo,
  MAX(ultima_sincronizacao) as ultima_data,
  COUNT(*) as total_produtos_sincronizados
FROM produtos
WHERE sincronizado_facilzap = true
  AND ultima_sincronizacao IS NOT NULL;

-- 2️⃣ VERIFICAR PRODUTOS SEM SINCRONIZAÇÃO RECENTE
-- Lista produtos que não foram atualizados há mais de 1 hora
SELECT 
  id,
  nome,
  estoque,
  ativo,
  ultima_sincronizacao,
  EXTRACT(EPOCH FROM (NOW() - ultima_sincronizacao))/3600 as horas_desde_sync
FROM produtos
WHERE ultima_sincronizacao < NOW() - INTERVAL '1 hour'
ORDER BY ultima_sincronizacao DESC
LIMIT 10;

-- 3️⃣ VERIFICAR PRODUTOS COM ESTOQUE ZERO MAS ATIVOS
-- Estes deveriam ter sido desativados automaticamente
SELECT 
  COUNT(*) as total,
  'Produtos com estoque 0 mas ainda ativos' as problema
FROM produtos
WHERE estoque = 0 
  AND ativo = true;

-- 4️⃣ VERIFICAR SE TRIGGER EXISTE E ESTÁ ATIVO
-- O trigger é responsável por reativar produtos quando estoque volta
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE '%reativar%' 
   OR trigger_name LIKE '%estoque%';

-- 5️⃣ VERIFICAR LOGS DE ERROS (se existir tabela de logs)
-- Procura por erros recentes
SELECT 
  created_at,
  tipo,
  mensagem
FROM logs_sincronizacao
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND (tipo = 'erro' OR mensagem LIKE '%erro%' OR mensagem LIKE '%error%')
ORDER BY created_at DESC
LIMIT 20;

-- 6️⃣ COMPARAR ESTOQUE: Banco vs Realidade
-- Lista produtos que podem estar desatualizados
SELECT 
  id,
  nome,
  estoque as estoque_no_banco,
  ativo,
  ultima_sincronizacao,
  CASE 
    WHEN estoque > 0 AND ativo = false THEN '⚠️ Deveria estar ativo'
    WHEN estoque = 0 AND ativo = true THEN '⚠️ Deveria estar inativo'
    ELSE '✅ OK'
  END as status_esperado
FROM produtos
WHERE 
  (estoque > 0 AND ativo = false) 
  OR (estoque = 0 AND ativo = true)
LIMIT 50;

-- 7️⃣ VERIFICAR TOKEN FACILZAP NO BANCO
-- Checa se existe token configurado
SELECT 
  id,
  nome as franquia,
  facilzap_token IS NOT NULL as tem_token,
  LENGTH(facilzap_token) as tamanho_token,
  updated_at as token_atualizado_em
FROM franqueadas
WHERE facilzap_token IS NOT NULL;

-- 8️⃣ HISTÓRICO DE MUDANÇAS DE ESTOQUE (últimas 24h)
-- Se você tem audit log ou similar
SELECT 
  id,
  nome,
  estoque,
  updated_at,
  LAG(estoque) OVER (PARTITION BY id ORDER BY updated_at) as estoque_anterior
FROM produtos
WHERE updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC
LIMIT 50;

-- ============================================
-- 📋 RESULTADO ESPERADO:
-- ============================================
-- Query 1: Deve mostrar data/hora recente (hoje)
-- Query 2: Lista vazia ou poucos produtos desatualizados
-- Query 3: Deve ser 0 ou muito baixo
-- Query 4: Deve listar o trigger 'trigger_reativar_estoque'
-- Query 5: Não deve ter erros recentes
-- Query 6: Lista produtos inconsistentes que precisam correção
-- Query 7: Deve mostrar token válido
-- Query 8: Mostra atividade recente de estoque
