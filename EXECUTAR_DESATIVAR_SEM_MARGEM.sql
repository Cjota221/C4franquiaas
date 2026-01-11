-- ============================================
-- DESATIVAR PRODUTOS SEM MARGEM NO BANCO
-- Execute no Supabase SQL Editor
-- ============================================

-- 1️⃣ PRIMEIRO: Ver quantos produtos serão afetados
SELECT 
  r.store_name as loja,
  COUNT(*) as produtos_sem_margem,
  COUNT(*) FILTER (WHERE rp.is_active = true) as ativos_sem_margem
FROM reseller_products rp
JOIN resellers r ON r.id = rp.reseller_id
WHERE (rp.margin_percent IS NULL OR rp.margin_percent = 0)
  AND (rp.custom_price IS NULL OR rp.custom_price = 0)
GROUP BY r.store_name
ORDER BY ativos_sem_margem DESC;

-- 2️⃣ DESATIVAR todos os produtos onde:
--    - margin_percent é NULL ou 0
--    - custom_price é NULL ou 0
--    - E estão ativos (is_active = true)

UPDATE reseller_products
SET is_active = false
WHERE (margin_percent IS NULL OR margin_percent = 0)
  AND (custom_price IS NULL OR custom_price = 0)
  AND is_active = true;

-- 3️⃣ VERIFICAR resultado
SELECT 
  COUNT(*) as total_produtos,
  COUNT(*) FILTER (WHERE is_active = true) as ativos,
  COUNT(*) FILTER (WHERE is_active = false) as inativos,
  COUNT(*) FILTER (WHERE margin_percent IS NULL OR margin_percent = 0) as sem_margem,
  COUNT(*) FILTER (WHERE is_active = true AND (margin_percent IS NULL OR margin_percent = 0)) as ativos_sem_margem
FROM reseller_products;
