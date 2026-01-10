-- 🔍 VERIFICAR POLÍTICAS NA TABELA BUCKETS

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'buckets'
ORDER BY policyname;
