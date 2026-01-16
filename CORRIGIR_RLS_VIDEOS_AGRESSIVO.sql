-- ============================================================================
-- CORRIGIR RLS BUCKET VIDEOS - VERSÃO AGRESSIVA
-- Remove TODAS as políticas e recria do zero
-- ============================================================================

-- 1. LISTAR TODAS AS POLÍTICAS EXISTENTES (para debug)
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 2. REMOVER TODAS AS POLÍTICAS DO BUCKET VIDEOS
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND (policyname ILIKE '%video%' OR policyname ILIKE '%vídeo%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    RAISE NOTICE 'Removida política: %', pol.policyname;
  END LOOP;
END $$;

-- 3. DELETAR E RECRIAR O BUCKET
DELETE FROM storage.buckets WHERE id = 'videos';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  104857600, -- 100MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
);

-- 4. CRIAR POLÍTICAS SIMPLES E PERMISSIVAS

-- SELECT: Qualquer um pode ler
CREATE POLICY "videos_select_all"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- INSERT: Qualquer um pode fazer upload (sem restrição de auth)
CREATE POLICY "videos_insert_all"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos');

-- UPDATE: Qualquer um pode atualizar
CREATE POLICY "videos_update_all"
ON storage.objects FOR UPDATE
USING (bucket_id = 'videos')
WITH CHECK (bucket_id = 'videos');

-- DELETE: Qualquer um pode deletar
CREATE POLICY "videos_delete_all"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos');

-- 5. VERIFICAR
SELECT '✅ Bucket criado' as status, id, public, file_size_limit 
FROM storage.buckets WHERE id = 'videos';

SELECT '✅ Políticas criadas' as status, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE 'videos_%';
