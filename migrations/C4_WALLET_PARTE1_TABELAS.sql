-- ============================================
-- 💰 C4 WALLET - PARTE 1: CRIAR TABELAS
-- Execute este arquivo PRIMEIRO
-- ============================================

-- 1. WALLETS
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revendedora_id UUID NOT NULL UNIQUE,
  saldo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  saldo_bloqueado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'bloqueado', 'suspenso')),
  limite_credito DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT saldo_nao_negativo CHECK (saldo >= 0),
  CONSTRAINT saldo_bloqueado_nao_negativo CHECK (saldo_bloqueado >= 0)
);

CREATE INDEX IF NOT EXISTS idx_wallets_revendedora ON wallets(revendedora_id);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON wallets(status);

-- 2. WALLET_TRANSACTIONS
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN (
    'CREDITO_PIX', 'CREDITO_CARTAO', 'CREDITO_ESTORNO', 'CREDITO_BONUS', 'CREDITO_CASHBACK',
    'DEBITO_RESERVA', 'DEBITO_TAXA', 'DEBITO_AJUSTE', 'BLOQUEIO', 'DESBLOQUEIO'
  )),
  valor DECIMAL(10,2) NOT NULL,
  saldo_anterior DECIMAL(10,2) NOT NULL,
  saldo_posterior DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  referencia_tipo VARCHAR(30),
  referencia_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valor_positivo CHECK (valor > 0)
);

CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tipo ON wallet_transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON wallet_transactions(created_at DESC);

-- 3. RESERVAS
CREATE TABLE IF NOT EXISTS reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revendedora_id UUID NOT NULL,
  wallet_id UUID REFERENCES wallets(id),
  produto_id UUID NOT NULL,
  variacao_id UUID,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  preco_total DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'RESERVADO' CHECK (status IN (
    'RESERVADO', 'EM_SEPARACAO', 'SEPARADO', 'ENVIADO', 'CANCELADO', 'EXPIRADO'
  )),
  transaction_id UUID REFERENCES wallet_transactions(id),
  separado_por UUID,
  separado_em TIMESTAMPTZ,
  enviado_em TIMESTAMPTZ,
  expira_em TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservas_revendedora ON reservas(revendedora_id);
CREATE INDEX IF NOT EXISTS idx_reservas_produto ON reservas(produto_id);
CREATE INDEX IF NOT EXISTS idx_reservas_status ON reservas(status);

-- 4. WALLET_RECARGAS
CREATE TABLE IF NOT EXISTS wallet_recargas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN (
    'PENDENTE', 'PAGO', 'EXPIRADO', 'CANCELADO', 'ERRO'
  )),
  pix_id TEXT,
  pix_qrcode TEXT,
  pix_qrcode_base64 TEXT,
  pix_copia_cola TEXT,
  pix_expiracao TIMESTAMPTZ,
  pago_em TIMESTAMPTZ,
  transaction_id UUID REFERENCES wallet_transactions(id),
  webhook_payload JSONB,
  webhook_recebido_em TIMESTAMPTZ,
  processado BOOLEAN DEFAULT FALSE,
  erro_mensagem TEXT,
  tentativas INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recargas_wallet ON wallet_recargas(wallet_id);
CREATE INDEX IF NOT EXISTS idx_recargas_status ON wallet_recargas(status);
CREATE INDEX IF NOT EXISTS idx_recargas_pix_id ON wallet_recargas(pix_id);

-- 5. WALLET_CONFIG
CREATE TABLE IF NOT EXISTS wallet_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  tipo VARCHAR(20) DEFAULT 'string',
  descricao TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- VERIFICAR
SELECT '✅ PARTE 1 - Tabelas criadas!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wallets', 'wallet_transactions', 'reservas', 'wallet_recargas', 'wallet_config');
