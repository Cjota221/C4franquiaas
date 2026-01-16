-- ============================================
-- 💰 C4 WALLET - PARTE 4: VIEWS
-- Execute APÓS a Parte 3 (functions)
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
  res.variacao_id,
  res.metadata->>'tamanho' as tamanho,
  res.metadata->>'cor' as cor,
  res.quantidade,
  res.preco_total,
  res.status,
  res.created_at as reservado_em,
  EXTRACT(EPOCH FROM (NOW() - res.created_at))/3600 as horas_aguardando
FROM reservas res
JOIN resellers r ON r.id = res.revendedora_id
JOIN produtos p ON p.id = res.produto_id
WHERE res.status IN ('RESERVADO', 'EM_SEPARACAO')
ORDER BY res.created_at ASC;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

SELECT '✅ C4 WALLET COMPLETO!' as status;

-- Listar tabelas criadas
SELECT table_name as "Tabelas Criadas"
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wallets', 'wallet_transactions', 'reservas', 'wallet_recargas', 'wallet_config');

-- Listar views criadas
SELECT table_name as "Views Criadas"
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('vw_wallet_resumo', 'vw_fila_separacao');

-- Listar functions criadas
SELECT routine_name as "Functions Criadas"
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('fazer_reserva', 'cancelar_reserva', 'creditar_carteira', 'criar_carteira_revendedora', 'update_wallet_timestamp');
