-- ============================================
-- 🎯 FORÇAR MARGEM 100% EM TODOS OS PRODUTOS
-- ============================================
-- Algumas revendedoras personalizaram a margem antes
-- Este script padroniza TUDO para 100%
-- ============================================

-- ATUALIZAR TODOS para margem 100%
UPDATE reseller_products
SET 
  margin_percent = 100,
  updated_at = NOW()
WHERE margin_percent != 100 OR margin_percent IS NULL;

-- VERIFICAR RESULTADO
SELECT 
  'RESULTADO FINAL' as info,
  COUNT(*) as total_vinculos,
  COUNT(CASE WHEN rp.margin_percent = 100 THEN 1 END) as com_margem_100,
  COUNT(CASE WHEN rp.is_active = true THEN 1 END) as ativos
FROM reseller_products rp;

-- Ver resumo por revendedora
SELECT 
  r.name as revendedora,
  COUNT(rp.id) as total_produtos,
  COUNT(CASE WHEN rp.is_active = true THEN 1 END) as ativos,
  COUNT(CASE WHEN rp.margin_percent = 100 THEN 1 END) as com_margem_100
FROM resellers r
LEFT JOIN reseller_products rp ON rp.reseller_id = r.id
WHERE r.status = 'aprovada'
GROUP BY r.id, r.name
ORDER BY r.name;
