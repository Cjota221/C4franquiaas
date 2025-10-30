-- ============================================================================
-- SCRIPT DE DEBUG: Investigar vendas e vinculação com franqueadas
-- ============================================================================
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1️⃣ VERIFICAR TODAS AS VENDAS
SELECT 
  v.id,
  v.created_at,
  v.cliente_nome,
  v.valor_total,
  v.loja_id,
  v.franqueada_id,
  v.status_pagamento,
  v.mp_payment_id
FROM vendas v
ORDER BY v.created_at DESC
LIMIT 20;

-- 2️⃣ VERIFICAR LOJAS E SUAS FRANQUEADAS
SELECT 
  l.id as loja_id,
  l.nome as loja_nome,
  l.dominio,
  l.franqueada_id as loja_franqueada_id,
  f.id as franqueada_table_id,
  f.user_id as franqueada_user_id,
  f.nome as franqueada_nome,
  f.email as franqueada_email
FROM lojas l
LEFT JOIN franqueadas f ON l.franqueada_id = f.id
ORDER BY l.created_at DESC;

-- 3️⃣ VERIFICAR VENDAS COM DADOS COMPLETOS (JOIN)
SELECT 
  v.id as venda_id,
  v.created_at,
  v.cliente_nome,
  v.valor_total,
  v.status_pagamento,
  v.franqueada_id as venda_franqueada_id,
  l.nome as loja_nome,
  l.franqueada_id as loja_franqueada_table_id,
  f.nome as franqueada_nome,
  f.user_id as franqueada_user_id
FROM vendas v
LEFT JOIN lojas l ON v.loja_id = l.id
LEFT JOIN franqueadas f ON v.franqueada_id = f.user_id
ORDER BY v.created_at DESC
LIMIT 20;

-- 4️⃣ CONTAR VENDAS POR STATUS
SELECT 
  status_pagamento,
  COUNT(*) as quantidade,
  SUM(valor_total) as valor_total
FROM vendas
GROUP BY status_pagamento;

-- 5️⃣ VERIFICAR VENDAS SEM FRANQUEADA VINCULADA
SELECT 
  v.id,
  v.created_at,
  v.cliente_nome,
  v.valor_total,
  v.loja_id,
  v.franqueada_id,
  l.nome as loja_nome,
  l.franqueada_id as loja_franqueada_id
FROM vendas v
LEFT JOIN lojas l ON v.loja_id = l.id
WHERE v.franqueada_id IS NULL
ORDER BY v.created_at DESC;

-- 6️⃣ VERIFICAR SE EXISTEM FRANQUEADAS SEM USER_ID
SELECT 
  id,
  nome,
  email,
  user_id,
  criado_em
FROM franqueadas
WHERE user_id IS NULL;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Query 1: Deve mostrar TODAS as vendas
-- Query 2: Deve mostrar relação loja → franqueada
-- Query 3: Deve mostrar vendas COM nome da franqueada
-- Query 4: Contagem por status (quantas pending, approved, etc)
-- Query 5: Vendas órfãs (sem franqueada_id)
-- Query 6: Franqueadas sem user_id (problema!)
