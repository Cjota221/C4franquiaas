-- ============================================
-- ✅ SOLUÇÃO: Vincular produtos automaticamente às Franqueadas
-- ============================================
-- Isso vai vincular TODOS os produtos ativos às franqueadas aprovadas
-- Com margem padrão de 20% (ou margem_padrao da franqueada)
-- ============================================

-- PASSO 1: Vincular produtos que ainda não estão vinculados
-- ============================================
INSERT INTO reseller_products (
  reseller_id,
  product_id,
  custom_price,
  is_active,
  created_at,
  updated_at
)
SELECT 
  r.id as reseller_id,
  p.id as product_id,
  -- Calcular preço com margem padrão de 20%
  p.preco_base * 1.20 as custom_price,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM produtos p
CROSS JOIN resellers r
WHERE 
  -- Produto deve estar ativo e com estoque
  p.ativo = true 
  AND p.estoque > 0
  -- Franqueada deve estar aprovada
  AND r.status = 'aprovada'
  -- Não criar vínculo duplicado
  AND NOT EXISTS (
    SELECT 1 FROM reseller_products rp 
    WHERE rp.product_id = p.id 
      AND rp.reseller_id = r.id
  );

-- PASSO 2: Verificar quantos vínculos foram criados
-- ============================================
SELECT 
  COUNT(*) as vinculos_criados
FROM reseller_products
WHERE created_at > NOW() - INTERVAL '1 minute';

-- PASSO 3: Verificar produtos por franqueada
-- ============================================
SELECT 
  r.name as franqueada,
  COUNT(rp.id) as total_produtos
FROM resellers r
LEFT JOIN reseller_products rp ON rp.reseller_id = r.id
WHERE r.status = 'aprovada'
GROUP BY r.id, r.name
ORDER BY r.name;

-- PASSO 4: Verificar se ainda há produtos sem vínculo
-- ============================================
SELECT 
  COUNT(DISTINCT p.id) as produtos_ainda_sem_vinculo
FROM produtos p
WHERE p.ativo = true
  AND p.estoque > 0
  AND NOT EXISTS (
    SELECT 1 FROM reseller_products rp 
    WHERE rp.product_id = p.id
  );

-- ESPERADO: 0 produtos sem vínculo
-- ============================================

-- ✅ EXECUTE TODO ESTE SQL NO SUPABASE
-- ============================================
