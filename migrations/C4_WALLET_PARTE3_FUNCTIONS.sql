-- ============================================
-- 💰 C4 WALLET - PARTE 3: FUNCTIONS
-- Execute APÓS a Parte 2 (RLS)
-- ============================================

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

-- FUNÇÃO DE RESERVA ATÔMICA
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
  v_preco_total := p_preco_unitario * p_quantidade;
  
  SELECT COALESCE((SELECT valor::DECIMAL FROM wallet_config WHERE chave = 'taxa_reserva_percentual'), 0) INTO v_config_taxa_perc;
  SELECT COALESCE((SELECT valor::DECIMAL FROM wallet_config WHERE chave = 'taxa_reserva_fixa'), 0) INTO v_config_taxa_fixa;
  v_taxa_total := (v_preco_total * v_config_taxa_perc / 100) + v_config_taxa_fixa;
  
  SELECT * INTO v_wallet FROM wallets WHERE revendedora_id = p_revendedora_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Carteira não encontrada');
  END IF;
  
  IF v_wallet.status != 'ativo' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Carteira bloqueada ou suspensa');
  END IF;
  
  IF v_wallet.saldo < (v_preco_total + v_taxa_total) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente', 'saldo_atual', v_wallet.saldo, 'valor_necessario', v_preco_total + v_taxa_total);
  END IF;
  
  IF p_variacao_id IS NOT NULL THEN
    SELECT estoque INTO v_estoque_atual FROM produto_variacoes WHERE id = p_variacao_id FOR UPDATE;
  ELSE
    SELECT estoque INTO v_estoque_atual FROM produtos WHERE id = p_produto_id FOR UPDATE;
  END IF;
  
  IF v_estoque_atual IS NULL OR v_estoque_atual < p_quantidade THEN
    RETURN jsonb_build_object('success', false, 'error', 'Estoque insuficiente', 'estoque_disponivel', COALESCE(v_estoque_atual, 0));
  END IF;
  
  UPDATE wallets SET saldo = saldo - (v_preco_total + v_taxa_total) WHERE id = v_wallet.id;
  
  INSERT INTO wallet_transactions (wallet_id, tipo, valor, saldo_anterior, saldo_posterior, descricao, referencia_tipo, metadata)
  VALUES (v_wallet.id, 'DEBITO_RESERVA', v_preco_total + v_taxa_total, v_wallet.saldo, v_wallet.saldo - (v_preco_total + v_taxa_total), 'Reserva de produto', 'reserva', p_metadata)
  RETURNING id INTO v_transaction_id;
  
  IF p_variacao_id IS NOT NULL THEN
    UPDATE produto_variacoes SET estoque = estoque - p_quantidade WHERE id = p_variacao_id;
  ELSE
    UPDATE produtos SET estoque = estoque - p_quantidade WHERE id = p_produto_id;
  END IF;
  
  INSERT INTO reservas (revendedora_id, wallet_id, produto_id, variacao_id, quantidade, preco_unitario, preco_total, transaction_id, expira_em, metadata)
  VALUES (p_revendedora_id, v_wallet.id, p_produto_id, p_variacao_id, p_quantidade, p_preco_unitario, v_preco_total, v_transaction_id, NOW() + INTERVAL '30 days', p_metadata)
  RETURNING id INTO v_reserva_id;
  
  UPDATE wallet_transactions SET referencia_id = v_reserva_id::TEXT WHERE id = v_transaction_id;
  
  RETURN jsonb_build_object('success', true, 'reserva_id', v_reserva_id, 'transaction_id', v_transaction_id, 'valor_debitado', v_preco_total + v_taxa_total, 'novo_saldo', v_wallet.saldo - (v_preco_total + v_taxa_total));
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNÇÃO DE ESTORNO
CREATE OR REPLACE FUNCTION cancelar_reserva(
  p_reserva_id UUID,
  p_motivo TEXT DEFAULT 'Cancelamento solicitado'
)
RETURNS JSONB AS $$
DECLARE
  v_reserva reservas%ROWTYPE;
  v_wallet wallets%ROWTYPE;
BEGIN
  SELECT * INTO v_reserva FROM reservas WHERE id = p_reserva_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reserva não encontrada');
  END IF;
  
  IF v_reserva.status NOT IN ('RESERVADO', 'EM_SEPARACAO') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reserva não pode ser cancelada neste status');
  END IF;
  
  SELECT * INTO v_wallet FROM wallets WHERE id = v_reserva.wallet_id FOR UPDATE;
  
  UPDATE wallets SET saldo = saldo + v_reserva.preco_total WHERE id = v_wallet.id;
  
  INSERT INTO wallet_transactions (wallet_id, tipo, valor, saldo_anterior, saldo_posterior, descricao, referencia_tipo, referencia_id)
  VALUES (v_wallet.id, 'CREDITO_ESTORNO', v_reserva.preco_total, v_wallet.saldo, v_wallet.saldo + v_reserva.preco_total, p_motivo, 'reserva', p_reserva_id::TEXT);
  
  IF v_reserva.variacao_id IS NOT NULL THEN
    UPDATE produto_variacoes SET estoque = estoque + v_reserva.quantidade WHERE id = v_reserva.variacao_id;
  ELSE
    UPDATE produtos SET estoque = estoque + v_reserva.quantidade WHERE id = v_reserva.produto_id;
  END IF;
  
  UPDATE reservas SET status = 'CANCELADO', updated_at = NOW() WHERE id = p_reserva_id;
  
  RETURN jsonb_build_object('success', true, 'valor_estornado', v_reserva.preco_total, 'novo_saldo', v_wallet.saldo + v_reserva.preco_total);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNÇÃO DE CRÉDITO
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
  SELECT * INTO v_wallet FROM wallets WHERE id = p_wallet_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Carteira não encontrada');
  END IF;
  
  UPDATE wallets SET saldo = saldo + p_valor WHERE id = p_wallet_id;
  
  INSERT INTO wallet_transactions (wallet_id, tipo, valor, saldo_anterior, saldo_posterior, descricao, referencia_tipo, referencia_id)
  VALUES (p_wallet_id, p_tipo, p_valor, v_wallet.saldo, v_wallet.saldo + p_valor, p_descricao, p_referencia_tipo, p_referencia_id)
  RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id, 'novo_saldo', v_wallet.saldo + p_valor);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ PARTE 3 - Functions criadas!' as status;
