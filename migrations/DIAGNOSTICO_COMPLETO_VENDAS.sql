-- ============================================================================
-- DIAGNÓSTICO COMPLETO E CORREÇÃO - VENDAS E FRANQUEADAS
-- ============================================================================
-- Execute este arquivo completo no Supabase Dashboard > SQL Editor
-- ============================================================================

RAISE NOTICE '🔍 === INICIANDO DIAGNÓSTICO === 🔍';
RAISE NOTICE '';

-- ============================================================================
-- 1️⃣ VERIFICAR TODAS AS VENDAS
-- ============================================================================
DO $$
DECLARE
  total_vendas INTEGER;
  vendas_com_franqueada INTEGER;
  vendas_sem_franqueada INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_vendas FROM vendas;
  SELECT COUNT(*) INTO vendas_com_franqueada FROM vendas WHERE franqueada_id IS NOT NULL;
  SELECT COUNT(*) INTO vendas_sem_franqueada FROM vendas WHERE franqueada_id IS NULL;
  
  RAISE NOTICE '📊 TOTAL DE VENDAS: %', total_vendas;
  RAISE NOTICE '   ✅ Com franqueada_id: %', vendas_com_franqueada;
  RAISE NOTICE '   ❌ SEM franqueada_id: %', vendas_sem_franqueada;
  RAISE NOTICE '';
END $$;

-- Mostrar últimas 5 vendas
RAISE NOTICE '📋 ÚLTIMAS 5 VENDAS:';
SELECT 
  v.id,
  v.created_at,
  v.cliente_nome,
  v.valor_total,
  v.franqueada_id,
  v.status_pagamento,
  CASE 
    WHEN v.franqueada_id IS NULL THEN '❌ SEM FRANQUEADA'
    ELSE '✅ OK'
  END as status_vinculo
FROM vendas v
ORDER BY v.created_at DESC
LIMIT 5;

RAISE NOTICE '';

-- ============================================================================
-- 2️⃣ VERIFICAR LOJAS E FRANQUEADAS
-- ============================================================================
DO $$
DECLARE
  total_lojas INTEGER;
  lojas_com_franqueada INTEGER;
  franqueadas_sem_user_id INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_lojas FROM lojas;
  SELECT COUNT(*) INTO lojas_com_franqueada FROM lojas WHERE franqueada_id IS NOT NULL;
  SELECT COUNT(*) INTO franqueadas_sem_user_id FROM franqueadas WHERE user_id IS NULL;
  
  RAISE NOTICE '🏪 LOJAS:';
  RAISE NOTICE '   Total: %', total_lojas;
  RAISE NOTICE '   Com franqueada vinculada: %', lojas_com_franqueada;
  RAISE NOTICE '';
  RAISE NOTICE '👥 FRANQUEADAS:';
  RAISE NOTICE '   ⚠️ SEM user_id (PROBLEMA!): %', franqueadas_sem_user_id;
  RAISE NOTICE '';
END $$;

-- Mostrar lojas e suas franqueadas
RAISE NOTICE '📋 LOJAS E FRANQUEADAS:';
SELECT 
  l.nome as loja,
  l.dominio,
  f.nome as franqueada_nome,
  f.email as franqueada_email,
  f.user_id,
  CASE 
    WHEN f.user_id IS NULL THEN '❌ SEM USER_ID (PROBLEMA!)'
    ELSE '✅ OK'
  END as status
FROM lojas l
LEFT JOIN franqueadas f ON l.franqueada_id = f.id
ORDER BY l.created_at DESC
LIMIT 5;

RAISE NOTICE '';

-- ============================================================================
-- 3️⃣ CORRIGIR VENDAS SEM FRANQUEADA_ID
-- ============================================================================
RAISE NOTICE '🔧 === INICIANDO CORREÇÃO === 🔧';
RAISE NOTICE '';

-- Atualizar vendas que não têm franqueada_id
UPDATE vendas v
SET franqueada_id = f.user_id
FROM lojas l
JOIN franqueadas f ON l.franqueada_id = f.id
WHERE v.loja_id = l.id
AND v.franqueada_id IS NULL
AND f.user_id IS NOT NULL;

-- Verificar resultado
DO $$
DECLARE
  vendas_corrigidas INTEGER;
  vendas_ainda_sem INTEGER;
BEGIN
  SELECT COUNT(*) INTO vendas_corrigidas FROM vendas WHERE franqueada_id IS NOT NULL;
  SELECT COUNT(*) INTO vendas_ainda_sem FROM vendas WHERE franqueada_id IS NULL;
  
  RAISE NOTICE '✅ Vendas com franqueada_id: %', vendas_corrigidas;
  RAISE NOTICE '⚠️ Vendas ainda sem franqueada_id: %', vendas_ainda_sem;
  
  IF vendas_ainda_sem > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ ATENÇÃO: Ainda existem vendas sem franqueada_id!';
    RAISE NOTICE 'Motivo provável: franqueada não tem user_id definido';
    RAISE NOTICE 'Vá em /admin/franqueadas e crie o usuário Auth';
  END IF;
END $$;

RAISE NOTICE '';

-- ============================================================================
-- 4️⃣ VERIFICAÇÃO FINAL
-- ============================================================================
RAISE NOTICE '✅ === VERIFICAÇÃO FINAL === ✅';
RAISE NOTICE '';

-- Vendas com dados completos
SELECT 
  v.id,
  v.created_at::date as data,
  v.cliente_nome,
  v.valor_total,
  l.nome as loja,
  f.nome as franqueada,
  f.email as franqueada_email,
  CASE 
    WHEN v.franqueada_id IS NOT NULL AND f.user_id IS NOT NULL THEN '✅ TUDO OK'
    WHEN v.franqueada_id IS NULL THEN '❌ SEM FRANQUEADA_ID'
    WHEN f.user_id IS NULL THEN '⚠️ FRANQUEADA SEM USER_ID'
    ELSE '❓ PROBLEMA DESCONHECIDO'
  END as status_completo
FROM vendas v
LEFT JOIN lojas l ON v.loja_id = l.id
LEFT JOIN franqueadas f ON v.franqueada_id = f.user_id
ORDER BY v.created_at DESC
LIMIT 10;

RAISE NOTICE '';
RAISE NOTICE '🎉 === DIAGNÓSTICO E CORREÇÃO CONCLUÍDOS === 🎉';
RAISE NOTICE '';
RAISE NOTICE '📝 Próximos passos:';
RAISE NOTICE '1. Verifique se ainda há vendas sem franqueada_id';
RAISE NOTICE '2. Se sim, certifique-se que a franqueada tem user_id no Supabase Auth';
RAISE NOTICE '3. Teste criar uma nova venda';
RAISE NOTICE '4. Acesse /franqueada/comissoes para ver as vendas';
RAISE NOTICE '5. Acesse /admin/comissoes para ver todas as vendas';
