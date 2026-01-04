-- ============================================================================
-- VERIFICAR SE O BANNER DA VIVAZ ESTÁ SINCRONIZADO
-- ============================================================================

-- Ver o banner aprovado completo
SELECT 
  bs.*
FROM banner_submissions bs
WHERE bs.id = '97971d3e-89f8-404d-8898-8c5a912fbe02';

-- Ver se a revendedora Vivaz tem o banner configurado
SELECT 
  r.id,
  r.store_name,
  r.slug,
  r.banner_url,
  r.banner_mobile_url,
  r.user_id
FROM resellers r
WHERE r.store_name ILIKE '%vivaz%' OR r.slug ILIKE '%vivaz%';

-- Verificar se o user_id bate
SELECT 
  bs.user_id as submission_user_id,
  r.user_id as reseller_user_id,
  bs.desktop_final_url,
  bs.mobile_final_url,
  r.banner_url,
  r.banner_mobile_url
FROM banner_submissions bs
LEFT JOIN resellers r ON r.user_id = bs.user_id
WHERE bs.id = '97971d3e-89f8-404d-8898-8c5a912fbe02';
