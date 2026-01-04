# 🚨 RECUPERAR BANNERS APROVADOS - AÇÃO IMEDIATA

## 📋 Problema Identificado

A API estava buscando banners da tabela antiga `banners`, mas os banners estão salvos em `banner_submissions`. Por isso os banners aprovados "sumiram".

## ✅ Correção Aplicada

1. ✅ API atualizada para buscar de `banner_submissions`
2. ✅ Endpoints de aprovar/rejeitar corrigidos
3. ✅ Código commitado e enviado ao GitHub
4. ✅ Netlify deve rebuildar automaticamente

## 🔧 Ação Necessária no Supabase

Execute este SQL no **Supabase SQL Editor** para sincronizar os banners aprovados:

```sql
-- ============================================================================
-- SINCRONIZAR BANNERS APROVADOS COM TABELA RESELLERS
-- ============================================================================

-- PASSO 1: Ver banners aprovados que existem
SELECT
  bs.id,
  bs.user_id,
  bs.titulo,
  bs.desktop_final_url,
  bs.mobile_final_url,
  bs.approved_at,
  r.id as reseller_id,
  r.store_name,
  r.banner_url as banner_atual_desktop,
  r.banner_mobile_url as banner_atual_mobile
FROM banner_submissions bs
LEFT JOIN resellers r ON r.user_id = bs.user_id
WHERE bs.status = 'approved'
ORDER BY bs.approved_at DESC;

-- PASSO 2: Sincronizar banners desktop aprovados
UPDATE resellers r
SET
  banner_url = bs.desktop_final_url,
  updated_at = NOW()
FROM banner_submissions bs
WHERE r.user_id = bs.user_id
  AND bs.status = 'approved'
  AND bs.desktop_final_url IS NOT NULL
  AND bs.desktop_final_url != '';

-- PASSO 3: Sincronizar banners mobile aprovados
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
  r.banner_url as desktop,
  r.banner_mobile_url as mobile,
  COUNT(bs.id) as total_banners_aprovados
FROM resellers r
LEFT JOIN banner_submissions bs ON r.user_id = bs.user_id AND bs.status = 'approved'
GROUP BY r.id, r.store_name, r.banner_url, r.banner_mobile_url
HAVING COUNT(bs.id) > 0
ORDER BY r.store_name;
```

## 📊 Resultado Esperado

Após executar o SQL:

- ✅ Banners aprovados voltam a aparecer nos catálogos
- ✅ Tabela `resellers` sincronizada com `banner_submissions`
- ✅ Frontend já carrega os banners corretamente (API corrigida)

## 🎯 Próximos Passos

1. **Execute o SQL acima no Supabase**
2. **Recarregue a página de personalização da revendedora**
3. **Verifique se os banners aprovados aparecem**

## ⚠️ Observação Importante

Esta correção resolve o problema de forma definitiva. A partir de agora:

- ✅ API busca de `banner_submissions` (tabela correta)
- ✅ Quando admin aprovar banner, ele automaticamente atualiza a tabela `resellers`
- ✅ Não haverá mais "sumiço" de banners
