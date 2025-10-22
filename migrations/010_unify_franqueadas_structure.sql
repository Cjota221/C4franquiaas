-- ============================================================================
-- Migration 010: Unify franqueadas structure with lojas
-- ============================================================================
-- Description: Adds loja data and financial tracking to franqueadas
-- Author: GitHub Copilot
-- Date: 2025-10-21
-- ============================================================================

-- Add financial tracking columns to franqueadas
ALTER TABLE franqueadas 
ADD COLUMN IF NOT EXISTS vendas_total DECIMAL(10,2) DEFAULT 0;

ALTER TABLE franqueadas 
ADD COLUMN IF NOT EXISTS comissao_acumulada DECIMAL(10,2) DEFAULT 0;

-- Create lojas table
CREATE TABLE IF NOT EXISTS lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franqueada_id UUID NOT NULL REFERENCES franqueadas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  dominio VARCHAR(255) UNIQUE NOT NULL,
  logo TEXT,
  cor_primaria VARCHAR(7) DEFAULT '#DB1472',
  cor_secundaria VARCHAR(7) DEFAULT '#F8B81F',
  ativo BOOLEAN DEFAULT true,
  produtos_ativos INTEGER DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(franqueada_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lojas_franqueada ON lojas(franqueada_id);
CREATE INDEX IF NOT EXISTS idx_lojas_dominio ON lojas(dominio);
CREATE INDEX IF NOT EXISTS idx_lojas_ativo ON lojas(ativo);

-- Add RLS policies
ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can see all lojas
CREATE POLICY "Admin pode ver todas as lojas" ON lojas
  FOR SELECT
  USING (true);

-- Policy: Franqueadas can see their own loja
CREATE POLICY "Franqueadas podem ver sua própria loja" ON lojas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM franqueadas f
      WHERE f.id = lojas.franqueada_id
      AND f.user_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON COLUMN franqueadas.vendas_total IS 'Total de vendas acumuladas da franqueada';
COMMENT ON COLUMN franqueadas.comissao_acumulada IS 'Total de comissões acumuladas';
COMMENT ON TABLE lojas IS 'Lojas online das franqueadas';
COMMENT ON COLUMN lojas.nome IS 'Nome da loja/franquia';
COMMENT ON COLUMN lojas.dominio IS 'Domínio único da loja (ex: mariacosmeticos)';
COMMENT ON COLUMN lojas.logo IS 'URL do logotipo da loja';
COMMENT ON COLUMN lojas.cor_primaria IS 'Cor primária da loja (hex)';
COMMENT ON COLUMN lojas.cor_secundaria IS 'Cor secundária da loja (hex)';
COMMENT ON COLUMN lojas.ativo IS 'Se a loja está ativa e acessível';
COMMENT ON COLUMN lojas.produtos_ativos IS 'Contador de produtos ativos no catálogo';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the changes:
--
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'franqueadas' 
-- AND column_name IN ('vendas_total', 'comissao_acumulada')
-- ORDER BY column_name;
--
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'lojas'
-- ORDER BY ordinal_position;
--
-- SELECT COUNT(*) as total_lojas FROM lojas;
-- ============================================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 010 aplicada com sucesso!';
  RAISE NOTICE '📊 Estrutura unificada criada';
  RAISE NOTICE '🏪 Tabela lojas criada';
  RAISE NOTICE '💰 Colunas financeiras adicionadas';
END $$;
