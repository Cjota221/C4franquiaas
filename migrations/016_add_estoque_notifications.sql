-- Migration: Adicionar tabela de notificações de estoque
-- Data: 2025-10-25
-- Descrição: Armazena notificações de mudanças de estoque para exibir alertas no painel admin

-- Criar tabela de notificações de estoque
CREATE TABLE IF NOT EXISTS estoque_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao produto
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  produto_nome TEXT NOT NULL,
  id_externo TEXT NOT NULL,
  
  -- Detalhes da variação (pode ser null se for estoque total)
  variacao_id TEXT,
  variacao_nome TEXT,
  variacao_sku TEXT,
  
  -- Mudança de estoque
  estoque_anterior INTEGER NOT NULL,
  estoque_atual INTEGER NOT NULL,
  diferenca INTEGER GENERATED ALWAYS AS (estoque_atual - estoque_anterior) STORED,
  
  -- Tipo de mudança (venda, ajuste_manual, sincronizacao, etc)
  tipo_mudanca TEXT DEFAULT 'venda',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visualizada BOOLEAN DEFAULT FALSE,
  visualizada_em TIMESTAMP WITH TIME ZONE,
  visualizada_por TEXT,
  
  -- Dados adicionais (ex: ID do pedido que causou a mudança)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_estoque_notifications_produto_id ON estoque_notifications(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_notifications_created_at ON estoque_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_estoque_notifications_visualizada ON estoque_notifications(visualizada) WHERE NOT visualizada;
CREATE INDEX IF NOT EXISTS idx_estoque_notifications_id_externo ON estoque_notifications(id_externo);

-- Criar função para marcar notificações antigas como visualizadas automaticamente
CREATE OR REPLACE FUNCTION auto_mark_old_notifications_as_read()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE estoque_notifications
  SET visualizada = TRUE,
      visualizada_em = NOW(),
      visualizada_por = 'auto_cleanup'
  WHERE 
    NOT visualizada 
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Comentários na tabela
COMMENT ON TABLE estoque_notifications IS 'Armazena notificações de mudanças de estoque para alertar administradores';
COMMENT ON COLUMN estoque_notifications.tipo_mudanca IS 'Tipo de mudança: venda, ajuste_manual, sincronizacao, devolucao, etc';
COMMENT ON COLUMN estoque_notifications.diferenca IS 'Calculado automaticamente: positivo = entrada, negativo = saída';
COMMENT ON COLUMN estoque_notifications.metadata IS 'Dados adicionais como ID do pedido, IP de origem, etc';
