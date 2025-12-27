-- ============================================================================
-- Migration 034: Adicionar campos extras para cadastro de Revendedoras
-- ============================================================================
-- Description: Adiciona CPF, cidade e estado na tabela resellers
-- Date: 2025-12-27
-- Prerequisite: Migration 033 must be applied first

-- STEP 1: Adicionar colunas de dados pessoais
ALTER TABLE resellers 
  ADD COLUMN IF NOT EXISTS cpf VARCHAR(14),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(2);

-- STEP 2: Criar índice para busca por cidade/estado
CREATE INDEX IF NOT EXISTS idx_resellers_city_state ON resellers(city, state);

-- STEP 3: Adicionar comentários
COMMENT ON COLUMN resellers.cpf IS 'CPF da revendedora (formato: 000.000.000-00)';
COMMENT ON COLUMN resellers.city IS 'Cidade da revendedora';
COMMENT ON COLUMN resellers.state IS 'Estado da revendedora (UF, 2 caracteres)';

-- STEP 4: Adicionar policy para permitir INSERT público (para cadastro)
DROP POLICY IF EXISTS "Cadastro publico de revendedoras" ON resellers;
CREATE POLICY "Cadastro publico de revendedoras" 
  ON resellers FOR INSERT 
  WITH CHECK (true);

-- STEP 5: Validação
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 034 aplicada com sucesso!';
  RAISE NOTICE 'Tabela resellers agora tem campos: cpf, city, state';
END $$;
