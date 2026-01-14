-- ============================================
-- Migration 063: Fix RLS e Policies para Exclusão de Produtos
-- ============================================
-- PROBLEMA IDENTIFICADO: Tabela 'produtos' não tem RLS nem policies de DELETE
-- IMPACTO: Função excluir_produtos_completo() bloqueada por falta de permissões
-- DATA: 2026-01-13
-- DIAGNÓSTICO: Query revelou que:
--   - produtos: RLS = false, 0 policies de DELETE ❌
--   - reseller_products: RLS = true, 2 policies de DELETE ✅
--   - produto_categorias: RLS = true, 1 policy de DELETE ✅
--   - produtos_franqueadas_precos: RLS = true, mas sem policies explícitas ⚠️
-- SOLUÇÃO: Habilitar RLS e criar policies consistentes em todas as tabelas

-- ============================================
-- PARTE 1: HABILITAR RLS NA TABELA PRODUTOS
-- ============================================

-- Habilitar RLS (idempotente)
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 2: POLICIES DE DELETE PARA PRODUTOS
-- ============================================

-- Policy 1: Service Role pode deletar produtos
DROP POLICY IF EXISTS "Service role pode deletar produtos" ON produtos;
CREATE POLICY "Service role pode deletar produtos"
ON produtos
FOR DELETE
TO service_role
USING (true);

-- Policy 2: Funções do banco podem deletar (auth.uid() IS NULL)
-- Isso permite que SECURITY DEFINER functions deletem
DROP POLICY IF EXISTS "Funções podem deletar produtos" ON produtos;
CREATE POLICY "Funções podem deletar produtos"
ON produtos
FOR DELETE
TO authenticated
USING (auth.uid() IS NULL);

-- ============================================
-- PARTE 3: GARANTIR POLICIES NAS TABELAS FILHAS
-- ============================================

-- produtos_franqueadas_precos: faltava policies explícitas
DROP POLICY IF EXISTS "Service role pode deletar preços" ON produtos_franqueadas_precos;
CREATE POLICY "Service role pode deletar preços"
ON produtos_franqueadas_precos
FOR DELETE
TO service_role
USING (true);

DROP POLICY IF EXISTS "Funções podem deletar preços" ON produtos_franqueadas_precos;
CREATE POLICY "Funções podem deletar preços"
ON produtos_franqueadas_precos
FOR DELETE
TO authenticated
USING (auth.uid() IS NULL);

-- produtos_franqueadas: garantir policy de DELETE
DROP POLICY IF EXISTS "Service role pode deletar produtos_franqueadas" ON produtos_franqueadas;
CREATE POLICY "Service role pode deletar produtos_franqueadas"
ON produtos_franqueadas
FOR DELETE
TO service_role
USING (true);

DROP POLICY IF EXISTS "Funções podem deletar produtos_franqueadas" ON produtos_franqueadas;
CREATE POLICY "Funções podem deletar produtos_franqueadas"
ON produtos_franqueadas
FOR DELETE
TO authenticated
USING (auth.uid() IS NULL);

-- ============================================
-- PARTE 4: VERIFICAÇÃO FINAL
-- ============================================

DO $$
DECLARE
  rls_enabled BOOLEAN;
  total_policies INTEGER;
BEGIN
  -- Confirmar que RLS está ativo
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables 
  WHERE tablename = 'produtos';
  
  IF NOT rls_enabled THEN
    RAISE WARNING '⚠️ RLS não foi habilitado na tabela produtos!';
  ELSE
    RAISE NOTICE '✅ RLS habilitado na tabela produtos';
  END IF;
  
  -- Confirmar que policies existem
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies 
  WHERE tablename = 'produtos' 
  AND cmd = 'DELETE';
  
  IF total_policies = 0 THEN
    RAISE WARNING '⚠️ Nenhuma policy de DELETE foi criada para produtos!';
  ELSE
    RAISE NOTICE '✅ % policy(ies) de DELETE criadas para produtos', total_policies;
  END IF;
END $$;

-- ============================================
-- PARTE 5: TESTE DE EXCLUSÃO (COMENTADO)
-- ============================================

-- Descomente para testar se DELETE agora funciona:

/*
-- 1. Buscar um produto inativo para teste
SELECT id, nome, ativo FROM produtos WHERE ativo = false LIMIT 1;

-- 2. Testar DELETE direto (SUBSTITUA o UUID)
DELETE FROM produtos WHERE id = 'SEU_UUID_AQUI';

-- 3. Se funcionar, reverter (SUBSTITUA os valores)
INSERT INTO produtos (id, nome, ativo, id_externo)
VALUES ('SEU_UUID_AQUI', 'Produto Teste', false, 'ID_EXTERNO_AQUI');
*/

-- ============================================
-- PARTE 6: VERIFICAR POLICIES CRIADAS
-- ============================================

-- Listar todas as policies de DELETE nas tabelas principais
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  LEFT(qual::text, 50) as condicao
FROM pg_policies
WHERE tablename IN ('produtos', 'reseller_products', 'produto_categorias', 'produtos_franqueadas_precos', 'produtos_franqueadas')
  AND cmd = 'DELETE'
ORDER BY tablename, policyname;
