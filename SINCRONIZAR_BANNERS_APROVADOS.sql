-- ============================================================================
-- SINCRONIZAR BANNERS APROVADOS - SCRIPT COMPLETO
-- ============================================================================
-- Este script sincroniza banners já aprovados para aparecerem nos sites

-- PASSO 1: Atualizar desktop_final_url e mobile_final_url nas submissions aprovadas
-- (Usar as URLs dos templates)
UPDATE banner_submissions bs
SET 
  desktop_final_url = bt.desktop_url,
  mobile_final_url = bt.mobile_url,
  updated_at = NOW()
FROM banner_templates bt
WHERE bs.template_id = bt.id
  AND bs.status = 'approved'
  AND (bs.desktop_final_url IS NULL OR bs.mobile_final_url IS NULL);

-- PASSO 2: Sincronizar banners desktop com resellers
UPDATE resellers r
SET 
  banner_url = bs.desktop_final_url,
  updated_at = NOW()
FROM banner_submissions bs
WHERE r.user_id = bs.user_id
  AND bs.status = 'approved'
  AND bs.desktop_final_url IS NOT NULL
  AND bs.desktop_final_url != '';

-- PASSO 3: Sincronizar banners mobile com resellers  
UPDATE resellers r
SET 
  banner_mobile_url = bs.mobile_final_url,
  updated_at = NOW()
FROM banner_submissions bs
WHERE r.user_id = bs.user_id
  AND bs.status = 'approved'
  AND bs.mobile_final_url IS NOT NULL
  AND bs.mobile_final_url != '';

-- PASSO 4: Verificar resultado
SELECT 
  r.id,
  r.store_name,
  r.banner_url as desktop_banner,
  r.banner_mobile_url as mobile_banner,
  bs.titulo as banner_titulo,
  bs.status,
  bs.approved_at
FROM resellers r
LEFT JOIN banner_submissions bs ON r.user_id = bs.user_id AND bs.status = 'approved'
WHERE bs.id IS NOT NULL
ORDER BY bs.approved_at DESC;

-- PASSO 5: Ver quantos foram sincronizados
SELECT 
  COUNT(*) as total_banners_aprovados,
  COUNT(CASE WHEN r.banner_url IS NOT NULL THEN 1 END) as com_banner_desktop,
  COUNT(CASE WHEN r.banner_mobile_url IS NOT NULL THEN 1 END) as com_banner_mobile
FROM resellers r
INNER JOIN banner_submissions bs ON r.user_id = bs.user_id AND bs.status = 'approved';
