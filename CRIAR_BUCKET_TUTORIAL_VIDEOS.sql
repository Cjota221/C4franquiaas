-- ============================================================================
-- CRIAR BUCKET PARA VÍDEOS TUTORIAIS NO SUPABASE STORAGE
-- ============================================================================

-- PASSO 1: Criar bucket (execute no SQL Editor ou crie manualmente no Storage)
-- Vá em Storage → Create Bucket → Nome: "tutorial-videos" → Public: true

-- PASSO 2: Configurar políticas de acesso ao bucket

-- Admin pode fazer UPLOAD
CREATE POLICY "Admin pode fazer upload de tutorial-videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tutorial-videos'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Admin pode DELETAR vídeos
CREATE POLICY "Admin pode deletar tutorial-videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tutorial-videos'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Todos podem VER vídeos (bucket público)
CREATE POLICY "Todos podem ver tutorial-videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'tutorial-videos');

-- VERIFICAR
SELECT * FROM storage.buckets WHERE name = 'tutorial-videos';
