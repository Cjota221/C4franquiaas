-- ============================================================================
-- Migration 046: Tabela de Carrinhos Abandonados
-- ============================================================================
-- Description: Armazena carrinhos abandonados para recuperação via WhatsApp
-- Date: 2024-12-29

-- STEP 1: Criar tabela de carrinhos abandonados
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  
  -- Dados do cliente
  phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(200),
  customer_email VARCHAR(200),
  
  -- Dados do carrinho
  items JSONB NOT NULL, -- Array de { nome, quantidade, preco, imagem, produto_id }
  total DECIMAL(10, 2) NOT NULL,
  dominio VARCHAR(100), -- Para montar o link do carrinho
  
  -- Controle de lembretes
  status VARCHAR(20) DEFAULT 'pending', -- pending, reminded, recovered, expired
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMP WITH TIME ZONE,
  
  -- Recuperação
  recovered_at TIMESTAMP WITH TIME ZONE,
  order_id UUID, -- Se virou pedido, referência ao pedido
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Criar índices
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_phone ON abandoned_carts(phone);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_loja ON abandoned_carts(loja_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON abandoned_carts(status);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_created ON abandoned_carts(created_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_pending ON abandoned_carts(status, created_at) 
  WHERE status = 'pending';

-- STEP 3: Comentários
COMMENT ON TABLE abandoned_carts IS 'Carrinhos abandonados para recuperação via WhatsApp';
COMMENT ON COLUMN abandoned_carts.items IS 'Array JSON com itens: [{nome, quantidade, preco, imagem, produto_id}]';
COMMENT ON COLUMN abandoned_carts.status IS 'pending=aguardando, reminded=lembrete enviado, recovered=convertido em pedido, expired=expirado';
COMMENT ON COLUMN abandoned_carts.reminder_count IS 'Quantidade de lembretes enviados (máx 2)';

-- STEP 4: RLS (Row Level Security)
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Política para leitura (admin e dono da loja podem ver)
CREATE POLICY "abandoned_carts_select" ON abandoned_carts
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (
      SELECT user_id FROM lojas WHERE id = abandoned_carts.loja_id
    )
  );

-- Política para inserção (qualquer um pode criar via API)
CREATE POLICY "abandoned_carts_insert" ON abandoned_carts
  FOR INSERT WITH CHECK (true);

-- Política para atualização (apenas service_role ou dono da loja)
CREATE POLICY "abandoned_carts_update" ON abandoned_carts
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (
      SELECT user_id FROM lojas WHERE id = abandoned_carts.loja_id
    )
  );

-- STEP 5: Função para limpar carrinhos antigos (executar semanalmente)
CREATE OR REPLACE FUNCTION cleanup_old_abandoned_carts()
RETURNS void AS $$
BEGIN
  DELETE FROM abandoned_carts 
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND status IN ('expired', 'recovered');
  
  -- Expirar carrinhos pendentes muito antigos
  UPDATE abandoned_carts 
  SET status = 'expired'
  WHERE created_at < NOW() - INTERVAL '7 days'
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- STEP 6: Validação
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 046 aplicada com sucesso!';
  RAISE NOTICE 'Tabela abandoned_carts criada para recuperação de vendas';
END $$;
