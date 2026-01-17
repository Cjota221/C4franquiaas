-- ============================================
-- 🔍 IDENTIFICAR RECARGA SEM USUÁRIO
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Ver TODAS as carteiras e seus donos
SELECT 
  w.id as wallet_id,
  w.revendedora_id,
  w.saldo,
  w.saldo_bloqueado,
  w.status,
  w.created_at as carteira_criada,
  r.store_name as nome_loja,
  r.email
FROM wallets w
LEFT JOIN resellers r ON r.id = w.revendedora_id
ORDER BY w.created_at DESC;

-- 2. Ver TODAS as recargas e suas carteiras
SELECT 
  wr.id as recarga_id,
  wr.wallet_id,
  wr.valor,
  wr.status as status_recarga,
  wr.pix_id,
  wr.created_at as recarga_criada,
  wr.aprovado_em,
  w.revendedora_id,
  r.store_name as nome_loja,
  r.email
FROM wallet_recargas wr
LEFT JOIN wallets w ON w.id = wr.wallet_id
LEFT JOIN resellers r ON r.id = w.revendedora_id
ORDER BY wr.created_at DESC;

-- 3. Ver transações (créditos na carteira)
SELECT 
  wt.id as transacao_id,
  wt.wallet_id,
  wt.tipo,
  wt.valor,
  wt.descricao,
  wt.created_at as transacao_criada,
  w.revendedora_id,
  r.store_name as nome_loja,
  r.email
FROM wallet_transactions wt
LEFT JOIN wallets w ON w.id = wt.wallet_id
LEFT JOIN resellers r ON r.id = w.revendedora_id
ORDER BY wt.created_at DESC;

-- 4. CARTEIRAS ÓRFÃS (sem revendedora ou com revendedora inexistente)
SELECT 
  w.id as wallet_id,
  w.revendedora_id,
  w.saldo,
  w.status,
  w.created_at,
  CASE 
    WHEN w.revendedora_id IS NULL THEN '❌ SEM REVENDEDORA_ID'
    WHEN r.id IS NULL THEN '❌ REVENDEDORA NÃO EXISTE'
    ELSE '✅ OK'
  END as problema
FROM wallets w
LEFT JOIN resellers r ON r.id = w.revendedora_id
WHERE w.revendedora_id IS NULL OR r.id IS NULL;

-- 5. Ver a revendedora Caroline (vivaz) para vincular
SELECT id, email, store_name, created_at
FROM resellers
WHERE email ILIKE '%carol%' OR store_name ILIKE '%vivaz%' OR store_name ILIKE '%carol%';

-- ============================================
-- 🔧 CORREÇÃO MANUAL
-- Após identificar, execute os comandos abaixo
-- Substitua os IDs corretos
-- ============================================

-- Exemplo: Vincular carteira órfã à revendedora correta
-- UPDATE wallets 
-- SET revendedora_id = 'ID_DA_REVENDEDORA'
-- WHERE id = 'ID_DA_CARTEIRA_ORFA';

-- Se a recarga já foi creditada mas a carteira está órfã:
-- 1. Primeiro vincule a carteira à revendedora correta
-- 2. A recarga vai aparecer vinculada automaticamente
