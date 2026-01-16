-- ============================================
-- 🚨 EXECUTAR NO SUPABASE (SQL Editor)
-- ============================================
-- Corrige revendedoras aprovadas que não têm produtos vinculados
-- ============================================

-- PASSO 1: Ver quais revendedoras não têm NENHUM produto
SELECT 
  r.id,
  r.name as revendedora,
  r.status,
  COUNT(rp.id) as total_vinculados
FROM resellers r
LEFT JOIN reseller_products rp ON rp.reseller_id = r.id
WHERE r.status = 'aprovada'
GROUP BY r.id, r.name, r.status
HAVING COUNT(rp.id) = 0
ORDER BY r.name;

-- PASSO 2: Vincular produtos para revendedoras que têm 0 produtos
INSERT INTO reseller_products (
  reseller_id,
  product_id,
  margin_percent,
  is_active,
  created_at,
  updated_at
)
SELECT 
  r.id AS reseller_id,
  p.id AS product_id,
  100 AS margin_percent,
  true AS is_active,
  NOW() AS created_at,
  NOW() AS updated_at
FROM resellers r
CROSS JOIN produtos p
WHERE r.status = 'aprovada'
  AND p.ativo = true
  AND p.admin_aprovado = true
  AND NOT EXISTS (
    SELECT 1 FROM reseller_products rp 
    WHERE rp.reseller_id = r.id
  )
ON CONFLICT (reseller_id, product_id) DO NOTHING;

-- ============================================
-- PASSO 3: Verificar produtos ATIVOS vs TOTAL vinculados
-- ============================================
SELECT 
  r.name as revendedora,
  COUNT(rp.id) as total_vinculados,
  COUNT(CASE WHEN p.ativo = true AND p.admin_aprovado = true THEN 1 END) as produtos_ativos,
  COUNT(CASE WHEN rp.is_active = true THEN 1 END) as habilitados_revendedora
FROM resellers r
LEFT JOIN reseller_products rp ON rp.reseller_id = r.id
LEFT JOIN produtos p ON p.id = rp.product_id
WHERE r.status = 'aprovada'
GROUP BY r.id, r.name
ORDER BY r.name;

-- ============================================
-- VERIFICAÇÃO: Quantos produtos ativos existem?
-- ============================================
SELECT 
  COUNT(*) as total_produtos,
  COUNT(CASE WHEN ativo = true THEN 1 END) as ativos,
  COUNT(CASE WHEN admin_aprovado = true THEN 1 END) as aprovados,
  COUNT(CASE WHEN ativo = true AND admin_aprovado = true THEN 1 END) as ativos_e_aprovados
FROM produtos;
