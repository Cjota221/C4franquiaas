-- ============================================
-- 🚨 CORREÇÃO URGENTE: RLS Policies
-- ============================================
-- Erro: 403 Forbidden em reseller_notifications
-- ============================================

-- 1️⃣ VERIFICAR políticas atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('reseller_notifications', 'produtos', 'reseller_products')
ORDER BY tablename, policyname;

-- 2️⃣ RECRIAR política para reseller_notifications (se não existir)
-- ============================================

-- Remover políticas existentes (se houver problema)
DROP POLICY IF EXISTS "Revendedoras podem ver suas notificações" ON reseller_notifications;
DROP POLICY IF EXISTS "reseller_can_view_own_notifications" ON reseller_notifications;
DROP POLICY IF EXISTS "Revendedoras veem suas notificações" ON reseller_notifications;

-- Criar política correta
CREATE POLICY "Revendedoras podem ver suas notificações"
ON reseller_notifications
FOR SELECT
TO authenticated
USING (
  reseller_id IN (
    SELECT id FROM resellers WHERE user_id = auth.uid()
  )
);

-- 3️⃣ VERIFICAR política de produtos
-- ============================================
DROP POLICY IF EXISTS "Produtos visíveis para todos autenticados" ON produtos;

CREATE POLICY "Produtos visíveis para todos autenticados"
ON produtos
FOR SELECT
TO authenticated
USING (true);

-- 4️⃣ VERIFICAR política de reseller_products
-- ============================================
DROP POLICY IF EXISTS "Revendedoras veem seus produtos" ON reseller_products;

CREATE POLICY "Revendedoras veem seus produtos"
ON reseller_products
FOR SELECT
TO authenticated
USING (
  reseller_id IN (
    SELECT id FROM resellers WHERE user_id = auth.uid()
  )
);

-- 5️⃣ TESTAR após aplicar
-- ============================================
SELECT 'Políticas recriadas com sucesso!' as status;

-- ============================================
-- 🔧 EXECUTE ESTE SQL COMPLETO NO SUPABASE
-- ============================================
