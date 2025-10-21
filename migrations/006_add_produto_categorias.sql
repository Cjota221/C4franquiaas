-- Migration: Create produto_categorias junction table
-- Description: Table to manage many-to-many relationship between products and categories

-- Create produto_categorias table
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

-- Add RLS policies (Row Level Security)
ALTER TABLE produto_categorias ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON produto_categorias
  FOR ALL
  USING (true)
  WITH CHECK (true);
