-- ============================================
-- SCRIPT DE DIAGNÓSTICO COMPLETO - EXCLUSÃO DE PRODUTOS
-- ============================================
-- Execute no SQL Editor do Supabase para identificar O QUE está bloqueando

-- ============================================
-- 1. VERIFICAR SE A FUNÇÃO EXISTE
-- ============================================
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'excluir_produtos_completo';
-- ESPERADO: 1 linha (a função deve existir)
-- SE RETORNAR 0: A função NÃO FOI CRIADA!

-- ============================================
-- 2. VERIFICAR PERMISSÕES DA FUNÇÃO
-- ============================================
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proacl as permissions
FROM pg_proc
WHERE proname = 'excluir_produtos_completo';
-- ESPERADO: is_security_definer = true

-- ============================================
-- 3. VERIFICAR RLS NAS TABELAS
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('produtos', 'reseller_products', 'produto_categorias', 
                    'produtos_franqueadas', 'produtos_franqueadas_precos')
ORDER BY tablename;
-- CRÍTICO: produtos deve ter rls_enabled = true

-- ============================================
-- 4. LISTAR POLICIES DE DELETE EM PRODUTOS
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE tablename = 'produtos'
  AND cmd = 'DELETE';
-- CRÍTICO: Deve haver policy para service_role ou auth.uid() IS NULL

-- ============================================
-- 5. LISTAR POLICIES DE DELETE EM PRODUTO_CATEGORIAS
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE tablename = 'produto_categorias'
  AND cmd = 'DELETE';

-- ============================================
-- 6. LISTAR POLICIES DE DELETE EM RESELLER_PRODUCTS
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE tablename = 'reseller_products'
  AND cmd = 'DELETE';

-- ============================================
-- 7. LISTAR POLICIES DE DELETE EM PRODUTOS_FRANQUEADAS_PRECOS
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE tablename = 'produtos_franqueadas_precos'
  AND cmd = 'DELETE';

-- ============================================
-- 8. TESTAR DELETE DIRETO (COMO SERVICE_ROLE)
-- ============================================
-- ATENÇÃO: Use um produto de teste!
-- Descomente e substitua o UUID:

-- SELECT id, nome FROM produtos LIMIT 5;

-- DELETE FROM produtos WHERE id = 'COLE_UUID_AQUI';
-- Se DER ERRO: RLS está bloqueando!
-- Se FUNCIONAR: Problema é na função ou na chamada

-- ============================================
-- 9. VERIFICAR TRIGGERS QUE PODEM INTERFERIR
-- ============================================
SELECT 
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('produtos', 'reseller_products', 'produto_categorias',
                               'produtos_franqueadas', 'produtos_franqueadas_precos')
  AND event_manipulation = 'DELETE'
ORDER BY event_object_table, trigger_name;
-- Se houver triggers em DELETE, podem estar REVERTENDO a exclusão!

-- ============================================
-- 10. VERIFICAR FOREIGN KEYS
-- ============================================
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'produtos';
-- IMPORTANTE: delete_rule deve ser CASCADE

-- ============================================
-- 11. TESTAR A FUNÇÃO COM PRODUTO DE TESTE
-- ============================================
-- ATENÇÃO: Substitua pelo UUID de um produto de TESTE!

-- SELECT excluir_produtos_completo(ARRAY['COLE_UUID_AQUI']::UUID[]);

-- ============================================
-- 12. VERIFICAR LOGS DE ERRO
-- ============================================
SELECT 
  created_at,
  tipo,
  descricao,
  erro
FROM logs_sincronizacao
WHERE tipo LIKE '%exclu%'
  OR erro IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- RESUMO DOS RESULTADOS ESPERADOS:
-- ============================================
-- 1. Função existe: ✅
-- 2. Security definer: ✅ true
-- 3. RLS em produtos: ✅ true
-- 4. Policy DELETE em produtos: ✅ existe para service_role ou auth.uid() IS NULL
-- 5. Policies em outras tabelas: ✅ devem permitir DELETE
-- 6. DELETE direto: ✅ deve funcionar
-- 7. Triggers: ⚠️ não devem REVERTIR DELETE
-- 8. Foreign keys: ✅ delete_rule = CASCADE
-- 9. Função teste: ✅ deve retornar {"success": true, "total_excluidos": 1}

-- ============================================
-- SE ENCONTRAR PROBLEMA:
-- ============================================
-- Copie os resultados de CADA query acima e me envie
-- para que eu possa identificar EXATAMENTE o que está bloqueando
