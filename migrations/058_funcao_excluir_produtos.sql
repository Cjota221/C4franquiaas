-- ============================================
-- FUNÇÃO PARA EXCLUIR PRODUTOS SEM TIMEOUT
-- Execute PRIMEIRO no Supabase SQL Editor
-- ============================================

-- Criar função que exclui produto e todas suas dependências
CREATE OR REPLACE FUNCTION excluir_produtos_completo(produto_ids UUID[])
RETURNS JSON AS $$
DECLARE
  total_excluidos INTEGER := 0;
  produto_id UUID;
BEGIN
  -- Loop por cada produto
  FOREACH produto_id IN ARRAY produto_ids
  LOOP
    -- 1. Deletar vinculações com revendedoras
    DELETE FROM reseller_products WHERE product_id = produto_id;
    
    -- 2. Deletar categorias
    DELETE FROM produto_categorias WHERE produto_id = produto_id;
    
    -- 3. Buscar e deletar franqueadas
    DELETE FROM produtos_franqueadas_precos 
    WHERE produto_franqueada_id IN (
      SELECT id FROM produtos_franqueadas WHERE produto_id = produto_id
    );
    
    DELETE FROM produtos_franqueadas WHERE produto_id = produto_id;
    
    -- 4. Deletar o produto
    DELETE FROM produtos WHERE id = produto_id;
    
    total_excluidos := total_excluidos + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'total_excluidos', total_excluidos
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permissão para a API chamar
GRANT EXECUTE ON FUNCTION excluir_produtos_completo(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION excluir_produtos_completo(UUID[]) TO service_role;

-- Comentário
COMMENT ON FUNCTION excluir_produtos_completo IS 
  'Função para excluir produtos e todas suas dependências de forma otimizada.
   Evita timeout ao processar um produto por vez dentro do banco.';
