# 🚨 PROBLEMA: Banners Sumidos

## O que aconteceu:

1. ✅ Criamos nova tabela `banner_submissions` (estrutura moderna)
2. ❌ Página `/admin/moderacao/banners` ainda usa estrutura ANTIGA
3. ❌ Banners antigos aprovados estavam em outra tabela e sumiram

## Estruturas diferentes:

### ANTIGA (página de moderação atual):

- Tabela: `banner_personalizacoes` (?)
- Campos: `reseller_id`, `banner_type`, `image_url`, `status`
- Banners já tinham imagem pronta (upload de arquivo)

### NOVA (que criamos agora):

- Tabela: `banner_submissions`
- Campos: `user_id`, `template_id`, `titulo`, `subtitulo`, `font_family`, etc
- Banners são GERADOS a partir de template + texto

## ✅ JÁ RESOLVIDO:

- ✅ Mobile font size padrão = 120%

## 🔧 PRECISA RESOLVER:

### 1. Descobrir onde estão os banners antigos:

Execute no Supabase:

```sql
-- Ver todas as tabelas com "banner"
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%banner%';
```

### 2. Opções:

**A) Manter os dois sistemas:**

- Banners antigos (upload de imagem) → tabela antiga
- Banners novos (template + texto) → `banner_submissions`

**B) Migrar tudo para novo sistema:**

- Copiar banners antigos para `banner_submissions`
- Atualizar página de moderação

**C) Usar só sistema novo:**

- Desabilitar sistema antigo
- Revendedoras criam novos banners no novo sistema

## 📝 Qual você prefere?

1. Manter os dois?
2. Migrar tudo pro novo?
3. Só usar o novo (perder os antigos)?
