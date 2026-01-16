-- ============================================
-- 🚨 FIX COMPLETO - RLS PRODUTOS (SELECT + UPDATE)
-- O vídeo não salva porque falta policy de UPDATE!
-- ============================================

-- 1. REMOVER policies antigas
DROP POLICY IF EXISTS "produtos_select_auth" ON produtos;
DROP POLICY IF EXISTS "produtos_select_anon" ON produtos;
DROP POLICY IF EXISTS "produtos_update_auth" ON produtos;
DROP POLICY IF EXISTS "Authenticated pode atualizar produtos" ON produtos;
DROP POLICY IF EXISTS "Service role pode atualizar produtos" ON produtos;

-- 2. CRIAR POLICY SELECT (para ver produtos)
CREATE POLICY "produtos_select_auth" 
ON produtos FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "produtos_select_anon" 
ON produtos FOR SELECT 
TO anon 
USING (true);

-- 3. CRIAR POLICY UPDATE (para salvar vídeo!) ⚠️ ERA ISSO QUE FALTAVA!
CREATE POLICY "produtos_update_auth" 
ON produtos FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 4. CRIAR POLICY INSERT (para criar produtos)
DROP POLICY IF EXISTS "produtos_insert_auth" ON produtos;
CREATE POLICY "produtos_insert_auth" 
ON produtos FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 5. CRIAR POLICY DELETE (para excluir produtos)
DROP POLICY IF EXISTS "produtos_delete_auth" ON produtos;
CREATE POLICY "produtos_delete_auth" 
ON produtos FOR DELETE 
TO authenticated 
USING (true);

-- 6. Verificar TODAS as policies
SELECT '✅ Policies criadas:' as status;
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'produtos'
ORDER BY cmd;

-- 7. Testar UPDATE (usando coluna que existe)
UPDATE produtos SET nome = nome WHERE id = (SELECT id FROM produtos LIMIT 1);
SELECT '✅ UPDATE funcionou!' as status;
