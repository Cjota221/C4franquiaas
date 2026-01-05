-- ============================================================================
-- VERIFICAR ESTRUTURA E DADOS DA TABELA RESELLERS
-- ============================================================================

-- Ver estrutura completa da tabela resellers
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'resellers'
ORDER BY ordinal_position;

-- Ver exemplos de dados de 3 revendedoras ativas
SELECT 
  id,
  name,
  store_name,
  email,
  logo_url,
  banner_url,
  banner_mobile_url,
  colors,
  status,
  is_active,
  total_products
FROM resellers
WHERE is_active = true
LIMIT 3;

-- Verificar se existe tabela store_customizations
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'store_customizations'
) as store_customizations_existe;

-- Contar revendedoras com personalização
SELECT 
  COUNT(*) as total_revendedoras,
  COUNT(logo_url) as com_logo,
  COUNT(banner_url) as com_banner,
  COUNT(banner_mobile_url) as com_banner_mobile,
  COUNT(CASE WHEN colors->>'primary' IS NOT NULL THEN 1 END) as com_cor_primaria,
  COUNT(CASE WHEN colors->>'secondary' IS NOT NULL THEN 1 END) as com_cor_secundaria
FROM resellers
WHERE is_active = true;

-- Ver produtos vinculados
SELECT 
  r.id,
  r.name,
  r.store_name,
  COUNT(rp.id) as produtos_vinculados,
  COUNT(CASE WHEN rp.is_active = true THEN 1 END) as produtos_ativos
FROM resellers r
LEFT JOIN reseller_products rp ON rp.reseller_id = r.id
WHERE r.is_active = true
GROUP BY r.id, r.name, r.store_name
ORDER BY produtos_ativos DESC
LIMIT 5;
