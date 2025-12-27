# Criar Bucket para Imagens das Revendedoras

Para que o upload de logo e banner funcione, você precisa criar um bucket no Supabase.

## Passos no Supabase Dashboard

1. Acesse seu projeto no Supabase: https://app.supabase.com

2. Vá em **Storage** no menu lateral

3. Clique em **New bucket**

4. Configure:
   - **Name**: `reseller-assets`
   - **Public bucket**: ✅ ATIVAR (necessário para as imagens serem exibidas)

5. Clique em **Create bucket**

## Políticas de Acesso (Policies)

Após criar o bucket, configure as políticas:

### 1. Permitir Upload para Usuários Autenticados
```sql
-- Permitir insert (upload) para usuários autenticados
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reseller-assets');
```

### 2. Permitir Leitura Pública
```sql
-- Permitir select (visualização) para todos
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'reseller-assets');
```

### 3. Permitir Deleção para Donos
```sql
-- Permitir delete para quem fez upload
CREATE POLICY "Allow delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'reseller-assets');
```

## Via SQL Editor (Alternativa)

Você também pode executar este SQL direto no Editor SQL do Supabase:

```sql
-- Criar bucket via SQL (se preferir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reseller-assets', 'reseller-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reseller-assets');

CREATE POLICY IF NOT EXISTS "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'reseller-assets');

CREATE POLICY IF NOT EXISTS "Allow delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'reseller-assets');
```

## Testando

1. Vá para `/revendedora/personalizacao`
2. Tente fazer upload de uma logo
3. Se funcionar, a imagem aparecerá no preview!

## Estrutura dos Arquivos

Os arquivos serão salvos com esta estrutura:
```
reseller-assets/
  └── {reseller_id}/
      ├── logo_123456789.png
      ├── banner_123456789.jpg
      └── banner_mobile_123456789.jpg
```
