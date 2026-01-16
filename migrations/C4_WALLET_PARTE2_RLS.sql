-- ============================================
-- 💰 C4 WALLET - PARTE 2: RLS POLICIES
-- Execute APÓS a Parte 1 (tabelas)
-- ============================================

-- Habilitar RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_recargas ENABLE ROW LEVEL SECURITY;

-- WALLETS
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

-- TRANSACTIONS
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

-- RESERVAS
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

-- RECARGAS
DROP POLICY IF EXISTS "Revendedora vê próprias recargas" ON wallet_recargas;
CREATE POLICY "Revendedora vê próprias recargas" ON wallet_recargas
  FOR SELECT USING (
    wallet_id IN (SELECT id FROM wallets WHERE revendedora_id = auth.uid())
  );

SELECT '✅ PARTE 2 - RLS Policies criadas!' as status;
