-- 🔍 VERIFICAR TODOS OS BUCKETS DE STORAGE

-- 1. Listar todos os buckets existentes
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets 
ORDER BY name;

-- 2. Ver políticas de cada bucket
SELECT 
  policyname as name,
  tablename,
  cmd as command
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;
