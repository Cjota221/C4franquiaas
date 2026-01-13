-- ============================================
-- DIAGNÓSTICO RÁPIDO - Execute UMA query por vez
-- ============================================

-- ========== QUERY 1: CONTAGENS BÁSICAS ==========
SELECT 
  'produtos' as tabela,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE ativo = true) as ativos,
  COUNT(*) FILTER (WHERE admin_aprovado = true) as aprovados
FROM produtos
UNION ALL
SELECT 
  'resellers',
  COUNT(*),
  COUNT(*) FILTER (WHERE is_active = true),
  COUNT(*) FILTER (WHERE status = 'aprovada')
FROM resellers
UNION ALL
SELECT 
  'reseller_products',
  COUNT(*),
  COUNT(*) FILTER (WHERE is_active = true),
  0
FROM reseller_products;

-- ========== QUERY 2: PRODUTOS SEM VINCULAÇÃO ==========
-- (Execute separadamente)
/*
SELECT 
  p.id,
  p.nome,
  p.estoque,
  (SELECT COUNT(*) FROM reseller_products WHERE product_id = p.id) as vinculacoes
FROM produtos p
WHERE p.admin_aprovado = true
  AND NOT EXISTS (SELECT 1 FROM reseller_products WHERE product_id = p.id)
LIMIT 10;
*/

-- ========== QUERY 3: LOGS RECENTES ==========
-- (Execute separadamente)
/*
SELECT created_at, tipo, LEFT(descricao, 60) as desc
FROM logs_sincronizacao
ORDER BY created_at DESC
LIMIT 15;
*/

-- ========== QUERY 4: REVENDEDORAS ==========
-- (Execute separadamente)
/*
SELECT 
  name,
  status,
  is_active,
  total_products
FROM resellers
ORDER BY name;
*/

-- ========== QUERY 5: PRODUTOS DESATIVADOS COM ESTOQUE ==========
-- (Execute separadamente)
/*
SELECT 
  p.nome,
  p.estoque,
  COUNT(rp.id) FILTER (WHERE rp.is_active = false) as desativados
FROM produtos p
JOIN reseller_products rp ON rp.product_id = p.id
WHERE p.estoque > 0 AND p.ativo = true
GROUP BY p.id, p.nome, p.estoque
HAVING COUNT(rp.id) FILTER (WHERE rp.is_active = false) > 0
LIMIT 10;
*/
