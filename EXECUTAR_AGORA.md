# 🚨 EXECUTAR AGORA NO SUPABASE

## Copie e cole este SQL no Supabase SQL Editor:

```sql
-- ============================================================================
-- PASSO 1: Atualizar banner_submissions com URLs dos templates
-- ============================================================================
UPDATE banner_submissions bs
SET 
  desktop_final_url = bt.desktop_url,
  mobile_final_url = bt.mobile_url,
  updated_at = NOW()
FROM banner_templates bt
WHERE bs.template_id = bt.id
  AND bs.status = 'approved'
  AND (bs.desktop_final_url IS NULL OR bs.mobile_final_url IS NULL);

-- ============================================================================
-- PASSO 2: Sincronizar banners com resellers (Desktop)
-- ============================================================================
UPDATE resellers r
SET 
  banner_url = bs.desktop_final_url,
  updated_at = NOW()
FROM banner_submissions bs
WHERE r.user_id = bs.user_id
  AND bs.status = 'approved'
  AND bs.desktop_final_url IS NOT NULL;

-- ============================================================================
-- PASSO 3: Sincronizar banners com resellers (Mobile)
-- ============================================================================
UPDATE resellers r
SET 
  banner_mobile_url = bs.mobile_final_url,
  updated_at = NOW()
FROM banner_submissions bs
WHERE r.user_id = bs.user_id
  AND bs.status = 'approved'
  AND bs.mobile_final_url IS NOT NULL;

-- ============================================================================
-- PASSO 4: Verificar quais revendedoras têm banners agora
-- ============================================================================
SELECT 
  r.store_name,
  r.slug,
  CASE WHEN r.banner_url IS NOT NULL THEN '✅' ELSE '❌' END as desktop,
  CASE WHEN r.banner_mobile_url IS NOT NULL THEN '✅' ELSE '❌' END as mobile,
  bs.titulo,
  bs.approved_at
FROM resellers r
LEFT JOIN banner_submissions bs ON r.user_id = bs.user_id AND bs.status = 'approved'
WHERE r.is_active = true
ORDER BY r.store_name;
```

## ⏱️ Depois de executar:

1. ✅ Recarregue os sites das revendedoras
2. ✅ Os banners devem aparecer (ainda sem textos personalizados)
3. 🔧 Em seguida vou corrigir para os textos aparecerem

---

**Execute este SQL AGORA** e me avise quando terminar! 
Depois vou implementar a exibição dos textos personalizados.
