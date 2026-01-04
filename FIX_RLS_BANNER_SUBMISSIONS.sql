-- ============================================================================
-- CORRIGIR RLS DE BANNER_SUBMISSIONS PARA REVENDEDORAS
-- ============================================================================

-- Ver as policies atuais
SELECT * FROM pg_policies WHERE tablename = 'banner_submissions';

-- Dropar policies antigas se existirem
DROP POLICY IF EXISTS "Revendedoras podem gerenciar banner_submissions" ON banner_submissions;
DROP POLICY IF EXISTS "Revendedoras podem ver seus banners" ON banner_submissions;
DROP POLICY IF EXISTS "Revendedoras podem inserir banners" ON banner_submissions;
DROP POLICY IF EXISTS "Revendedoras podem atualizar seus banners" ON banner_submissions;

-- Revendedoras podem VER apenas seus próprios banners
CREATE POLICY "Revendedoras podem ver seus banner_submissions"
ON banner_submissions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'revendedora'
  )
);

-- Revendedoras podem INSERIR seus próprios banners
CREATE POLICY "Revendedoras podem criar banner_submissions"
ON banner_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'revendedora'
  )
);

-- Revendedoras podem ATUALIZAR apenas seus banners pendentes
CREATE POLICY "Revendedoras podem atualizar seus banner_submissions pendentes"
ON banner_submissions
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'revendedora'
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'
);

-- Revendedoras podem DELETAR apenas seus banners pendentes
CREATE POLICY "Revendedoras podem deletar seus banner_submissions pendentes"
ON banner_submissions
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'revendedora'
  )
);

-- Verificar policies criadas
SELECT * FROM pg_policies WHERE tablename = 'banner_submissions' ORDER BY policyname;
