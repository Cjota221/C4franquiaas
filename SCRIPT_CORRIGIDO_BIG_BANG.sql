-- ============================================
-- 🚀 SCRIPT CORRIGIDO: BIG BANG - ATUALIZAÇÃO GERAL
-- ============================================
-- Problema encontrado: admin_aprovado = false em todos os produtos
-- Solução: Ignorar admin_aprovado, usar apenas ativo = true
-- ============================================

-- PASSO 1: Verificar quantos produtos temos
SELECT 
  COUNT(*) as total_produtos,
  COUNT(CASE WHEN ativo = true THEN 1 END) as ativos
FROM produtos;

-- PASSO 2: APROVAR todos os produtos ativos (corrigir admin_aprovado)
UPDATE produtos
SET admin_aprovado = true
WHERE ativo = true;

-- PASSO 3: UPSERT - Inserir produtos para todas as revendedoras aprovadas
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
  100 AS margin_percent,          -- 🎯 Margem 100%
  true AS is_active,              -- ✅ Ativo
  NOW() AS created_at,
  NOW() AS updated_at
FROM resellers r
CROSS JOIN produtos p
WHERE r.status = 'aprovada'       -- Todas as aprovadas
  AND p.ativo = true              -- Todos os produtos ativos
ON CONFLICT (reseller_id, product_id) 
DO UPDATE SET
  margin_percent = CASE 
    WHEN EXCLUDED.margin_percent = 0 OR reseller_products.margin_percent IS NULL 
    THEN 100 
    ELSE reseller_products.margin_percent 
  END,
  is_active = true,
  updated_at = NOW();

-- PASSO 4: ATUALIZAR produtos existentes que estão "quebrados"
UPDATE reseller_products
SET 
  margin_percent = 100,
  is_active = true,
  updated_at = NOW()
WHERE reseller_id IN (SELECT id FROM resellers WHERE status = 'aprovada')
  AND product_id IN (SELECT id FROM produtos WHERE ativo = true)
  AND (
    margin_percent IS NULL 
    OR margin_percent = 0 
    OR is_active = false
    OR is_active IS NULL
  );

-- PASSO 5: DESATIVAR produtos inativos
UPDATE reseller_products
SET 
  is_active = false,
  updated_at = NOW()
WHERE product_id IN (SELECT id FROM produtos WHERE ativo = false);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
SELECT 
  'RESUMO FINAL' as info,
  (SELECT COUNT(*) FROM resellers WHERE status = 'aprovada') as total_revendedoras,
  (SELECT COUNT(*) FROM produtos WHERE ativo = true) as total_produtos_ativos,
  (SELECT COUNT(*) FROM reseller_products WHERE is_active = true AND margin_percent = 100) as vinculos_corretos;

-- Ver por revendedora
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
