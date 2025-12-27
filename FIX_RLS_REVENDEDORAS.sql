-- ============================================================================
-- FIX: Políticas RLS para Revendedoras funcionarem corretamente
-- ============================================================================
-- Execute no Supabase SQL Editor

-- 1. Permitir que revendedoras vejam seus próprios dados (mesmo pendentes)
DROP POLICY IF EXISTS "Revendedora pode ver seus dados" ON resellers;
CREATE POLICY "Revendedora pode ver seus dados" 
  ON resellers FOR SELECT 
  USING (auth.uid() = user_id);

-- 2. Permitir que revendedoras atualizem seus próprios dados
DROP POLICY IF EXISTS "Revendedora pode atualizar seus dados" ON resellers;
CREATE POLICY "Revendedora pode atualizar seus dados" 
  ON resellers FOR UPDATE 
  USING (auth.uid() = user_id);

-- 3. Permitir leitura de revendedoras aprovadas (para catálogo público)
DROP POLICY IF EXISTS "Resellers publicos para leitura" ON resellers;
CREATE POLICY "Resellers publicos para leitura" 
  ON resellers FOR SELECT 
  USING (status = 'aprovada' AND is_active = true);

-- 4. Permitir cadastro público
DROP POLICY IF EXISTS "Cadastro publico de revendedoras" ON resellers;
CREATE POLICY "Cadastro publico de revendedoras" 
  ON resellers FOR INSERT 
  WITH CHECK (true);

-- 5. Políticas para reseller_products
DROP POLICY IF EXISTS "Revendedora pode ver seus produtos" ON reseller_products;
CREATE POLICY "Revendedora pode ver seus produtos" 
  ON reseller_products FOR SELECT 
  USING (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Revendedora pode gerenciar seus produtos" ON reseller_products;
CREATE POLICY "Revendedora pode gerenciar seus produtos" 
  ON reseller_products FOR ALL 
  USING (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
  );

-- 6. Verificar se a revendedora existe
SELECT id, name, email, status, is_active, user_id 
FROM resellers 
ORDER BY created_at DESC 
LIMIT 5;

-- ✅ Pronto!
SELECT '✅ Políticas RLS atualizadas!' as status;
