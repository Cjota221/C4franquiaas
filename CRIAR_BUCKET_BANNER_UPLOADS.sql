-- Criar bucket para upload de banners customizados
-- Execute no SQL Editor do Supabase

-- 1. Criar o bucket (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-uploads', 'banner-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurar políticas de acesso RLS

-- Política: Usuários autenticados podem fazer upload
CREATE POLICY "Usuários podem fazer upload de banners"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'banner-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Acesso público para leitura
CREATE POLICY "Banners são públicos para leitura"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'banner-uploads');

-- Política: Usuários podem atualizar seus próprios banners
CREATE POLICY "Usuários podem atualizar seus banners"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'banner-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários podem deletar seus próprios banners
CREATE POLICY "Usuários podem deletar seus banners"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'banner-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Verificar se foi criado
SELECT * FROM storage.buckets WHERE id = 'banner-uploads';
