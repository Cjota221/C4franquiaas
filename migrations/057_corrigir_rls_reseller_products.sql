-- ============================================
-- Migration 057: Corrigir RLS da tabela reseller_products
-- ============================================
-- Descrição: Permite que revendedoras atualizem seus próprios produtos
-- Data: 2026-01-11
-- ============================================

-- 1️⃣ Verificar políticas atuais (debug)
DO $$
BEGIN
  RAISE NOTICE '📊 Verificando políticas atuais de reseller_products...';
END $$;

-- 2️⃣ Remover políticas antigas
DROP POLICY IF EXISTS "Produtos publicos para catalogo" ON reseller_products;
DROP POLICY IF EXISTS "Admin gerencia produtos" ON reseller_products;
DROP POLICY IF EXISTS "Revendedora gerencia seus produtos" ON reseller_products;
DROP POLICY IF EXISTS "Revendedora pode ver seus produtos" ON reseller_products;
DROP POLICY IF EXISTS "Revendedora pode atualizar seus produtos" ON reseller_products;

-- 3️⃣ Criar políticas CORRETAS

-- 3.1 SELECT: Qualquer um pode ver produtos ativos (para catálogo público)
CREATE POLICY "Produtos ativos visiveis no catalogo" 
  ON reseller_products 
  FOR SELECT 
  USING (is_active = true);

-- 3.2 SELECT: Revendedora pode ver TODOS os seus produtos (ativos ou não)
CREATE POLICY "Revendedora ve todos seus produtos" 
  ON reseller_products 
  FOR SELECT 
  USING (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
  );

-- 3.3 UPDATE: Revendedora pode atualizar APENAS seus próprios produtos
CREATE POLICY "Revendedora atualiza seus produtos" 
  ON reseller_products 
  FOR UPDATE 
  USING (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
  );

-- 3.4 INSERT: Revendedora pode inserir produtos para si mesma
CREATE POLICY "Revendedora insere seus produtos" 
  ON reseller_products 
  FOR INSERT 
  WITH CHECK (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
  );

-- 3.5 DELETE: Revendedora pode deletar seus próprios produtos
CREATE POLICY "Revendedora deleta seus produtos" 
  ON reseller_products 
  FOR DELETE 
  USING (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
  );

-- 3.6 ADMIN: Service role pode fazer tudo (para APIs e admin)
-- Nota: service_role já bypassa RLS por padrão no Supabase

-- 4️⃣ Verificar se RLS está habilitado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'reseller_products' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '⚠️ RLS não está habilitado em reseller_products, habilitando...';
    ALTER TABLE reseller_products ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 5️⃣ Garantir que RLS está habilitado
ALTER TABLE reseller_products ENABLE ROW LEVEL SECURITY;

-- 6️⃣ Verificar políticas criadas
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'reseller_products';
  
  RAISE NOTICE '✅ Total de políticas em reseller_products: %', policy_count;
END $$;

-- 7️⃣ Comentário
COMMENT ON TABLE reseller_products IS 
  'Tabela de produtos vinculados às revendedoras. RLS corrigido em 2026-01-11 para permitir que revendedoras atualizem seus próprios produtos.';
