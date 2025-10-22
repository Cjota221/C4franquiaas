-- ============================================================================
-- APLICAR TODAS AS MIGRAÇÕES NECESSÁRIAS (007.5 + 008 + 009)
-- ============================================================================
-- Execute este arquivo completo no Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============================================================================
-- Migration 007.5: Fix franqueadas table ID column
-- ============================================================================

-- Ensure id column has default UUID generation
ALTER TABLE franqueadas 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ============================================================================
-- Migration 008: Add user_id to franqueadas for Supabase Auth integration
-- ============================================================================

-- Add user_id column to franqueadas table
ALTER TABLE franqueadas 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add senha_definida column
ALTER TABLE franqueadas 
ADD COLUMN IF NOT EXISTS senha_definida BOOLEAN DEFAULT false;

-- Add ultimo_acesso column
ALTER TABLE franqueadas 
ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_franqueadas_user_id ON franqueadas(user_id);

COMMENT ON COLUMN franqueadas.user_id IS 'ID do usuário no Supabase Auth vinculado a esta franqueada';
COMMENT ON COLUMN franqueadas.senha_definida IS 'Indica se a franqueada já definiu sua senha';
COMMENT ON COLUMN franqueadas.ultimo_acesso IS 'Data e hora do último acesso da franqueada';

-- ============================================================================
-- Migration 009: Add produtos_franqueadas_precos for custom pricing
-- ============================================================================

-- Create table for franqueada-specific product pricing
CREATE TABLE IF NOT EXISTS produtos_franqueadas_precos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_franqueada_id UUID NOT NULL REFERENCES produtos_franqueadas(id) ON DELETE CASCADE,
  preco_base DECIMAL(10,2) NOT NULL,           -- Admin's base price
  ajuste_tipo VARCHAR(20),                      -- 'fixo' or 'porcentagem'
  ajuste_valor DECIMAL(10,2),                   -- Adjustment value
  preco_final DECIMAL(10,2) NOT NULL,           -- Calculated final price
  ativo_no_site BOOLEAN DEFAULT false,          -- Active on franqueada's site
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(produto_franqueada_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_produtos_franqueadas_precos_produto ON produtos_franqueadas_precos(produto_franqueada_id);
CREATE INDEX IF NOT EXISTS idx_produtos_franqueadas_precos_ativo ON produtos_franqueadas_precos(ativo_no_site);

-- Add comments
COMMENT ON TABLE produtos_franqueadas_precos IS 'Preços personalizados dos produtos por franqueada';
COMMENT ON COLUMN produtos_franqueadas_precos.preco_base IS 'Preço base definido pelo admin';
COMMENT ON COLUMN produtos_franqueadas_precos.ajuste_tipo IS 'Tipo de ajuste: fixo (valor absoluto) ou porcentagem';
COMMENT ON COLUMN produtos_franqueadas_precos.ajuste_valor IS 'Valor do ajuste a ser aplicado';
COMMENT ON COLUMN produtos_franqueadas_precos.preco_final IS 'Preço final calculado após ajuste';
COMMENT ON COLUMN produtos_franqueadas_precos.ativo_no_site IS 'Se o produto está ativo no site da franqueada';

-- Add RLS policies
ALTER TABLE produtos_franqueadas_precos ENABLE ROW LEVEL SECURITY;

-- Policy: Franqueadas can read their own prices
CREATE POLICY "Franqueadas podem ver seus próprios preços" ON produtos_franqueadas_precos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM produtos_franqueadas pf
      JOIN franqueadas f ON pf.franqueada_id = f.id
      WHERE pf.id = produtos_franqueadas_precos.produto_franqueada_id
      AND f.user_id = auth.uid()
    )
  );

-- Policy: Franqueadas can update their own prices
CREATE POLICY "Franqueadas podem atualizar seus próprios preços" ON produtos_franqueadas_precos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM produtos_franqueadas pf
      JOIN franqueadas f ON pf.franqueada_id = f.id
      WHERE pf.id = produtos_franqueadas_precos.produto_franqueada_id
      AND f.user_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verificar colunas adicionadas em franqueadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'franqueadas' 
AND column_name IN ('user_id', 'senha_definida', 'ultimo_acesso')
ORDER BY column_name;

-- Verificar tabela produtos_franqueadas_precos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'produtos_franqueadas_precos'
ORDER BY ordinal_position;

-- Verificar índices criados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('franqueadas', 'produtos_franqueadas_precos')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migrações 008 e 009 aplicadas com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Próximos passos:';
  RAISE NOTICE '1. Verifique os resultados das queries acima';
  RAISE NOTICE '2. Teste o cadastro em /cadastro/franqueada';
  RAISE NOTICE '3. Aprove a franqueada em /admin/franqueadas';
  RAISE NOTICE '4. Crie um usuário no Supabase Auth';
  RAISE NOTICE '5. Vincule o user_id à franqueada';
  RAISE NOTICE '6. Teste o login em /franqueada/login';
END $$;
