-- ============================================================================
-- VER TODAS AS REVENDEDORAS E SUA PERSONALIZAÇÃO
-- ============================================================================

-- Ver TODAS as revendedoras ativas com status de personalização
SELECT 
  r.id,
  r.name,
  r.store_name,
  r.email,
  r.status,
  r.is_active,
  
  -- Personalização
  CASE WHEN r.logo_url IS NOT NULL AND r.logo_url != '' THEN '✓ TEM' ELSE '✗ NÃO TEM' END as logo,
  CASE WHEN r.banner_url IS NOT NULL AND r.banner_url != '' THEN '✓ TEM' ELSE '✗ NÃO TEM' END as banner,
  CASE WHEN r.banner_mobile_url IS NOT NULL AND r.banner_mobile_url != '' THEN '✓ TEM' ELSE '✗ NÃO TEM' END as banner_mobile,
  CASE WHEN r.colors IS NOT NULL AND r.colors->>'primary' IS NOT NULL THEN '✓ TEM' ELSE '✗ NÃO TEM' END as cores,
  
  -- Produtos
  r.total_products,
  COUNT(rp.id) FILTER (WHERE rp.is_active = true) as produtos_ativos_vinculados,
  
  -- URLs reais (primeiros 50 caracteres)
  LEFT(r.logo_url, 50) as logo_url_sample,
  LEFT(r.banner_url, 50) as banner_url_sample,
  r.colors->>'primary' as cor_primaria,
  r.colors->>'secondary' as cor_secundaria

FROM resellers r
LEFT JOIN reseller_products rp ON rp.reseller_id = r.id
WHERE r.is_active = true
GROUP BY r.id, r.name, r.store_name, r.email, r.status, r.is_active, 
         r.logo_url, r.banner_url, r.banner_mobile_url, r.colors, r.total_products
ORDER BY r.name;

-- Resumo
SELECT 
  COUNT(*) as total_ativas,
  COUNT(logo_url) FILTER (WHERE logo_url IS NOT NULL AND logo_url != '') as tem_logo,
  COUNT(banner_url) FILTER (WHERE banner_url IS NOT NULL AND banner_url != '') as tem_banner,
  COUNT(*) FILTER (WHERE colors->>'primary' IS NOT NULL) as tem_cores,
  COUNT(*) FILTER (WHERE total_products > 0) as tem_produtos
FROM resellers
WHERE is_active = true;
