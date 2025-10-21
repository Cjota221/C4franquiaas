-- ============================================================================
-- Migration 006: Complete Category System
-- ============================================================================
-- Description: Creates all tables needed for the category management system
-- Author: GitHub Copilot
-- Date: 2025-10-21
-- 
-- This migration creates:
-- 1. categorias table (parent table for categories and subcategories)
-- 2. produto_categorias junction table (many-to-many relationship)
-- 3. All necessary indexes and RLS policies
-- ============================================================================

-- ============================================================================
-- STEP 1: Create categorias table
-- ============================================================================

CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  pai_id INTEGER REFERENCES categorias(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for parent_id lookups (for hierarchical queries)
CREATE INDEX IF NOT EXISTS idx_categorias_pai_id ON categorias(pai_id);

-- Add index for name searches
CREATE INDEX IF NOT EXISTS idx_categorias_nome ON categorias(nome);

-- ============================================================================
-- STEP 2: Create produto_categorias junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS produto_categorias (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER NOT NULL,
  categoria_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(produto_id, categoria_id)
);

-- Add foreign key constraints
ALTER TABLE produto_categorias
  ADD CONSTRAINT fk_produto_categorias_produto
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE;

ALTER TABLE produto_categorias
  ADD CONSTRAINT fk_produto_categorias_categoria
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_produto_categorias_produto_id ON produto_categorias(produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_categorias_categoria_id ON produto_categorias(categoria_id);

-- ============================================================================
-- STEP 3: Enable Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on categorias
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Enable RLS on produto_categorias
ALTER TABLE produto_categorias ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create RLS Policies
-- ============================================================================

-- Policy for categorias: Allow all operations for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categorias' 
    AND policyname = 'Allow all for authenticated users'
  ) THEN
    CREATE POLICY "Allow all for authenticated users" ON categorias
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Policy for produto_categorias: Allow all operations for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'produto_categorias' 
    AND policyname = 'Allow all for authenticated users'
  ) THEN
    CREATE POLICY "Allow all for authenticated users" ON produto_categorias
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Create trigger for updated_at timestamp
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for categorias
DROP TRIGGER IF EXISTS update_categorias_updated_at ON categorias;
CREATE TRIGGER update_categorias_updated_at
  BEFORE UPDATE ON categorias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 6: Insert sample data (optional - comment out if not needed)
-- ============================================================================

-- Uncomment the lines below to add sample categories:
/*
INSERT INTO categorias (nome, pai_id) VALUES
  ('Eletrônicos', NULL),
  ('Roupas', NULL),
  ('Alimentos', NULL),
  ('Smartphones', (SELECT id FROM categorias WHERE nome = 'Eletrônicos')),
  ('Notebooks', (SELECT id FROM categorias WHERE nome = 'Eletrônicos')),
  ('Camisetas', (SELECT id FROM categorias WHERE nome = 'Roupas')),
  ('Calças', (SELECT id FROM categorias WHERE nome = 'Roupas'))
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after the migration to verify everything was created:
--
-- 1. Check if tables exist:
--    SELECT table_name FROM information_schema.tables 
--    WHERE table_schema = 'public' AND table_name IN ('categorias', 'produto_categorias');
--
-- 2. Check indexes:
--    SELECT indexname FROM pg_indexes 
--    WHERE tablename IN ('categorias', 'produto_categorias');
--
-- 3. Check RLS policies:
--    SELECT tablename, policyname FROM pg_policies 
--    WHERE tablename IN ('categorias', 'produto_categorias');
--
-- 4. Check foreign keys:
--    SELECT conname, conrelid::regclass, confrelid::regclass 
--    FROM pg_constraint 
--    WHERE contype = 'f' AND conrelid::regclass::text LIKE '%categoria%';
-- ============================================================================

-- Migration completed successfully!
-- You can now use the category management features in the application.
