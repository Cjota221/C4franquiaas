-- Migration 030: Sistema Completo de Envios com Melhor Envio
-- Data: 2025-11-02
-- Descrição: Gerenciamento completo de envios, etiquetas e rastreamento

-- Tabela principal de envios
CREATE TABLE IF NOT EXISTS pedidos_envio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  
  -- IDs do Melhor Envio
  melhorenvio_order_id VARCHAR(100), -- ID do pedido no Melhor Envio
  melhorenvio_protocol VARCHAR(100), -- Protocolo de postagem
  
  -- Dados do Envio
  servico_id INTEGER, -- ID do serviço (PAC, SEDEX, etc.)
  servico_nome VARCHAR(100), -- Nome do serviço
  transportadora VARCHAR(100), -- Nome da transportadora
  
  -- Valores
  valor_frete DECIMAL(10, 2),
  valor_declarado DECIMAL(10, 2),
  
  -- Dimensões e Peso
  peso DECIMAL(10, 3),
  altura INTEGER,
  largura INTEGER,
  comprimento INTEGER,
  
  -- Rastreamento
  codigo_rastreio VARCHAR(100),
  status_envio VARCHAR(50) DEFAULT 'pending', -- pending, paid, generated, posted, transit, delivered, canceled
  tracking_url TEXT,
  
  -- Etiqueta
  etiqueta_url TEXT,
  etiqueta_gerada_em TIMESTAMPTZ,
  etiqueta_impressa BOOLEAN DEFAULT false,
  
  -- Prazos
  prazo_entrega INTEGER, -- em dias úteis
  data_prevista_entrega DATE,
  data_postagem TIMESTAMPTZ,
  data_entrega TIMESTAMPTZ,
  
  -- Logística Reversa
  is_reversa BOOLEAN DEFAULT false,
  motivo_reversa TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT unique_melhorenvio_order UNIQUE (melhorenvio_order_id)
);

-- Tabela de histórico de rastreamento
CREATE TABLE IF NOT EXISTS envio_rastreamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envio_id UUID NOT NULL REFERENCES pedidos_envio(id) ON DELETE CASCADE,
  
  -- Dados do evento
  status VARCHAR(50) NOT NULL,
  mensagem TEXT,
  localizacao VARCHAR(255),
  
  -- Data do evento
  data_evento TIMESTAMPTZ NOT NULL,
  
  -- Origem do evento
  origem VARCHAR(50) DEFAULT 'melhorenvio', -- melhorenvio, manual, webhook
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de notificações enviadas
CREATE TABLE IF NOT EXISTS envio_notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envio_id UUID NOT NULL REFERENCES pedidos_envio(id) ON DELETE CASCADE,
  
  -- Tipo de notificação
  tipo VARCHAR(50) NOT NULL, -- email, whatsapp, sms
  evento VARCHAR(50) NOT NULL, -- etiqueta_gerada, enviado, em_transito, entregue
  
  -- Destinatário
  destinatario VARCHAR(255) NOT NULL,
  
  -- Status
  enviado BOOLEAN DEFAULT false,
  enviado_em TIMESTAMPTZ,
  erro TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_envio_pedido ON pedidos_envio(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_envio_status ON pedidos_envio(status_envio);
CREATE INDEX IF NOT EXISTS idx_pedidos_envio_rastreio ON pedidos_envio(codigo_rastreio);
CREATE INDEX IF NOT EXISTS idx_pedidos_envio_protocol ON pedidos_envio(melhorenvio_protocol);
CREATE INDEX IF NOT EXISTS idx_envio_rastreamento_envio ON envio_rastreamento(envio_id);
CREATE INDEX IF NOT EXISTS idx_envio_rastreamento_data ON envio_rastreamento(data_evento DESC);
CREATE INDEX IF NOT EXISTS idx_envio_notificacoes_envio ON envio_notificacoes(envio_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_pedidos_envio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pedidos_envio_updated_at
  BEFORE UPDATE ON pedidos_envio
  FOR EACH ROW
  EXECUTE FUNCTION update_pedidos_envio_updated_at();

-- Comentários
COMMENT ON TABLE pedidos_envio IS 'Gestão completa de envios via Melhor Envio';
COMMENT ON COLUMN pedidos_envio.status_envio IS 'pending=Aguardando, paid=Pago, generated=Etiqueta gerada, posted=Postado, transit=Em trânsito, delivered=Entregue, canceled=Cancelado';
COMMENT ON TABLE envio_rastreamento IS 'Histórico completo de rastreamento de envios';
COMMENT ON TABLE envio_notificacoes IS 'Log de notificações enviadas aos clientes';
