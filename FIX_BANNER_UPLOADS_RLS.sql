-- 🔧 CORRIGIR POLÍTICAS DO BUCKET BANNER-UPLOADS

-- REMOVER TODAS as políticas (antigas E novas)
DROP POLICY IF EXISTS "Usuários podem fazer upload de banners" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus banners" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar seus banners" ON storage.objects;
DROP POLICY IF EXISTS "Banners são públicos para leitura" ON storage.objects;
DROP POLICY IF EXISTS "Banner uploads - leitura" ON storage.objects;
DROP POLICY IF EXISTS "Banner uploads - upload" ON storage.objects;
DROP POLICY IF EXISTS "Banner uploads - update" ON storage.objects;
DROP POLICY IF EXISTS "Banner uploads - delete" ON storage.objects;

-- CRIAR novas políticas SEM restrição de pasta
CREATE POLICY "Banner uploads - leitura v2" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'banner-uploads');

CREATE POLICY "Banner uploads - upload v2" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'banner-uploads');

CREATE POLICY "Banner uploads - update v2" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'banner-uploads')
WITH CHECK (bucket_id = 'banner-uploads');

CREATE POLICY "Banner uploads - delete v2" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'banner-uploads');

-- ✅ Verificar políticas criadas
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%Banner%'
ORDER BY policyname;
