-- ============================================================================
-- Migration 033: Adicionar Sistema de Aprovação para Revendedoras
-- ============================================================================
-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR

-- STEP 1: Adicionar colunas de status e aprovação
ALTER TABLE resellers 
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- STEP 2: Atualizar registros existentes que já têm email cadastrado
-- (Mantém como pendente para você aprovar manualmente)
UPDATE resellers 
SET status = 'pendente' 
WHERE status IS NULL;

-- STEP 3: Criar índices
CREATE INDEX IF NOT EXISTS idx_resellers_status ON resellers(status);
CREATE INDEX IF NOT EXISTS idx_resellers_user_id ON resellers(user_id);

-- STEP 4: Atualizar RLS Policies
DROP POLICY IF EXISTS "Resellers publicos para leitura" ON resellers;
CREATE POLICY "Resellers publicos para leitura" 
  ON resellers FOR SELECT 
  USING (status = 'aprovada' AND is_active = true);

DROP POLICY IF EXISTS "Revendedora pode ver seus dados" ON resellers;
CREATE POLICY "Revendedora pode ver seus dados" 
  ON resellers FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Revendedora pode atualizar seus dados" ON resellers;
CREATE POLICY "Revendedora pode atualizar seus dados" 
  ON resellers FOR UPDATE 
  USING (auth.uid() = user_id);

-- STEP 5: Comentários
COMMENT ON COLUMN resellers.status IS 'Status de aprovação: pendente, aprovada, rejeitada';
COMMENT ON COLUMN resellers.user_id IS 'Referência ao usuário autenticado no auth.users';
COMMENT ON COLUMN resellers.rejection_reason IS 'Motivo da rejeição do cadastro (opcional)';

SELECT 'Migration 033 aplicada com sucesso!' as resultado;
