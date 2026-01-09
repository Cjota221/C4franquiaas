-- 🔧 APLICAR TODAS AS POLÍTICAS RLS DE STORAGE

-- ============================================
-- BUCKET: LOGOS
-- ============================================

-- Remover políticas antigas do bucket 'logos'
DROP POLICY IF EXISTS "Logos são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload de logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar suas logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar suas logos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Logos públicas - leitura" ON storage.objects;
DROP POLICY IF EXISTS "Logos - upload autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Logos - update autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Logos - delete autenticado" ON storage.objects;

-- Criar políticas corretas para bucket 'logos'
CREATE POLICY "Logos públicas - leitura" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'logos');

CREATE POLICY "Logos - upload autenticado" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Logos - update autenticado" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'logos')
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Logos - delete autenticado" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'logos');

-- ============================================
-- BUCKET: RESELLER-ASSETS (Banners)
-- ============================================

-- Remover políticas antigas do bucket 'reseller-assets'
DROP POLICY IF EXISTS "Reseller assets são públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload de assets" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar assets" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar assets" ON storage.objects;
DROP POLICY IF EXISTS "Reseller assets - leitura" ON storage.objects;
DROP POLICY IF EXISTS "Reseller assets - upload" ON storage.objects;
DROP POLICY IF EXISTS "Reseller assets - update" ON storage.objects;
DROP POLICY IF EXISTS "Reseller assets - delete" ON storage.objects;

-- Criar políticas corretas para bucket 'reseller-assets'
CREATE POLICY "Reseller assets - leitura" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'reseller-assets');

CREATE POLICY "Reseller assets - upload" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'reseller-assets');

CREATE POLICY "Reseller assets - update" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'reseller-assets')
WITH CHECK (bucket_id = 'reseller-assets');

CREATE POLICY "Reseller assets - delete" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'reseller-assets');

-- ✅ PRONTO! Ambos os buckets configurados corretamente
