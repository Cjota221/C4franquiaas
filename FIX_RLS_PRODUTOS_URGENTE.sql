-- ============================================
-- 🚨 FIX URGENTE - RLS PRODUTOS
-- Execute TODO este bloco no Supabase SQL Editor
-- ============================================

-- 1. Verificar se RLS está habilitado
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'produtos';

-- 2. Listar policies atuais
SELECT policyname, cmd, permissive, roles 
FROM pg_policies 
WHERE tablename = 'produtos';

-- 3. REMOVER TODAS as policies antigas de SELECT
DROP POLICY IF EXISTS "Produtos visíveis para todos autenticados" ON produtos;
DROP POLICY IF EXISTS "Produtos visíveis publicamente" ON produtos;
DROP POLICY IF EXISTS "produtos_select_authenticated" ON produtos;
DROP POLICY IF EXISTS "Todos podem ver produtos" ON produtos;
DROP POLICY IF EXISTS "Enable read access for all users" ON produtos;
DROP POLICY IF EXISTS "Allow select for authenticated" ON produtos;

-- 4. CRIAR policies novas
CREATE POLICY "produtos_select_auth" 
ON produtos FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "produtos_select_anon" 
ON produtos FOR SELECT 
TO anon 
USING (true);

-- 5. Verificar se funcionou
SELECT '✅ Policies criadas:' as status;
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'produtos' AND cmd = 'SELECT';

-- 6. Testar acesso
SELECT id, nome FROM produtos LIMIT 3;
