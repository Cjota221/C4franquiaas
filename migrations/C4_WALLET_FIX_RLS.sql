-- ============================================
-- 💰 C4 WALLET - FIX RLS POLICIES
-- Execute para corrigir permissões
-- ============================================

-- WALLETS: Revendedora pode criar própria carteira
DROP POLICY IF EXISTS "Revendedora cria própria carteira" ON wallets;
CREATE POLICY "Revendedora cria própria carteira" ON wallets
  FOR INSERT WITH CHECK (revendedora_id = auth.uid());

-- WALLET_RECARGAS: Revendedora pode criar e ver recargas
DROP POLICY IF EXISTS "Revendedora cria recargas" ON wallet_recargas;
CREATE POLICY "Revendedora cria recargas" ON wallet_recargas
  FOR INSERT WITH CHECK (
    wallet_id IN (SELECT id FROM wallets WHERE revendedora_id = auth.uid())
  );

DROP POLICY IF EXISTS "Revendedora atualiza próprias recargas" ON wallet_recargas;
CREATE POLICY "Revendedora atualiza próprias recargas" ON wallet_recargas
  FOR UPDATE USING (
    wallet_id IN (SELECT id FROM wallets WHERE revendedora_id = auth.uid())
  );

-- RESERVAS: Revendedora pode criar reservas
DROP POLICY IF EXISTS "Revendedora cria reservas" ON reservas;
CREATE POLICY "Revendedora cria reservas" ON reservas
  FOR INSERT WITH CHECK (revendedora_id = auth.uid());

DROP POLICY IF EXISTS "Revendedora atualiza próprias reservas" ON reservas;
CREATE POLICY "Revendedora atualiza próprias reservas" ON reservas
  FOR UPDATE USING (revendedora_id = auth.uid());

-- WALLET_CONFIG: Todos podem ler configurações
DROP POLICY IF EXISTS "Todos leem config" ON wallet_config;
CREATE POLICY "Todos leem config" ON wallet_config
  FOR SELECT USING (true);

-- Habilitar RLS na wallet_config (se ainda não estiver)
ALTER TABLE wallet_config ENABLE ROW LEVEL SECURITY;

-- VERIFICAR
SELECT '✅ RLS Policies atualizadas!' as status;

SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('wallets', 'wallet_transactions', 'reservas', 'wallet_recargas', 'wallet_config');
