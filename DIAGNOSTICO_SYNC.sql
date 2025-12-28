-- 🔍 DIAGNÓSTICO DE SINCRONIZAÇÃO
-- Execute no Supabase para verificar o estado da sincronização

-- 0️⃣ PRIMEIRO: Verificar estrutura da tabela logs (descobrir colunas)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'logs_sincronizacao';

-- 1️⃣ Ver últimos logs de sincronização (se tabela existir)
SELECT * FROM logs_sincronizacao ORDER BY id DESC LIMIT 20;

-- 2️⃣ Ver produtos com última sincronização
SELECT 
  nome,
  estoque,
  ultima_sincronizacao,
  sincronizado_facilzap,
  facilzap_id
FROM produtos
WHERE ultima_sincronizacao IS NOT NULL
ORDER BY ultima_sincronizacao DESC
LIMIT 10;

-- 3️⃣ Verificar se há produtos zerados recentemente
SELECT 
  id,
  nome,
  estoque,
  ultima_sincronizacao
FROM produtos
WHERE estoque <= 0
ORDER BY ultima_sincronizacao DESC NULLS LAST
LIMIT 10;

-- 4️⃣ Ver quando foi a última sincronização geral
SELECT 
  MAX(ultima_sincronizacao) as ultima_sync,
  COUNT(*) as total_produtos,
  COUNT(CASE WHEN sincronizado_facilzap = true THEN 1 END) as sincronizados
FROM produtos;
