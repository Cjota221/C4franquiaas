# 📁 Configuração do Bucket de Logos no Supabase

## ⚠️ IMPORTANTE

Antes de usar a página de customização da loja, você precisa criar o bucket `logos` no Supabase Storage.

## 🔧 Como Criar o Bucket

### Passo 1: Acessar Supabase Dashboard

1. Abra: https://supabase.com/dashboard
2. Selecione seu projeto **C4 Franquias**
3. No menu lateral, clique em **Storage**

### Passo 2: Criar Novo Bucket

1. Clique no botão **"New bucket"**
2. Preencha:
   - **Name**: `logos`
   - **Public bucket**: ✅ **MARCAR ESTA OPÇÃO** (muito importante!)
   - **File size limit**: 2 MB
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`

3. Clique em **"Create bucket"**

### Passo 3: Configurar Políticas de Acesso (RLS)

#### Política 1: Permitir Upload (INSERT)

```sql
-- No Supabase Dashboard > Storage > logos > Policies
-- Clicar em "New policy" > "For full customization"

-- Nome: Allow authenticated users to upload logos
-- Allowed operation: INSERT
-- Policy definition:
(bucket_id = 'logos'::text) AND (auth.role() = 'authenticated'::text)
```

#### Política 2: Permitir Leitura Pública (SELECT)

```sql
-- Nome: Allow public read access
-- Allowed operation: SELECT
-- Policy definition:
(bucket_id = 'logos'::text)
```

#### Política 3: Permitir Atualização (UPDATE)

```sql
-- Nome: Allow users to update their own logos
-- Allowed operation: UPDATE
-- Policy definition:
(bucket_id = 'logos'::text) AND (auth.role() = 'authenticated'::text)
```

#### Política 4: Permitir Exclusão (DELETE)

```sql
-- Nome: Allow users to delete their own logos
-- Allowed operation: DELETE
-- Policy definition:
(bucket_id = 'logos'::text) AND (auth.role() = 'authenticated'::text)
```

## ✅ Verificar se Está Funcionando

### Teste 1: Verificar Bucket Existe

```sql
-- No Supabase > SQL Editor
SELECT * FROM storage.buckets WHERE name = 'logos';
```

Deve retornar 1 linha com:
- `name`: logos
- `public`: true

### Teste 2: Upload Manual

1. Vá em **Storage > logos**
2. Clique em **"Upload file"**
3. Selecione uma imagem PNG ou JPG
4. Upload deve funcionar sem erros

### Teste 3: URL Pública

1. Após fazer upload, clique na imagem
2. Clique em **"Get public URL"**
3. Copie a URL (formato: `https://xxx.supabase.co/storage/v1/object/public/logos/nome-arquivo.png`)
4. Cole a URL no navegador
5. A imagem deve aparecer

## 🚨 Troubleshooting

### Erro: "Bucket not found"

**Solução**: Criar o bucket conforme Passo 2

### Erro: "new row violates row-level security policy"

**Solução**: Configurar políticas RLS conforme Passo 3

### Erro: "File size exceeds limit"

**Solução**: Imagem muito grande (max 2MB). Reduzir tamanho ou comprimir.

### Erro: "Invalid MIME type"

**Solução**: Apenas PNG, JPG, WEBP e SVG são permitidos.

## 📋 Checklist de Configuração

- [ ] Bucket `logos` criado
- [ ] Bucket marcado como **público**
- [ ] Política INSERT configurada (upload para usuários autenticados)
- [ ] Política SELECT configurada (leitura pública)
- [ ] Política UPDATE configurada
- [ ] Política DELETE configurada
- [ ] Teste de upload manual funcionou
- [ ] URL pública acessível no navegador

## 🎯 Após Configurar

Acesse a página de customização da loja:
```
http://localhost:3001/franqueada/loja
```

E teste o upload de logo!

## 📝 Exemplo de SQL Completo

Se preferir criar tudo via SQL:

```sql
-- 1. Criar bucket (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas RLS
CREATE POLICY "Allow authenticated users to upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');

CREATE POLICY "Allow users to update their own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos');

CREATE POLICY "Allow users to delete their own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos');
```

---

**Data**: 22 de outubro de 2025  
**Status**: Configuração necessária antes de usar a página de loja
