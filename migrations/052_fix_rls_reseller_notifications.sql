-- ============================================
-- Migration 052: Fix RLS para reseller_notifications
-- ============================================
-- Descrição: Permitir que revendedoras leiam suas próprias notificações
-- Data: 2026-01-01
-- ============================================

-- PASSO 1: Garantir que RLS está habilitado
-- ============================================
ALTER TABLE reseller_notifications ENABLE ROW LEVEL SECURITY;

-- PASSO 2: Remover políticas antigas (se existirem)
-- ============================================
DROP POLICY IF EXISTS "Revendedoras podem ver suas notificações" ON reseller_notifications;
DROP POLICY IF EXISTS "Revendedoras podem marcar como lidas" ON reseller_notifications;
DROP POLICY IF EXISTS "Admins podem gerenciar notificações" ON reseller_notifications;

-- PASSO 3: Criar política de leitura para revendedoras
-- ============================================
CREATE POLICY "Revendedoras podem ver suas notificações"
ON reseller_notifications
FOR SELECT
TO authenticated
USING (
  reseller_id IN (
    SELECT id FROM resellers 
    WHERE user_id = auth.uid()
  )
);

-- PASSO 4: Criar política de atualização (marcar como lida)
-- ============================================
CREATE POLICY "Revendedoras podem marcar como lidas"
ON reseller_notifications
FOR UPDATE
TO authenticated
USING (
  reseller_id IN (
    SELECT id FROM resellers 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  reseller_id IN (
    SELECT id FROM resellers 
    WHERE user_id = auth.uid()
  )
);

-- PASSO 5: Criar política de inserção para admins
-- ============================================
CREATE POLICY "Admins podem criar notificações"
ON reseller_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- PASSO 6: Criar política de gestão completa para admins
-- ============================================
CREATE POLICY "Admins podem gerenciar todas notificações"
ON reseller_notifications
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- PASSO 7: Comentários
-- ============================================
COMMENT ON POLICY "Revendedoras podem ver suas notificações" ON reseller_notifications IS 
  'Permite que revendedoras vejam apenas suas próprias notificações';

COMMENT ON POLICY "Revendedoras podem marcar como lidas" ON reseller_notifications IS 
  'Permite que revendedoras marquem suas notificações como lidas';

COMMENT ON POLICY "Admins podem criar notificações" ON reseller_notifications IS 
  'Permite que admins criem notificações para revendedoras';

COMMENT ON POLICY "Admins podem gerenciar todas notificações" ON reseller_notifications IS 
  'Permite que admins façam qualquer operação em notificações';

-- PASSO 8: Verificação final
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 052 aplicada com sucesso!';
  RAISE NOTICE '🔒 RLS configurado para reseller_notifications';
  RAISE NOTICE '👥 Revendedoras podem ler e atualizar suas notificações';
  RAISE NOTICE '🔑 Admins podem gerenciar todas notificações';
END $$;

-- ============================================
-- 🚀 EXECUTE ESTE SQL NO SUPABASE
-- ============================================
