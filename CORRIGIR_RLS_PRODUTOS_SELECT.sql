-- ============================================
-- 🚨 CORREÇÃO URGENTE: RLS Policy SELECT em Produtos
-- ============================================
-- ERRO: 403 ao acessar produtos (GET /rest/v1/produtos?id=eq.xxx)
-- CAUSA: RLS habilitado na tabela 'produtos' mas sem policy de SELECT
-- ============================================

-- 1️⃣ VERIFICAR ESTADO ATUAL
SELECT 
  relname as tabela,
  relrowsecurity as rls_ativo
FROM pg_class
WHERE relname = 'produtos';

SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'produtos';

-- 2️⃣ CRIAR POLICY DE SELECT (que está faltando!)
-- ============================================

-- Remover policy antiga se existir
DROP POLICY IF EXISTS "Produtos visíveis para todos autenticados" ON produtos;
DROP POLICY IF EXISTS "produtos_select_authenticated" ON produtos;
DROP POLICY IF EXISTS "Todos podem ver produtos" ON produtos;

-- Policy: Usuários autenticados podem ver todos os produtos
CREATE POLICY "Produtos visíveis para todos autenticados"
ON produtos
FOR SELECT
TO authenticated
USING (true);

-- Policy: Acesso anônimo para visualização pública (catálogo)
DROP POLICY IF EXISTS "Produtos visíveis publicamente" ON produtos;
CREATE POLICY "Produtos visíveis publicamente"
ON produtos
FOR SELECT
TO anon
USING (true);

-- 3️⃣ GARANTIR POLICIES DE INSERT/UPDATE TAMBÉM
-- ============================================

-- Service role pode inserir
DROP POLICY IF EXISTS "Service role pode inserir produtos" ON produtos;
CREATE POLICY "Service role pode inserir produtos"
ON produtos
FOR INSERT
TO service_role
WITH CHECK (true);

-- Service role pode atualizar
DROP POLICY IF EXISTS "Service role pode atualizar produtos" ON produtos;
CREATE POLICY "Service role pode atualizar produtos"
ON produtos
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated pode inserir (para sync do ERP)
DROP POLICY IF EXISTS "Authenticated pode inserir produtos" ON produtos;
CREATE POLICY "Authenticated pode inserir produtos"
ON produtos
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated pode atualizar
DROP POLICY IF EXISTS "Authenticated pode atualizar produtos" ON produtos;
CREATE POLICY "Authenticated pode atualizar produtos"
ON produtos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4️⃣ VERIFICAÇÃO FINAL
-- ============================================

SELECT 
  '✅ Políticas criadas com sucesso!' as status,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'produtos'
ORDER BY cmd, policyname;

-- ============================================
-- 📋 INSTRUÇÕES:
-- 1. Abra o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole e execute TODO este SQL
-- 4. Teste novamente a página /admin/produtos
-- ============================================
