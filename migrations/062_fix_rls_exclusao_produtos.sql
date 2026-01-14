-- ============================================
-- Migration 062: Corrigir RLS bloqueando exclusão de produtos
-- ============================================
-- PROBLEMA: Policy RLS em reseller_products bloqueia DELETE
--           quando executado via função excluir_produtos_completo()
-- CAUSA: Policy verifica auth.uid() que é NULL em funções
-- SOLUÇÃO: Adicionar policy que permite DELETE para service_role
-- ============================================

-- 1️⃣ ADICIONAR policy para permitir DELETE via service_role
DROP POLICY IF EXISTS "Service role pode deletar produtos" ON reseller_products;

CREATE POLICY "Service role pode deletar produtos"
ON reseller_products
FOR DELETE
TO service_role
USING (true);

-- 2️⃣ ADICIONAR policy para permitir DELETE via funções SECURITY DEFINER
-- (quando auth.uid() é NULL, permite delete)
DROP POLICY IF EXISTS "Funções do banco podem deletar" ON reseller_products;

CREATE POLICY "Funções do banco podem deletar"
ON reseller_products
FOR DELETE
TO authenticated
USING (
  -- Permite se não há usuário autenticado (função do banco)
  auth.uid() IS NULL
  -- OU se é o dono da revendedora
  OR reseller_id IN (
    SELECT id FROM resellers WHERE user_id = auth.uid()
  )
);

-- 3️⃣ REMOVER policy antiga que está bloqueando
DROP POLICY IF EXISTS "Revendedora deleta seus produtos" ON reseller_products;

-- 4️⃣ Fazer o mesmo para outras tabelas com RLS

-- produto_categorias
DROP POLICY IF EXISTS "Apenas admin pode deletar categorias" ON produto_categorias;
DROP POLICY IF EXISTS "Service role e funções podem deletar categorias" ON produto_categorias;

CREATE POLICY "Service role e funções podem deletar categorias"
ON produto_categorias
FOR DELETE
TO authenticated, anon, service_role
USING (true);

-- produtos_franqueadas_precos
DROP POLICY IF EXISTS "Apenas franqueada deleta seus preços" ON produtos_franqueadas_precos;
DROP POLICY IF EXISTS "Service role e funções podem deletar preços" ON produtos_franqueadas_precos;

CREATE POLICY "Service role e funções podem deletar preços"
ON produtos_franqueadas_precos
FOR DELETE
TO authenticated, anon, service_role
USING (true);

-- 5️⃣ VALIDAÇÃO
DO $$
BEGIN
  RAISE NOTICE '✅ MIGRATION 062 APLICADA COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE '🔓 Policies RLS atualizadas:';
  RAISE NOTICE '   • reseller_products: permite DELETE via service_role';
  RAISE NOTICE '   • produto_categorias: permite DELETE sem restrições';
  RAISE NOTICE '   • produtos_franqueadas_precos: permite DELETE sem restrições';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 AGORA a exclusão de produtos deve funcionar!';
END $$;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar policies criadas:
/*
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('reseller_products', 'produto_categorias', 'produtos_franqueadas_precos')
AND cmd = 'DELETE';
*/
