-- Migration: Criar tabela de movimentações de estoque
-- Objetivo: Registrar histórico de todas as movimentações de estoque

-- Criar ENUM para tipos de movimentação
CREATE TYPE tipo_movimentacao AS ENUM (
  'VENDA',
  'ENTRADA',
  'DEVOLUCAO',
  'AJUSTE',
  'TRANSFERENCIA'
);

-- Criar tabela de movimentações
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao produto
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  
  -- Tipo de movimentação
  tipo tipo_movimentacao NOT NULL,
  
  -- Quantidades
  quantidade INTEGER NOT NULL,
  estoque_anterior INTEGER NOT NULL,
  estoque_novo INTEGER NOT NULL,
  
  -- Rastreamento
  transacao_id VARCHAR(255),
  observacao TEXT,
  
  -- Usuário responsável (se aplicável)
  usuario_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT quantidade_positiva CHECK (quantidade > 0)
);

-- Criar índices para performance
CREATE INDEX idx_movimentacoes_produto ON estoque_movimentacoes(produto_id);
CREATE INDEX idx_movimentacoes_tipo ON estoque_movimentacoes(tipo);
CREATE INDEX idx_movimentacoes_transacao ON estoque_movimentacoes(transacao_id);
CREATE INDEX idx_movimentacoes_created_at ON estoque_movimentacoes(created_at DESC);

-- Comentários
COMMENT ON TABLE estoque_movimentacoes IS 'Registra histórico de todas as movimentações de estoque';
COMMENT ON COLUMN estoque_movimentacoes.tipo IS 'VENDA: Saída por venda | ENTRADA: Entrada de mercadoria | DEVOLUCAO: Retorno de produto | AJUSTE: Correção manual | TRANSFERENCIA: Entre depósitos';
COMMENT ON COLUMN estoque_movimentacoes.transacao_id IS 'ID da venda, nota fiscal ou outro identificador da transação';
