-- ============================================================================
-- Migration 045: Campo de data de aprovação
-- ============================================================================
-- Description: Adiciona campo para registrar quando a revendedora foi aprovada
-- Date: 2024-12-29

-- STEP 1: Adicionar campo approved_at
ALTER TABLE resellers 
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- STEP 2: Adicionar comentário
COMMENT ON COLUMN resellers.approved_at IS 'Data e hora em que a revendedora foi aprovada';

-- STEP 3: Atualizar revendedoras já aprovadas (definir data como created_at)
UPDATE resellers 
SET approved_at = created_at 
WHERE status = 'aprovada' AND approved_at IS NULL;

-- STEP 4: Validação
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 045 aplicada com sucesso!';
  RAISE NOTICE 'Campo approved_at adicionado à tabela resellers';
END $$;
