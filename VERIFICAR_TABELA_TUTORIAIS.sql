-- ============================================================================
-- VERIFICAR SE TABELA tutorial_videos EXISTE
-- ============================================================================
-- COPIE E COLE NO SUPABASE SQL EDITOR: https://supabase.com/dashboard/project/rprucmoavblepodvanga/sql/new

-- 1. VERIFICAR SE A TABELA EXISTE
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'tutorial_videos'
) AS tabela_existe;

-- 2. SE EXISTIR, MOSTRAR ESTRUTURA
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tutorial_videos'
ORDER BY ordinal_position;

-- 3. VERIFICAR POLICIES
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'tutorial_videos';

-- 4. VERIFICAR BUCKET
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'tutorial-videos';

-- 5. VERIFICAR POLICIES DO BUCKET
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects' 
AND policyname ILIKE '%tutorial%';

-- ============================================================================
-- SE A TABELA NÃO EXISTIR, EXECUTE O ARQUIVO: EXECUTAR_AGORA_TUTORIAIS.sql
-- ============================================================================
