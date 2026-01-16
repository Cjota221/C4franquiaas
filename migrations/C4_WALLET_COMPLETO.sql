-- ============================================
-- 💰 C4 WALLET - MÓDULO FINANCEIRO COMPLETO
-- Sistema de Carteira Digital + Reservas + Separação
-- Execute no Supabase SQL Editor
-- ============================================

-- ============================================
-- PARTE 1: TABELA DE CARTEIRAS (WALLETS)
-- ============================================

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revendedora_id UUID NOT NULL UNIQUE,
  saldo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  saldo_bloqueado DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- Saldo em processo de liberação
  status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'bloqueado', 'suspenso')),
  limite_credito DECIMAL(10,2) DEFAULT 0.00, -- Para futuro crédito
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Saldo nunca pode ser negativo
  CONSTRAINT saldo_nao_negativo CHECK (saldo >= 0),
  CONSTRAINT saldo_bloqueado_nao_negativo CHECK (saldo_bloqueado >= 0)
);

-- Comentários
COMMENT ON TABLE wallets IS 'Carteiras digitais das revendedoras (C4 Wallet)';
COMMENT ON COLUMN wallets.saldo IS 'Saldo disponível para uso';
COMMENT ON COLUMN wallets.saldo_bloqueado IS 'Saldo em processo de liberação/estorno';
COMMENT ON COLUMN wallets.limite_credito IS 'Limite de crédito adicional (futuro)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_wallets_revendedora ON wallets(revendedora_id);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON wallets(status);

-- ============================================
-- PARTE 2: TABELA DE TRANSAÇÕES (EXTRATO)
-- ============================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN (
    'CREDITO_PIX',           -- Recarga via PIX
    'CREDITO_CARTAO',        -- Recarga via cartão (futuro)
    'CREDITO_ESTORNO',       -- Estorno de reserva cancelada
    'CREDITO_BONUS',         -- Bônus promocional
    'CREDITO_CASHBACK',      -- Cashback de vendas
    'DEBITO_RESERVA',        -- Reserva de produto
    'DEBITO_TAXA',           -- Taxa de serviço
    'DEBITO_AJUSTE',         -- Ajuste manual (admin)
    'BLOQUEIO',              -- Bloqueio de saldo
    'DESBLOQUEIO'            -- Liberação de saldo bloqueado
  )),
  valor DECIMAL(10,2) NOT NULL,
  saldo_anterior DECIMAL(10,2) NOT NULL,
  saldo_posterior DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  referencia_tipo VARCHAR(30), -- 'pix', 'pedido', 'reserva', 'admin'
  referencia_id TEXT,          -- ID externo (PIX ID, Pedido ID, etc)
  metadata JSONB DEFAULT '{}', -- Dados adicionais
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Valor deve ser positivo
  CONSTRAINT valor_positivo CHECK (valor > 0)
);

-- Comentários
COMMENT ON TABLE wallet_transactions IS 'Histórico imutável de transações da carteira';
COMMENT ON COLUMN wallet_transactions.referencia_tipo IS 'Tipo de referência externa (pix, pedido, reserva)';
COMMENT ON COLUMN wallet_transactions.referencia_id IS 'ID da referência externa para rastreio';

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tipo ON wallet_transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_referencia ON wallet_transactions(referencia_tipo, referencia_id);

-- ============================================
-- PARTE 3: TABELA DE RESERVAS (CAIXINHA)
-- ============================================

CREATE TABLE IF NOT EXISTS reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revendedora_id UUID NOT NULL,
  wallet_id UUID REFERENCES wallets(id),
  produto_id UUID NOT NULL,
  variacao_id UUID, -- SKU específico
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  preco_total DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'RESERVADO' CHECK (status IN (
    'RESERVADO',        -- Pago, aguardando separação
    'EM_SEPARACAO',     -- Estoquista notificado
    'SEPARADO',         -- Na caixinha física
    'ENVIADO',          -- Incluído em remessa
    'CANCELADO',        -- Cancelada (estorno feito)
    'EXPIRADO'          -- Expirou sem envio
  )),
  transaction_id UUID REFERENCES wallet_transactions(id), -- Transação que gerou a reserva
  separado_por UUID,     -- ID do admin que separou
  separado_em TIMESTAMPTZ,
  enviado_em TIMESTAMPTZ,
  expira_em TIMESTAMPTZ, -- Prazo para solicitar envio
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE reservas IS 'Reservas de produtos (Modo Caixinha)';
COMMENT ON COLUMN reservas.expira_em IS 'Data limite para solicitar envio (evitar estoque parado)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_reservas_revendedora ON reservas(revendedora_id);
CREATE INDEX IF NOT EXISTS idx_reservas_produto ON reservas(produto_id);
CREATE INDEX IF NOT EXISTS idx_reservas_status ON reservas(status);
CREATE INDEX IF NOT EXISTS idx_reservas_separacao ON reservas(status) WHERE status IN ('RESERVADO', 'EM_SEPARACAO');

-- ============================================
-- PARTE 4: TABELA DE RECARGAS PIX
-- ============================================

CREATE TABLE IF NOT EXISTS wallet_recargas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN (
    'PENDENTE',
    'PAGO',
    'EXPIRADO',
    'CANCELADO',
    'ERRO'
  )),
  -- Dados do PIX
  pix_id TEXT,              -- ID do pagamento no Mercado Pago
  pix_qrcode TEXT,          -- QR Code Base64
  pix_qrcode_base64 TEXT,   -- Imagem do QR Code
  pix_copia_cola TEXT,      -- Código PIX copia e cola
  pix_expiracao TIMESTAMPTZ,
  -- Dados do pagamento
  pago_em TIMESTAMPTZ,
  transaction_id UUID REFERENCES wallet_transactions(id),
  -- Webhook
  webhook_payload JSONB,
  webhook_recebido_em TIMESTAMPTZ,
  -- Controle
  processado BOOLEAN DEFAULT FALSE,
  erro_mensagem TEXT,
  tentativas INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_recargas_wallet ON wallet_recargas(wallet_id);
CREATE INDEX IF NOT EXISTS idx_recargas_status ON wallet_recargas(status);
CREATE INDEX IF NOT EXISTS idx_recargas_pix_id ON wallet_recargas(pix_id);
CREATE INDEX IF NOT EXISTS idx_recargas_pendentes ON wallet_recargas(status, pix_expiracao) WHERE status = 'PENDENTE';

-- ============================================
-- PARTE 5: CONFIGURAÇÕES DA FEATURE
-- ============================================

CREATE TABLE IF NOT EXISTS wallet_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  tipo VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
  descricao TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO wallet_config (chave, valor, tipo, descricao) VALUES
  ('recarga_minima', '150.00', 'number', 'Valor mínimo de recarga em R$'),
  ('recarga_maxima', '5000.00', 'number', 'Valor máximo de recarga em R$'),
  ('itens_minimos_envio', '5', 'number', 'Mínimo de itens para solicitar envio'),
  ('dias_expiracao_reserva', '30', 'number', 'Dias até reserva expirar'),
  ('taxa_reserva_percentual', '0', 'number', 'Taxa percentual por reserva'),
  ('taxa_reserva_fixa', '0', 'number', 'Taxa fixa por reserva em R$'),
  ('feature_enabled', 'false', 'boolean', 'Feature habilitada globalmente'),
  ('allowed_slugs', '["vivaz"]', 'json', 'Slugs de lojas com acesso à feature'),
  ('allowed_users', '[]', 'json', 'IDs de usuários beta testers')
ON CONFLICT (chave) DO NOTHING;

-- ============================================
-- PARTE 6: RLS (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_recargas ENABLE ROW LEVEL SECURITY;

-- Policies para WALLETS
DROP POLICY IF EXISTS "Revendedora vê própria carteira" ON wallets;
CREATE POLICY "Revendedora vê própria carteira" ON wallets
  FOR SELECT USING (revendedora_id = auth.uid());

DROP POLICY IF EXISTS "Admin vê todas carteiras" ON wallets;
CREATE POLICY "Admin vê todas carteiras" ON wallets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'superadmin')
    )
  );

-- Policies para TRANSACTIONS
DROP POLICY IF EXISTS "Revendedora vê próprio extrato" ON wallet_transactions;
CREATE POLICY "Revendedora vê próprio extrato" ON wallet_transactions
  FOR SELECT USING (
    wallet_id IN (SELECT id FROM wallets WHERE revendedora_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin vê todas transações" ON wallet_transactions;
CREATE POLICY "Admin vê todas transações" ON wallet_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'superadmin')
    )
  );

-- Policies para RESERVAS
DROP POLICY IF EXISTS "Revendedora vê próprias reservas" ON reservas;
CREATE POLICY "Revendedora vê próprias reservas" ON reservas
  FOR SELECT USING (revendedora_id = auth.uid());

DROP POLICY IF EXISTS "Admin gerencia reservas" ON reservas;
CREATE POLICY "Admin gerencia reservas" ON reservas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'superadmin', 'estoquista')
    )
  );

-- Policies para RECARGAS
DROP POLICY IF EXISTS "Revendedora vê próprias recargas" ON wallet_recargas;
CREATE POLICY "Revendedora vê próprias recargas" ON wallet_recargas
  FOR SELECT USING (
    wallet_id IN (SELECT id FROM wallets WHERE revendedora_id = auth.uid())
  );

-- ============================================
-- PARTE 7: FUNCTIONS AUXILIARES
-- ============================================

-- Função para criar carteira automaticamente
CREATE OR REPLACE FUNCTION criar_carteira_revendedora()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (revendedora_id)
  VALUES (NEW.id)
  ON CONFLICT (revendedora_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar carteira quando revendedora é aprovada
DROP TRIGGER IF EXISTS trigger_criar_carteira ON resellers;
CREATE TRIGGER trigger_criar_carteira
  AFTER INSERT OR UPDATE OF status ON resellers
  FOR EACH ROW
  WHEN (NEW.status = 'aprovada')
  EXECUTE FUNCTION criar_carteira_revendedora();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de timestamp
DROP TRIGGER IF EXISTS trigger_wallet_updated ON wallets;
CREATE TRIGGER trigger_wallet_updated
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_wallet_timestamp();

DROP TRIGGER IF EXISTS trigger_reserva_updated ON reservas;
CREATE TRIGGER trigger_reserva_updated
  BEFORE UPDATE ON reservas
  FOR EACH ROW EXECUTE FUNCTION update_wallet_timestamp();

DROP TRIGGER IF EXISTS trigger_recarga_updated ON wallet_recargas;
CREATE TRIGGER trigger_recarga_updated
  BEFORE UPDATE ON wallet_recargas
  FOR EACH ROW EXECUTE FUNCTION update_wallet_timestamp();

-- ============================================
-- PARTE 8: FUNÇÃO DE RESERVA ATÔMICA
-- ============================================

CREATE OR REPLACE FUNCTION fazer_reserva(
  p_revendedora_id UUID,
  p_produto_id UUID,
  p_variacao_id UUID,
  p_quantidade INTEGER,
  p_preco_unitario DECIMAL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_preco_total DECIMAL;
  v_transaction_id UUID;
  v_reserva_id UUID;
  v_estoque_atual INTEGER;
  v_config_taxa_perc DECIMAL;
  v_config_taxa_fixa DECIMAL;
  v_taxa_total DECIMAL;
BEGIN
  -- Calcular preço total
  v_preco_total := p_preco_unitario * p_quantidade;
  
  -- Buscar configurações de taxa
  SELECT COALESCE((SELECT valor::DECIMAL FROM wallet_config WHERE chave = 'taxa_reserva_percentual'), 0) INTO v_config_taxa_perc;
  SELECT COALESCE((SELECT valor::DECIMAL FROM wallet_config WHERE chave = 'taxa_reserva_fixa'), 0) INTO v_config_taxa_fixa;
  v_taxa_total := (v_preco_total * v_config_taxa_perc / 100) + v_config_taxa_fixa;
  
  -- 1. LOCK na carteira (FOR UPDATE)
  SELECT * INTO v_wallet 
  FROM wallets 
  WHERE revendedora_id = p_revendedora_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Carteira não encontrada');
  END IF;
  
  IF v_wallet.status != 'ativo' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Carteira bloqueada ou suspensa');
  END IF;
  
  -- 2. Verificar saldo
  IF v_wallet.saldo < (v_preco_total + v_taxa_total) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Saldo insuficiente',
      'saldo_atual', v_wallet.saldo,
      'valor_necessario', v_preco_total + v_taxa_total
    );
  END IF;
  
  -- 3. Verificar estoque (LOCK na variação)
  IF p_variacao_id IS NOT NULL THEN
    SELECT estoque INTO v_estoque_atual
    FROM produto_variacoes
    WHERE id = p_variacao_id
    FOR UPDATE;
  ELSE
    SELECT estoque INTO v_estoque_atual
    FROM produtos
    WHERE id = p_produto_id
    FOR UPDATE;
  END IF;
  
  IF v_estoque_atual IS NULL OR v_estoque_atual < p_quantidade THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Estoque insuficiente',
      'estoque_disponivel', COALESCE(v_estoque_atual, 0)
    );
  END IF;
  
  -- 4. Decrementar saldo
  UPDATE wallets 
  SET saldo = saldo - (v_preco_total + v_taxa_total)
  WHERE id = v_wallet.id;
  
  -- 5. Criar transação no extrato
  INSERT INTO wallet_transactions (
    wallet_id, tipo, valor, saldo_anterior, saldo_posterior,
    descricao, referencia_tipo, metadata
  ) VALUES (
    v_wallet.id, 'DEBITO_RESERVA', v_preco_total + v_taxa_total,
    v_wallet.saldo, v_wallet.saldo - (v_preco_total + v_taxa_total),
    'Reserva de produto', 'reserva', p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  -- 6. Decrementar estoque
  IF p_variacao_id IS NOT NULL THEN
    UPDATE produto_variacoes 
    SET estoque = estoque - p_quantidade
    WHERE id = p_variacao_id;
  ELSE
    UPDATE produtos 
    SET estoque = estoque - p_quantidade
    WHERE id = p_produto_id;
  END IF;
  
  -- 7. Criar reserva
  INSERT INTO reservas (
    revendedora_id, wallet_id, produto_id, variacao_id,
    quantidade, preco_unitario, preco_total, transaction_id,
    expira_em, metadata
  ) VALUES (
    p_revendedora_id, v_wallet.id, p_produto_id, p_variacao_id,
    p_quantidade, p_preco_unitario, v_preco_total, v_transaction_id,
    NOW() + INTERVAL '30 days', p_metadata
  ) RETURNING id INTO v_reserva_id;
  
  -- 8. Atualizar referência na transação
  UPDATE wallet_transactions 
  SET referencia_id = v_reserva_id::TEXT
  WHERE id = v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'reserva_id', v_reserva_id,
    'transaction_id', v_transaction_id,
    'valor_debitado', v_preco_total + v_taxa_total,
    'novo_saldo', v_wallet.saldo - (v_preco_total + v_taxa_total)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 9: FUNÇÃO DE ESTORNO
-- ============================================

CREATE OR REPLACE FUNCTION cancelar_reserva(
  p_reserva_id UUID,
  p_motivo TEXT DEFAULT 'Cancelamento solicitado'
)
RETURNS JSONB AS $$
DECLARE
  v_reserva reservas%ROWTYPE;
  v_wallet wallets%ROWTYPE;
BEGIN
  -- 1. Buscar e LOCK a reserva
  SELECT * INTO v_reserva
  FROM reservas
  WHERE id = p_reserva_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reserva não encontrada');
  END IF;
  
  IF v_reserva.status NOT IN ('RESERVADO', 'EM_SEPARACAO') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reserva não pode ser cancelada neste status');
  END IF;
  
  -- 2. Buscar carteira
  SELECT * INTO v_wallet FROM wallets WHERE id = v_reserva.wallet_id FOR UPDATE;
  
  -- 3. Estornar saldo
  UPDATE wallets SET saldo = saldo + v_reserva.preco_total WHERE id = v_wallet.id;
  
  -- 4. Registrar estorno no extrato
  INSERT INTO wallet_transactions (
    wallet_id, tipo, valor, saldo_anterior, saldo_posterior,
    descricao, referencia_tipo, referencia_id
  ) VALUES (
    v_wallet.id, 'CREDITO_ESTORNO', v_reserva.preco_total,
    v_wallet.saldo, v_wallet.saldo + v_reserva.preco_total,
    p_motivo, 'reserva', p_reserva_id::TEXT
  );
  
  -- 5. Devolver estoque
  IF v_reserva.variacao_id IS NOT NULL THEN
    UPDATE produto_variacoes SET estoque = estoque + v_reserva.quantidade WHERE id = v_reserva.variacao_id;
  ELSE
    UPDATE produtos SET estoque = estoque + v_reserva.quantidade WHERE id = v_reserva.produto_id;
  END IF;
  
  -- 6. Atualizar status da reserva
  UPDATE reservas SET status = 'CANCELADO', updated_at = NOW() WHERE id = p_reserva_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'valor_estornado', v_reserva.preco_total,
    'novo_saldo', v_wallet.saldo + v_reserva.preco_total
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 10: FUNÇÃO DE CRÉDITO (RECARGA)
-- ============================================

CREATE OR REPLACE FUNCTION creditar_carteira(
  p_wallet_id UUID,
  p_valor DECIMAL,
  p_tipo VARCHAR,
  p_descricao TEXT,
  p_referencia_tipo VARCHAR DEFAULT NULL,
  p_referencia_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_transaction_id UUID;
BEGIN
  -- LOCK na carteira
  SELECT * INTO v_wallet FROM wallets WHERE id = p_wallet_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Carteira não encontrada');
  END IF;
  
  -- Atualizar saldo
  UPDATE wallets SET saldo = saldo + p_valor WHERE id = p_wallet_id;
  
  -- Registrar transação
  INSERT INTO wallet_transactions (
    wallet_id, tipo, valor, saldo_anterior, saldo_posterior,
    descricao, referencia_tipo, referencia_id
  ) VALUES (
    p_wallet_id, p_tipo, p_valor,
    v_wallet.saldo, v_wallet.saldo + p_valor,
    p_descricao, p_referencia_tipo, p_referencia_id
  ) RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'novo_saldo', v_wallet.saldo + p_valor
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 11: VIEWS ÚTEIS
-- ============================================

-- View: Resumo da carteira com totais
CREATE OR REPLACE VIEW vw_wallet_resumo AS
SELECT 
  w.id,
  w.revendedora_id,
  r.store_name as nome_loja,
  w.saldo,
  w.saldo_bloqueado,
  w.status,
  COALESCE(t.total_creditos, 0) as total_creditos,
  COALESCE(t.total_debitos, 0) as total_debitos,
  COALESCE(res.itens_reservados, 0) as itens_reservados,
  COALESCE(res.valor_reservado, 0) as valor_reservado,
  w.created_at
FROM wallets w
LEFT JOIN resellers r ON r.id = w.revendedora_id
LEFT JOIN LATERAL (
  SELECT 
    SUM(CASE WHEN tipo LIKE 'CREDITO%' THEN valor ELSE 0 END) as total_creditos,
    SUM(CASE WHEN tipo LIKE 'DEBITO%' THEN valor ELSE 0 END) as total_debitos
  FROM wallet_transactions WHERE wallet_id = w.id
) t ON true
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as itens_reservados,
    SUM(preco_total) as valor_reservado
  FROM reservas 
  WHERE wallet_id = w.id AND status IN ('RESERVADO', 'EM_SEPARACAO', 'SEPARADO')
) res ON true;

-- View: Fila de separação (para estoquistas)
CREATE OR REPLACE VIEW vw_fila_separacao AS
SELECT 
  res.id as reserva_id,
  res.revendedora_id,
  r.store_name as nome_revendedora,
  res.produto_id,
  p.nome as produto_nome,
  p.imagem as produto_imagem,
  pv.tamanho,
  pv.cor,
  res.quantidade,
  res.preco_total,
  res.status,
  res.created_at as reservado_em,
  EXTRACT(EPOCH FROM (NOW() - res.created_at))/3600 as horas_aguardando
FROM reservas res
JOIN resellers r ON r.id = res.revendedora_id
JOIN produtos p ON p.id = res.produto_id
LEFT JOIN produto_variacoes pv ON pv.id = res.variacao_id
WHERE res.status IN ('RESERVADO', 'EM_SEPARACAO')
ORDER BY res.created_at ASC;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

SELECT '✅ C4 Wallet criado com sucesso!' as status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wallets', 'wallet_transactions', 'reservas', 'wallet_recargas', 'wallet_config');
