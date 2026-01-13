-- ============================================
-- 🔍 DIAGNÓSTICO: Produtos Não São Excluídos
-- ============================================
-- PROBLEMA: API retorna sucesso mas produtos permanecem no banco
-- ============================================

-- 1️⃣ VERIFICAR SE A FUNÇÃO EXISTE
SELECT 
    proname AS nome_funcao,
    prosecdef AS security_definer
FROM pg_proc 
WHERE proname = 'excluir_produtos_completo';

-- Se não retornar nada, a função não existe!
-- Se security_definer = false, pode ser problema de permissões

-- 2️⃣ VERIFICAR POLICIES RLS NA TABELA PRODUTOS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('produtos', 'reseller_products', 'produto_categorias', 'produtos_franqueadas', 'produtos_franqueadas_precos')
AND cmd = 'DELETE';

-- Se houver policies bloqueando DELETE, isso pode ser o problema

-- 3️⃣ VERIFICAR SE RLS ESTÁ ATIVADO
SELECT 
    tablename,
    rowsecurity AS rls_ativo
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('produtos', 'reseller_products', 'produto_categorias', 'produtos_franqueadas', 'produtos_franqueadas_precos');

-- 4️⃣ VERIFICAR TRIGGERS QUE PODEM REVERTER EXCLUSÃO
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table IN ('produtos', 'reseller_products', 'produto_categorias', 'produtos_franqueadas', 'produtos_franqueadas_precos')
AND event_manipulation = 'DELETE';

-- 5️⃣ TESTAR EXCLUSÃO MANUAL DE UM PRODUTO (substitua o ID)
-- ⚠️ CUIDADO: Isso vai excluir de verdade!
/*
DO $$
DECLARE
  teste_produto_id UUID := '34977799-69d0-4ed4-8f60-5252e4866899'; -- SUBSTITUA
BEGIN
  -- Tentar excluir
  DELETE FROM produtos WHERE id = teste_produto_id;
  
  -- Verificar se foi excluído
  PERFORM * FROM produtos WHERE id = teste_produto_id;
  
  IF FOUND THEN
    RAISE NOTICE '❌ Produto ainda existe após DELETE!';
  ELSE
    RAISE NOTICE '✅ Produto foi excluído com sucesso';
  END IF;
  
  -- ROLLBACK para não excluir de verdade (remova se quiser testar de verdade)
  RAISE EXCEPTION 'Rollback de teste';
END $$;
*/

-- ============================================
-- 🔧 SOLUÇÃO TEMPORÁRIA: EXCLUIR MANUALMENTE
-- ============================================
-- Use isso para excluir os 3 produtos problemáticos:

/*
-- IDs dos produtos que não foram excluídos:
-- '34977799-69d0-4ed4-8f60-5252e4866899'
-- '51b2ae57-605d-4c9f-9e4b-335f583e88df'  
-- '5bb1b98d-be33-40ed-9970-08a37c304b05'

DO $$
DECLARE
  produto_id UUID;
  ids UUID[] := ARRAY[
    '34977799-69d0-4ed4-8f60-5252e4866899',
    '51b2ae57-605d-4c9f-9e4b-335f583e88df',
    '5bb1b98d-be33-40ed-9970-08a37c304b05'
  ];
BEGIN
  FOREACH produto_id IN ARRAY ids
  LOOP
    RAISE NOTICE 'Excluindo produto: %', produto_id;
    
    -- Desabilitar RLS temporariamente
    SET LOCAL row_security = off;
    
    -- 1. Excluir reseller_products
    DELETE FROM reseller_products WHERE product_id = produto_id;
    RAISE NOTICE '  ✓ reseller_products excluído';
    
    -- 2. Excluir produto_categorias
    DELETE FROM produto_categorias WHERE produto_id = produto_id;
    RAISE NOTICE '  ✓ produto_categorias excluído';
    
    -- 3. Excluir produtos_franqueadas_precos
    DELETE FROM produtos_franqueadas_precos 
    WHERE produto_franqueada_id IN (
      SELECT id FROM produtos_franqueadas WHERE produto_id = produto_id
    );
    RAISE NOTICE '  ✓ produtos_franqueadas_precos excluído';
    
    -- 4. Excluir produtos_franqueadas
    DELETE FROM produtos_franqueadas WHERE produto_id = produto_id;
    RAISE NOTICE '  ✓ produtos_franqueadas excluído';
    
    -- 5. Excluir produto principal
    DELETE FROM produtos WHERE id = produto_id;
    RAISE NOTICE '  ✓ produto principal excluído';
    
    RAISE NOTICE '✅ Produto % excluído completamente', produto_id;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 TODOS OS PRODUTOS FORAM EXCLUÍDOS!';
END $$;
*/

-- ============================================
-- 📋 INTERPRETAÇÃO DOS RESULTADOS
-- ============================================

-- CAUSA 1: Função não existe
-- SOLUÇÃO: Aplicar migration 060 (já foi aplicada?)

-- CAUSA 2: RLS bloqueando DELETE
-- SOLUÇÃO: Desabilitar RLS ou adicionar policy para service_role

-- CAUSA 3: Trigger revertendo exclusão  
-- SOLUÇÃO: Desabilitar ou modificar trigger

-- CAUSA 4: Falta de permissões
-- SOLUÇÃO: Garantir que função usa SECURITY DEFINER
