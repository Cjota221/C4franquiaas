-- 🔍 VERIFICAR SE BUCKET 'LOGOS' EXISTE

-- 1. Ver se bucket existe e suas configurações
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE name = 'logos';

-- 2. Ver políticas RLS do bucket (se existir)
SELECT 
  policyname as name,
  tablename,
  cmd as command,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- 3. Ver arquivos no bucket (se existir)
SELECT 
  name,
  bucket_id,
  created_at,
  updated_at
FROM storage.objects 
WHERE bucket_id = 'logos'
ORDER BY created_at DESC
LIMIT 10;
