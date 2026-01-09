-- 🔧 CORRIGIR POLÍTICAS RLS DO BUCKET LOGOS

-- Primeiro: REMOVER políticas antigas (se existirem)
DROP POLICY IF EXISTS "Logos são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload de logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar suas logos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar suas logos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- Agora: CRIAR políticas corretas

-- 1. Permitir que TODOS vejam as logos (leitura pública)
CREATE POLICY "Logos públicas - leitura" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'logos');

-- 2. Permitir que usuários AUTENTICADOS façam upload
CREATE POLICY "Logos - upload autenticado" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- 3. Permitir que usuários atualizem qualquer logo (autenticados)
CREATE POLICY "Logos - update autenticado" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'logos')
WITH CHECK (bucket_id = 'logos');

-- 4. Permitir que usuários deletem qualquer logo (autenticados)
CREATE POLICY "Logos - delete autenticado" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'logos');

-- ✅ PRONTO! Agora qualquer usuário autenticado pode fazer upload de logos
