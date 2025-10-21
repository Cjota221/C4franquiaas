-- ============================================================================
-- Migration 007: Sistema de Franqueadas e Vinculação de Produtos
-- ============================================================================
-- Description: Creates tables for franchise management and product linking
-- Author: GitHub Copilot
-- Date: 2025-10-21
-- 
-- This migration creates:
-- 1. franqueadas table (franchise owners/stores)
-- 2. produtos_franqueadas junction table (product-franchise relationship)
-- 3. All necessary indexes and RLS policies
-- ============================================================================

-- ============================================================================
-- STEP 1: Create franqueadas table
-- ============================================================================

CREATE TABLE IF NOT EXISTS franqueadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  cpf VARCHAR(14),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada')),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  aprovado_em TIMESTAMP WITH TIME ZONE,
  aprovado_por UUID,
  observacoes TEXT
);

-- Add indexes for franqueadas
CREATE INDEX IF NOT EXISTS idx_franqueadas_status ON franqueadas(status);
CREATE INDEX IF NOT EXISTS idx_franqueadas_email ON franqueadas(email);
CREATE INDEX IF NOT EXISTS idx_franqueadas_criado_em ON franqueadas(criado_em DESC);

-- ============================================================================
-- STEP 2: Create produtos_franqueadas junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS produtos_franqueadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  franqueada_id UUID NOT NULL REFERENCES franqueadas(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  vinculado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  desvinculado_em TIMESTAMP WITH TIME ZONE,
  UNIQUE(produto_id, franqueada_id)
);

-- Add indexes for produtos_franqueadas
CREATE INDEX IF NOT EXISTS idx_produtos_franqueadas_produto ON produtos_franqueadas(produto_id);
CREATE INDEX IF NOT EXISTS idx_produtos_franqueadas_franqueada ON produtos_franqueadas(franqueada_id);
CREATE INDEX IF NOT EXISTS idx_produtos_franqueadas_ativo ON produtos_franqueadas(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_franqueadas_composite ON produtos_franqueadas(franqueada_id, ativo);

-- ============================================================================
-- STEP 3: Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE franqueadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_franqueadas ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create RLS Policies
-- ============================================================================

-- Policy for franqueadas: Allow all operations for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'franqueadas' 
    AND policyname = 'Allow all for authenticated users'
  ) THEN
    CREATE POLICY "Allow all for authenticated users" ON franqueadas
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Policy for produtos_franqueadas: Allow all operations for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'produtos_franqueadas' 
    AND policyname = 'Allow all for authenticated users'
  ) THEN
    CREATE POLICY "Allow all for authenticated users" ON produtos_franqueadas
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Insert sample data (optional - comment out if not needed)
-- ============================================================================

-- Uncomment the lines below to add sample franqueadas:
/*
INSERT INTO franqueadas (nome, email, telefone, cpf, cidade, estado, status) VALUES
  ('Franquia São Paulo Centro', 'sp.centro@c4franquias.com', '(11) 98765-4321', '123.456.789-00', 'São Paulo', 'SP', 'aprovada'),
  ('Franquia Rio de Janeiro', 'rj@c4franquias.com', '(21) 98765-4321', '234.567.890-11', 'Rio de Janeiro', 'RJ', 'aprovada'),
  ('Franquia Belo Horizonte', 'bh@c4franquias.com', '(31) 98765-4321', '345.678.901-22', 'Belo Horizonte', 'MG', 'pendente'),
  ('Franquia Curitiba', 'curitiba@c4franquias.com', '(41) 98765-4321', '456.789.012-33', 'Curitiba', 'PR', 'rejeitada')
ON CONFLICT (email) DO NOTHING;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after the migration to verify everything was created:
--
-- 1. Check if tables exist:
--    SELECT table_name FROM information_schema.tables 
--    WHERE table_schema = 'public' AND table_name IN ('franqueadas', 'produtos_franqueadas');
--
-- 2. Check indexes:
--    SELECT indexname FROM pg_indexes 
--    WHERE tablename IN ('franqueadas', 'produtos_franqueadas');
--
-- 3. Check RLS policies:
--    SELECT tablename, policyname FROM pg_policies 
--    WHERE tablename IN ('franqueadas', 'produtos_franqueadas');
--
-- 4. Check constraints:
--    SELECT conname, conrelid::regclass 
--    FROM pg_constraint 
--    WHERE conrelid::regclass::text IN ('franqueadas', 'produtos_franqueadas');
--
-- 5. Count records:
--    SELECT 
--      (SELECT COUNT(*) FROM franqueadas) as total_franqueadas,
--      (SELECT COUNT(*) FROM franqueadas WHERE status = 'pendente') as pendentes,
--      (SELECT COUNT(*) FROM franqueadas WHERE status = 'aprovada') as aprovadas,
--      (SELECT COUNT(*) FROM franqueadas WHERE status = 'rejeitada') as rejeitadas;
-- ============================================================================

-- Migration completed successfully!
-- You can now use the franchise management features in the application.
