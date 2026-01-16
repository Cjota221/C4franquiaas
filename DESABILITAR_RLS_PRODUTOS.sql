-- ============================================
-- 🚨 FIX AGRESSIVO - DESABILITAR RLS TEMPORARIAMENTE
-- Se isso funcionar, o problema são as policies
-- ============================================

-- OPÇÃO 1: DESABILITAR RLS (mais simples, menos seguro)
-- ⚠️ CUIDADO: Isso remove toda proteção de linha
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'produtos';

-- Se relrowsecurity = false, RLS está desabilitado

-- ============================================
-- DEPOIS DE TESTAR, SE QUISER REABILITAR:
-- ============================================
-- ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
-- E aí precisará recriar as policies
