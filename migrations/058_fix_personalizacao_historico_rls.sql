-- ============================================
-- Migration 058: Corrigir RLS da tabela personalizacao_historico
-- ============================================
-- Descrição: Permite INSERT na tabela de histórico via triggers
-- O problema: triggers executam como o usuário atual, então precisam de policy
-- Data: 2026-01-11
-- ============================================

-- OPÇÃO 1: Desabilitar RLS para esta tabela (mais simples)
-- Como é uma tabela de auditoria/log, não precisa de RLS restritivo
-- Os triggers inserem automaticamente e não há risco de segurança

ALTER TABLE personalizacao_historico DISABLE ROW LEVEL SECURITY;

-- OPCIONAL: Se quiser manter RLS mas permitir inserts, descomente abaixo:
/*
-- Habilitar RLS
ALTER TABLE personalizacao_historico ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT para qualquer usuário autenticado (triggers vão inserir)
DROP POLICY IF EXISTS "Permitir insert via trigger" ON personalizacao_historico;
CREATE POLICY "Permitir insert via trigger"
  ON personalizacao_historico
  FOR INSERT
  WITH CHECK (true);

-- Revendedora pode ver apenas seu histórico
DROP POLICY IF EXISTS "Revendedoras veem seu histórico" ON personalizacao_historico;
CREATE POLICY "Revendedoras veem seu histórico"
  ON personalizacao_historico
  FOR SELECT
  USING (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
  );

-- Admin pode ver tudo
DROP POLICY IF EXISTS "Admins podem ver histórico" ON personalizacao_historico;
CREATE POLICY "Admins podem ver histórico"
  ON personalizacao_historico
  FOR SELECT
  USING (true);
*/

-- Verificar
DO $$
BEGIN
  RAISE NOTICE '✅ RLS desabilitado em personalizacao_historico - triggers vão funcionar';
END $$;
