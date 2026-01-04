-- ============================================================================
-- FIX: RLS para reseller_notifications (403 Error)
-- ============================================================================
-- Problema: Revendedoras estão recebendo 403 ao tentar ver notificações

-- PASSO 1: Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'reseller_notifications'
);

-- PASSO 2: Dropar políticas antigas (se existirem)
DROP POLICY IF EXISTS "Revendedoras podem ver suas notificações" ON reseller_notifications;
DROP POLICY IF EXISTS "Revendedoras podem atualizar suas notificações" ON reseller_notifications;
DROP POLICY IF EXISTS "Sistema pode criar notificações" ON reseller_notifications;

-- PASSO 3: Habilitar RLS
ALTER TABLE reseller_notifications ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Criar políticas corretas

-- Revendedoras podem ver suas próprias notificações
CREATE POLICY "Revendedoras podem ver suas notificações"
ON reseller_notifications
FOR SELECT
TO authenticated
USING (reseller_id IN (
  SELECT id FROM resellers WHERE user_id = auth.uid()
));

-- Revendedoras podem marcar como lida
CREATE POLICY "Revendedoras podem atualizar suas notificações"
ON reseller_notifications
FOR UPDATE
TO authenticated
USING (reseller_id IN (
  SELECT id FROM resellers WHERE user_id = auth.uid()
))
WITH CHECK (reseller_id IN (
  SELECT id FROM resellers WHERE user_id = auth.uid()
));

-- Sistema/Admin pode criar notificações (service_role)
CREATE POLICY "Sistema pode criar notificações"
ON reseller_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- PASSO 5: Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'reseller_notifications'
ORDER BY policyname;
