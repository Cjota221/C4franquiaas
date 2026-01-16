-- ============================================================================
-- CORRIGIR RLS DO BUCKET VIDEOS
-- Execute no SQL Editor do Supabase AGORA
-- ============================================================================

-- 1. REMOVER POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "Vídeos públicos para leitura" ON storage.objects;
DROP POLICY IF EXISTS "Upload de vídeos para autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Delete de vídeos para autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Videos public read" ON storage.objects;
DROP POLICY IF EXISTS "Videos authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Videos authenticated delete" ON storage.objects;

-- 2. GARANTIR QUE O BUCKET EXISTE E É PÚBLICO
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  52428800, -- 50MB em bytes (aumentei um pouco)
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png'];

-- 3. CRIAR POLÍTICAS PERMISSIVAS (MESMA ABORDAGEM DOS OUTROS BUCKETS)

-- Leitura pública para todos
CREATE POLICY "videos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Upload para qualquer usuário autenticado
CREATE POLICY "videos_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Update para qualquer usuário autenticado
CREATE POLICY "videos_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'videos')
WITH CHECK (bucket_id = 'videos');

-- Delete para qualquer usuário autenticado
CREATE POLICY "videos_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos');

-- ============================================================================
-- VERIFICAR
-- ============================================================================
SELECT 
  'Bucket videos' as item,
  CASE WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'videos' AND public = true) 
       THEN '✅ OK - público' 
       ELSE '❌ ERRO' 
  END as status;

SELECT policyname, cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE 'videos%'
ORDER BY policyname;
