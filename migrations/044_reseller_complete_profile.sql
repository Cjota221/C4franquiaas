-- ============================================================================
-- Migration 044: Perfil Completo de Revendedoras
-- ============================================================================
-- Description: Adiciona campos para cadastro profissional completo
-- Date: 2024-12-29

-- STEP 1: Adicionar campos de redes sociais e endereço completo
ALTER TABLE resellers 
  ADD COLUMN IF NOT EXISTS instagram VARCHAR(100),
  ADD COLUMN IF NOT EXISTS facebook VARCHAR(200),
  ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
  ADD COLUMN IF NOT EXISTS street VARCHAR(200),
  ADD COLUMN IF NOT EXISTS number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS complement VARCHAR(100),
  ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100),
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS about_me TEXT,
  ADD COLUMN IF NOT EXISTS how_did_you_find_us VARCHAR(100),
  ADD COLUMN IF NOT EXISTS has_experience_selling BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS main_sales_channel VARCHAR(100),
  ADD COLUMN IF NOT EXISTS expected_monthly_sales VARCHAR(50);

-- STEP 2: Criar índices para busca
CREATE INDEX IF NOT EXISTS idx_resellers_instagram ON resellers(instagram);
CREATE INDEX IF NOT EXISTS idx_resellers_cep ON resellers(cep);

-- STEP 3: Adicionar comentários
COMMENT ON COLUMN resellers.instagram IS 'Username do Instagram (sem @)';
COMMENT ON COLUMN resellers.facebook IS 'URL ou username do Facebook';
COMMENT ON COLUMN resellers.cep IS 'CEP do endereço (formato: 00000-000)';
COMMENT ON COLUMN resellers.street IS 'Logradouro/Rua';
COMMENT ON COLUMN resellers.number IS 'Número do endereço';
COMMENT ON COLUMN resellers.complement IS 'Complemento (apto, bloco, etc)';
COMMENT ON COLUMN resellers.neighborhood IS 'Bairro';
COMMENT ON COLUMN resellers.birth_date IS 'Data de nascimento';
COMMENT ON COLUMN resellers.about_me IS 'Breve descrição sobre a revendedora';
COMMENT ON COLUMN resellers.how_did_you_find_us IS 'Como conheceu a marca';
COMMENT ON COLUMN resellers.has_experience_selling IS 'Tem experiência com vendas?';
COMMENT ON COLUMN resellers.main_sales_channel IS 'Principal canal de vendas';
COMMENT ON COLUMN resellers.expected_monthly_sales IS 'Expectativa de vendas mensais';

-- STEP 4: Validação
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 044 aplicada com sucesso!';
  RAISE NOTICE 'Campos adicionados: instagram, facebook, cep, street, number, complement, neighborhood, birth_date, about_me, how_did_you_find_us, has_experience_selling, main_sales_channel, expected_monthly_sales';
END $$;
