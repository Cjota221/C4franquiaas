-- 🔧 SOLUÇÃO DRÁSTICA: PERMITIR TUDO NO BUCKET BANNER-UPLOADS

-- Remover TODAS as políticas do bucket banner-uploads
DROP POLICY IF EXISTS "Banner uploads - delete v2" ON storage.objects;
DROP POLICY IF EXISTS "Banner uploads - leitura v2" ON storage.objects;
DROP POLICY IF EXISTS "Banner uploads - update v2" ON storage.objects;
DROP POLICY IF EXISTS "Banner uploads - upload v2" ON storage.objects;

-- Criar UMA política que permite TUDO para usuários autenticados
CREATE POLICY "banner_uploads_allow_all" 
ON storage.objects 
FOR ALL 
TO authenticated
USING (bucket_id = 'banner-uploads')
WITH CHECK (bucket_id = 'banner-uploads');

-- Criar política de leitura pública
CREATE POLICY "banner_uploads_public_read" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'banner-uploads');

-- Verificar
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%banner%'
ORDER BY policyname;
