-- =============================================
-- DIAGNÓSTICO: Sincronização de Produtos
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1️⃣ Verificar total de produtos ativos no admin
SELECT 
  COUNT(*) as total_produtos,
  COUNT(*) FILTER (WHERE ativo = true) as produtos_ativos,
  COUNT(*) FILTER (WHERE ativo = true AND estoque > 0) as ativos_com_estoque
FROM produtos;

-- 2️⃣ Verificar total de revendedoras aprovadas
SELECT 
  COUNT(*) as total_revendedoras,
  COUNT(*) FILTER (WHERE status = 'aprovada') as aprovadas,
  COUNT(*) FILTER (WHERE status = 'aprovada' AND is_active = true) as ativas
FROM resellers;

-- 3️⃣ Verificar se o trigger existe
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_vincular_revendedoras';

-- 4️⃣ Contar vínculos em reseller_products
SELECT 
  COUNT(*) as total_vinculos,
  COUNT(*) FILTER (WHERE is_active = true) as vinculos_ativos,
  COUNT(DISTINCT product_id) as produtos_distintos,
  COUNT(DISTINCT reseller_id) as revendedoras_distintas
FROM reseller_products;

-- 5️⃣ Identificar produtos SEM vínculo com revendedoras
SELECT p.id, p.nome, p.ativo, p.estoque
FROM produtos p
WHERE p.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM reseller_products rp WHERE rp.product_id = p.id
  )
ORDER BY p.nome;

-- 6️⃣ Contagem rápida: produtos ativos vs vinculados
WITH stats AS (
  SELECT 
    (SELECT COUNT(*) FROM produtos WHERE ativo = true) as admin_ativos,
    (SELECT COUNT(DISTINCT product_id) FROM reseller_products) as vinculados
)
SELECT 
  admin_ativos,
  vinculados,
  admin_ativos - vinculados as faltantes,
  ROUND(100.0 * vinculados / NULLIF(admin_ativos, 0), 1) as percentual_vinculado
FROM stats;

-- 7️⃣ CORREÇÃO: Vincular produtos faltantes manualmente
-- ⚠️ DESCOMENTE E EXECUTE SE QUISER CORRIGIR
/*
INSERT INTO reseller_products (reseller_id, product_id, margin_percent, is_active, created_at)
SELECT 
  r.id as reseller_id,
  p.id as product_id,
  30 as margin_percent,  -- Margem padrão 30%
  true as is_active,
  NOW() as created_at
FROM produtos p
CROSS JOIN resellers r
WHERE p.ativo = true
  AND r.status = 'aprovada'
  AND r.is_active = true
  AND NOT EXISTS (
    SELECT 1 
    FROM reseller_products rp 
    WHERE rp.product_id = p.id 
      AND rp.reseller_id = r.id
  );
*/
