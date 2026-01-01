-- ============================================
-- SCRIPT: Vincular produtos às revendedoras JÁ APROVADAS
-- ============================================
-- Situação: Revendedoras aprovadas ANTES da mudança não têm produtos
-- Solução: Vincular TODOS produtos aprovados manualmente
-- ============================================

-- PASSO 1: Verificar quantas revendedoras aprovadas existem
-- ============================================
SELECT 
  COUNT(*) as total_revendedoras_aprovadas,
  COUNT(CASE WHEN status = 'aprovada' THEN 1 END) as aprovadas
FROM resellers;

-- PASSO 2: Ver quais revendedoras aprovadas NÃO têm produtos
-- ============================================
SELECT 
  r.id,
  r.name,
  r.store_name,
  r.slug,
  r.status,
  r.approved_at,
  COUNT(rp.product_id) as total_produtos_vinculados
FROM resellers r
LEFT JOIN reseller_products rp ON rp.reseller_id = r.id
WHERE r.status = 'aprovada'
GROUP BY r.id, r.name, r.store_name, r.slug, r.status, r.approved_at
ORDER BY r.approved_at DESC;

-- PASSO 3: Vincular TODOS produtos aprovados às revendedoras aprovadas
-- ============================================
-- 🚨 ATENÇÃO: Este script vincula produtos às revendedoras JÁ aprovadas
-- que não receberam produtos automaticamente

INSERT INTO reseller_products (
  reseller_id,
  product_id,
  margin_percent,
  is_active,
  custom_price,
  created_at,
  updated_at
)
SELECT 
  r.id as reseller_id,
  p.id as product_id,
  0 as margin_percent,      -- 🆕 SEM margem (revendedora precisa definir)
  false as is_active,        -- 🆕 DESATIVADO (precisa ativar após definir margem)
  NULL as custom_price,
  NOW() as created_at,
  NOW() as updated_at
FROM produtos p
CROSS JOIN resellers r
WHERE p.admin_aprovado = true      -- Só produtos aprovados pelo admin
  AND p.ativo = true               -- Só produtos ativos
  AND r.status = 'aprovada'        -- Só revendedoras aprovadas
  AND NOT EXISTS (                 -- Só se ainda não estiver vinculado
    SELECT 1 
    FROM reseller_products rp2 
    WHERE rp2.product_id = p.id 
      AND rp2.reseller_id = r.id
  );

-- PASSO 4: Verificar resultado
-- ============================================
SELECT 
  r.name as revendedora,
  r.slug,
  COUNT(rp.product_id) as produtos_vinculados,
  COUNT(CASE WHEN rp.is_active = false AND rp.margin_percent = 0 THEN 1 END) as produtos_novos_pendentes
FROM resellers r
LEFT JOIN reseller_products rp ON rp.reseller_id = r.id
WHERE r.status = 'aprovada'
GROUP BY r.id, r.name, r.slug
ORDER BY r.name;

-- PASSO 5: Criar notificações para revendedoras
-- ============================================
INSERT INTO reseller_notifications (
  reseller_id,
  type,
  title,
  message,
  metadata,
  created_at
)
SELECT 
  r.id,
  'new_products',
  '🆕 Produtos disponíveis!',
  'Produtos estão aguardando sua ativação. Defina sua margem de lucro!',
  jsonb_build_object('total_products', (
    SELECT COUNT(*) 
    FROM reseller_products rp 
    WHERE rp.reseller_id = r.id 
      AND rp.is_active = false 
      AND rp.margin_percent = 0
  )),
  NOW()
FROM resellers r
WHERE r.status = 'aprovada'
  AND EXISTS (
    SELECT 1 
    FROM reseller_products rp 
    WHERE rp.reseller_id = r.id 
      AND rp.is_active = false 
      AND rp.margin_percent = 0
  );

-- ============================================
-- ✅ RESULTADO ESPERADO:
-- ============================================
-- 1. Todas revendedoras aprovadas recebem TODOS produtos
-- 2. Produtos vêm DESATIVADOS (is_active=false)
-- 3. Margem = 0 (precisam definir)
-- 4. Notificação criada
-- 5. Alerta aparece no dashboard
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Script executado com sucesso!';
  RAISE NOTICE '📦 Produtos vinculados às revendedoras aprovadas';
  RAISE NOTICE '⚠️ Produtos estão DESATIVADOS e aguardando margem';
  RAISE NOTICE '🔔 Notificações criadas';
END $$;
