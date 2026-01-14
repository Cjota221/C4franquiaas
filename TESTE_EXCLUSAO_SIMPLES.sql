-- ============================================
-- TESTE SIMPLES: EXCLUSÃO FUNCIONA?
-- ============================================
-- Execute no SQL Editor do Supabase

-- PASSO 1: Buscar um produto para testar
SELECT 
  id,
  nome,
  id_externo,
  ativo,
  estoque
FROM produtos
WHERE ativo = false  -- Pegar produto inativo para testar
LIMIT 1;

-- ⚠️ COPIE O ID (UUID) DO PRODUTO ACIMA

-- PASSO 2: Testar a função (substitua o UUID)
-- SELECT excluir_produtos_completo(ARRAY['COLE_UUID_AQUI']::UUID[]);

-- PASSO 3: Verificar se foi excluído
-- SELECT * FROM produtos WHERE id = 'COLE_UUID_AQUI';
-- ESPERADO: 0 linhas (produto foi deletado)

-- PASSO 4: Verificar produtos_excluidos
-- SELECT * FROM produtos_excluidos WHERE id_externo = 'COLE_ID_EXTERNO_AQUI';
-- ESPERADO: 1 linha

-- ============================================
-- SE A FUNÇÃO NÃO EXISTIR:
-- ============================================
/*
Migration 060 NÃO foi aplicada!
Copie e execute TODA a migration:
migrations/060_fix_delete_timeout_indices.sql
*/

-- ============================================
-- SE DER ERRO DE RLS:
-- ============================================
/*
Migration 062 NÃO foi aplicada!
Copie e execute TODA a migration:
migrations/062_fix_rls_exclusao_produtos.sql
*/

-- ============================================
-- TESTE ALTERNATIVO: DELETE DIRETO
-- ============================================
-- Se a função não funcionar, tente DELETE direto:
-- DELETE FROM reseller_products WHERE product_id = 'UUID_PRODUTO';
-- DELETE FROM produto_categorias WHERE produto_id = 'UUID_PRODUTO';
-- DELETE FROM produtos WHERE id = 'UUID_PRODUTO';

-- SE DER ERRO em qualquer um: RLS está bloqueando!
