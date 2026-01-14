-- ============================================================================
-- Migration 110: Adiciona suporte a variações de produtos
-- ============================================================================
-- Description: Cria tabela de variações para produtos com múltiplas cores/imagens
-- Author: GitHub Copilot
-- Date: 2026-01-14
-- ============================================================================

-- ============================================================================
-- TABELA: grade_fechada_variacoes
-- Variações de produtos (cada cor com sua imagem e estoque)
-- ============================================================================
CREATE TABLE IF NOT EXISTS grade_fechada_variacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES grade_fechada_produtos(id) ON DELETE CASCADE,
  
  -- Identificação da variação
  cor VARCHAR(100) NOT NULL,
  imagem_url TEXT,
  
  -- Estoque específico desta variação
  estoque_disponivel INTEGER DEFAULT 0,
  
  -- Controle
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  
  -- Timestamps
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  
  -- Constraint para não ter cores duplicadas no mesmo produto
  UNIQUE(produto_id, cor)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_variacoes_produto_id ON grade_fechada_variacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_variacoes_ativo ON grade_fechada_variacoes(ativo);

-- ============================================================================
-- ALTER: Adiciona campos para suporte a variações na tabela produtos
-- ============================================================================
ALTER TABLE grade_fechada_produtos 
  ADD COLUMN IF NOT EXISTS preco_base DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS codigo VARCHAR(100),
  ADD COLUMN IF NOT EXISTS usa_variacoes BOOLEAN DEFAULT false;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Desabilitar RLS (mesmo sistema do grade_fechada_produtos)
ALTER TABLE grade_fechada_variacoes DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_grade_fechada_variacoes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
DROP TRIGGER IF EXISTS update_grade_fechada_variacoes_timestamp ON grade_fechada_variacoes;
CREATE TRIGGER update_grade_fechada_variacoes_timestamp
  BEFORE UPDATE ON grade_fechada_variacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_grade_fechada_variacoes_timestamp();

-- ============================================================================
-- SEED DATA (Opcional - descomente se quiser dados de exemplo)
-- ============================================================================

-- COMENTADO: Descomentar apenas para testes
-- INSERT INTO grade_fechada_produtos (nome, codigo, preco_base, usa_variacoes, ativo)
-- VALUES ('Rasteirinha Mel', 'RAST-MEL-001', 29.90, true, true)
-- RETURNING id;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 110 aplicada com sucesso!';
  RAISE NOTICE '📦 Tabela grade_fechada_variacoes criada';
  RAISE NOTICE '🔧 Campos preco_base, codigo e usa_variacoes adicionados';
  RAISE NOTICE '🔒 RLS desabilitado para grade_fechada_variacoes';
  RAISE NOTICE '⚙️ Triggers configurados';
END $$;
