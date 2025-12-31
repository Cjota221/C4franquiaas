-- ============================================================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA: Proteger dados sensíveis de revendedoras
-- ============================================================================
-- PROBLEMA: A tabela resellers expõe TODOS os dados publicamente (CPF, email, etc)
-- SOLUÇÃO: Criar VIEW pública com apenas dados necessários + Atualizar RLS
-- ============================================================================

-- STEP 1: Criar VIEW pública segura (apenas dados necessários para catálogo)
DROP VIEW IF EXISTS resellers_public CASCADE;

CREATE VIEW resellers_public AS
SELECT 
  id,
  store_name,
  slug,
  phone,  -- Telefone para WhatsApp do catálogo
  logo_url,
  banner_url,
  banner_mobile_url,
  bio,
  instagram,
  facebook,
  colors,
  theme_settings,
  catalog_views,
  total_products,
  is_active,
  status,
  created_at
FROM resellers
WHERE status = 'aprovada' AND is_active = true;

-- STEP 2: Adicionar RLS na VIEW
ALTER VIEW resellers_public SET (security_invoker = true);

-- STEP 3: Grant de leitura pública
GRANT SELECT ON resellers_public TO anon, authenticated;

-- STEP 4: Remover políticas existentes
DROP POLICY IF EXISTS "Resellers publicos para leitura" ON resellers;
DROP POLICY IF EXISTS "Revendedora vê apenas seus dados completos" ON resellers;
DROP POLICY IF EXISTS "Revendedora pode ver seus dados" ON resellers;
DROP POLICY IF EXISTS "Revendedora pode atualizar seus dados" ON resellers;
DROP POLICY IF EXISTS "Admin gerencia resellers" ON resellers;

-- STEP 5: Criar política RLS mais restritiva na tabela resellers
-- Apenas autenticados podem ler seus próprios dados ou admin pode ver tudo
CREATE POLICY "Revendedora vê apenas seus dados completos" 
  ON resellers FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR 
    auth.jwt() ->> 'user_role' = 'admin'
  );

-- STEP 6: Permitir revendedora atualizar seus próprios dados
CREATE POLICY "Revendedora atualiza seus dados" 
  ON resellers FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- STEP 7: Política para admin gerenciar tudo
CREATE POLICY "Admin gerencia resellers" 
  ON resellers FOR ALL 
  USING (auth.jwt() ->> 'user_role' = 'admin');

-- STEP 8: Adicionar comentários de segurança
COMMENT ON VIEW resellers_public IS 'VIEW PÚBLICA SEGURA: Expõe apenas dados não-sensíveis para catálogos';
COMMENT ON COLUMN resellers.cpf IS 'DADO SENSÍVEL - Não expor publicamente';
COMMENT ON COLUMN resellers.email IS 'DADO SENSÍVEL - Não expor publicamente';
COMMENT ON COLUMN resellers.birth_date IS 'DADO SENSÍVEL - Não expor publicamente';
COMMENT ON COLUMN resellers.cep IS 'DADO SENSÍVEL - Não expor publicamente';
COMMENT ON COLUMN resellers.street IS 'DADO SENSÍVEL - Não expor publicamente';
COMMENT ON COLUMN resellers.number IS 'DADO SENSÍVEL - Não expor publicamente';
COMMENT ON COLUMN resellers.neighborhood IS 'DADO SENSÍVEL - Não expor publicamente';
COMMENT ON COLUMN resellers.city IS 'DADO SENSÍVEL - Não expor publicamente';
COMMENT ON COLUMN resellers.state IS 'DADO SENSÍVEL - Não expor publicamente';

-- STEP 9: Validação final
DO $$
DECLARE
  view_exists boolean;
  policy_exists boolean;
BEGIN
  -- Verificar se a VIEW foi criada
  SELECT EXISTS (
    SELECT 1 FROM pg_views WHERE viewname = 'resellers_public'
  ) INTO view_exists;
  
  IF view_exists THEN
    RAISE NOTICE '✅ VIEW resellers_public criada com sucesso';
  ELSE
    RAISE EXCEPTION '❌ Falha ao criar VIEW resellers_public';
  END IF;
  
  -- Verificar políticas RLS
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'resellers' 
    AND policyname = 'Revendedora vê apenas seus dados completos'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    RAISE NOTICE '✅ Política RLS restritiva aplicada';
  ELSE
    RAISE EXCEPTION '❌ Falha ao aplicar política RLS';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔒 CORREÇÃO DE SEGURANÇA APLICADA COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Resumo:';
  RAISE NOTICE '  ✓ Dados sensíveis protegidos (CPF, email, endereço, etc)';
  RAISE NOTICE '  ✓ VIEW pública criada com apenas dados necessários';
  RAISE NOTICE '  ✓ RLS restritivo aplicado na tabela resellers';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  AÇÃO NECESSÁRIA NO CÓDIGO:';
  RAISE NOTICE '  • Atualizar queries públicas para usar resellers_public';
  RAISE NOTICE '  • Queries autenticadas continuam usando resellers';
  RAISE NOTICE '';
END $$;
