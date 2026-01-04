-- ============================================================================
-- SCRIPT PARA RECUPERAR BANNERS APROVADOS QUE SUMIRAM
-- ============================================================================
-- Problema: API está buscando de "banners" mas banners estão em "banner_submissions"

-- PASSO 1: Verificar se existem banners aprovados em banner_submissions
SELECT 
  bs.id,
  bs.user_id,
  bs.status,
  bs.titulo,
  bs.desktop_final_url,
  bs.mobile_final_url,
  bs.approved_at,
  r.id as reseller_id,
  r.store_name,
  r.banner_url as current_banner_desktop,
  r.banner_mobile_url as current_banner_mobile
FROM banner_submissions bs
LEFT JOIN resellers r ON r.user_id = bs.user_id
WHERE bs.status = 'approved'
ORDER BY bs.approved_at DESC;

-- PASSO 2: Verificar a tabela "banners" (antiga) se existe
-- SELECT * FROM banners WHERE status = 'approved' LIMIT 10;

-- ============================================================================
-- SOLUÇÃO 1: Atualizar API para buscar de banner_submissions
-- ============================================================================
-- Editar arquivo: app/api/banners/route.ts
-- Trocar: .from('banners') por .from('banner_submissions')

-- ============================================================================
-- SOLUÇÃO 2: Migrar dados de banner_submissions para resellers (TEMPORÁRIA)
-- ============================================================================
-- Se quiser forçar a sincronização dos banners aprovados com a tabela resellers:

-- Desktop banners aprovados
UPDATE resellers r
SET 
  banner_url = bs.desktop_final_url,
  updated_at = NOW()
FROM banner_submissions bs
WHERE r.user_id = bs.user_id
  AND bs.status = 'approved'
  AND bs.desktop_final_url IS NOT NULL
  AND bs.desktop_final_url != '';

-- Mobile banners aprovados  
UPDATE resellers r
SET 
  banner_mobile_url = bs.mobile_final_url,
  updated_at = NOW()
FROM banner_submissions bs
WHERE r.user_id = bs.user_id
  AND bs.status = 'approved'
  AND bs.mobile_final_url IS NOT NULL
  AND bs.mobile_final_url != '';

-- ============================================================================
-- VERIFICAR RESULTADO
-- ============================================================================
SELECT 
  r.id,
  r.store_name,
  r.banner_url,
  r.banner_mobile_url,
  COUNT(bs.id) as total_submissions_aprovadas
FROM resellers r
LEFT JOIN banner_submissions bs ON r.user_id = bs.user_id AND bs.status = 'approved'
GROUP BY r.id, r.store_name, r.banner_url, r.banner_mobile_url
ORDER BY r.store_name;
