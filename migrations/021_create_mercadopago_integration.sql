-- Migration: Adicionar configurações do Mercado Pago
-- Objetivo: Armazenar configurações de integração de pagamento

-- Adicionar colunas de configuração do Mercado Pago na tabela lojas
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS mp_ativado BOOLEAN DEFAULT false;
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS mp_modo_producao BOOLEAN DEFAULT false;
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS mp_client_id VARCHAR(255);
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS mp_client_secret VARCHAR(255);

-- Comentários
COMMENT ON COLUMN lojas.mp_ativado IS 'Indica se a integração com Mercado Pago está ativa';
COMMENT ON COLUMN lojas.mp_modo_producao IS 'true = Produção | false = Teste/Sandbox';
COMMENT ON COLUMN lojas.mp_client_id IS 'Client ID do Mercado Pago (OAuth - futuro)';
COMMENT ON COLUMN lojas.mp_client_secret IS 'Client Secret do Mercado Pago (OAuth - futuro)';

-- Criar tabela de pedidos (se não existir)
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referências
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id),
  
  -- Dados do cliente
  cliente_email VARCHAR(255) NOT NULL,
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_cpf VARCHAR(14),
  cliente_telefone VARCHAR(20),
  
  -- Endereço de entrega
  cep VARCHAR(9),
  endereco VARCHAR(255),
  numero VARCHAR(10),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  
  -- Valores
  subtotal DECIMAL(10, 2) NOT NULL,
  desconto DECIMAL(10, 2) DEFAULT 0,
  frete DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Status do pedido
  status VARCHAR(50) DEFAULT 'AGUARDANDO_PAGAMENTO',
  -- Possíveis status: AGUARDANDO_PAGAMENTO, PAGO, PROCESSANDO_ENVIO, ENVIADO, ENTREGUE, CANCELADO
  
  -- Pagamento
  metodo_pagamento VARCHAR(50),
  mp_payment_id VARCHAR(255),
  mp_preference_id VARCHAR(255),
  mp_status VARCHAR(50),
  
  -- Envio (Envioecom)
  codigo_rastreio VARCHAR(100),
  etiqueta_url TEXT,
  transportadora VARCHAR(100),
  
  -- Observações
  observacao TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  pago_em TIMESTAMPTZ,
  enviado_em TIMESTAMPTZ,
  entregue_em TIMESTAMPTZ
);

-- Criar tabela de itens do pedido
CREATE TABLE IF NOT EXISTS pedido_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  
  -- Dados do produto (snapshot no momento da compra)
  produto_sku VARCHAR(100),
  produto_nome VARCHAR(255) NOT NULL,
  produto_imagem TEXT,
  
  -- Variação
  tamanho VARCHAR(10),
  cor VARCHAR(50),
  
  -- Valores
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_pedidos_loja ON pedidos(loja_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_mp_payment ON pedidos(mp_payment_id);
CREATE INDEX idx_pedidos_created_at ON pedidos(created_at DESC);
CREATE INDEX idx_pedido_itens_pedido ON pedido_itens(pedido_id);
CREATE INDEX idx_pedido_itens_produto ON pedido_itens(produto_id);

-- Comentários
COMMENT ON TABLE pedidos IS 'Pedidos realizados nas lojas (e-commerce)';
COMMENT ON COLUMN pedidos.status IS 'AGUARDANDO_PAGAMENTO | PAGO | PROCESSANDO_ENVIO | ENVIADO | ENTREGUE | CANCELADO';
COMMENT ON COLUMN pedidos.mp_payment_id IS 'ID do pagamento no Mercado Pago';
COMMENT ON COLUMN pedidos.mp_preference_id IS 'ID da preferência criada no Mercado Pago';
COMMENT ON TABLE pedido_itens IS 'Itens de cada pedido (snapshot dos produtos)';
