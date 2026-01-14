-- ============================================
-- FIX: Aumentar limite da função excluir_produtos_completo
-- ============================================
-- PROBLEMA: Limite atual é 10 produtos, mas interface permite 50
-- SOLUÇÃO: Aumentar para 50 e otimizar timeout

-- Execute no Supabase SQL Editor:

CREATE OR REPLACE FUNCTION excluir_produtos_completo(produto_ids UUID[])
RETURNS JSON AS $$
DECLARE
  total_excluidos INTEGER := 0;
  pid UUID;
  ext_id TEXT;
  max_produtos INTEGER := 50; -- ⬆️ AUMENTADO DE 10 PARA 50
BEGIN
  -- Verificar limite
  IF array_length(produto_ids, 1) > max_produtos THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Limite de %s produtos por vez. Recebidos: %s', max_produtos, array_length(produto_ids, 1))
    );
  END IF;

  -- Aumentar timeout para 3 minutos
  SET LOCAL statement_timeout = '180000'; -- ⬆️ AUMENTADO DE 120s PARA 180s

  -- Processar cada produto
  FOREACH pid IN ARRAY produto_ids
  LOOP
    -- Buscar id_externo antes de deletar
    SELECT id_externo INTO ext_id FROM produtos WHERE id = pid;
    
    -- Se tem id_externo, guardar na tabela de excluídos
    IF ext_id IS NOT NULL THEN
      INSERT INTO produtos_excluidos (id_externo, excluido_por) 
      VALUES (ext_id, 'admin') 
      ON CONFLICT (id_externo) DO UPDATE 
      SET excluido_em = NOW(), excluido_por = 'admin';
    END IF;
    
    -- Deletar vinculações com revendedoras
    DELETE FROM reseller_products WHERE product_id = pid;
    
    -- Deletar categorias
    DELETE FROM produto_categorias WHERE produto_id = pid;
    
    -- Deletar preços das franqueadas
    DELETE FROM produtos_franqueadas_precos 
    WHERE produto_franqueada_id IN (
      SELECT id FROM produtos_franqueadas WHERE produto_id = pid
    );
    
    -- Deletar vinculações com franqueadas
    DELETE FROM produtos_franqueadas WHERE produto_id = pid;
    
    -- Deletar o produto
    DELETE FROM produtos WHERE id = pid;
    
    total_excluidos := total_excluidos + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'total_excluidos', total_excluidos,
    'tempo_limite', '180s'
  );
EXCEPTION 
  WHEN query_canceled THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Timeout: operação cancelada. Tente excluir menos produtos por vez.',
      'parcialmente_excluidos', total_excluidos
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'parcialmente_excluidos', total_excluidos
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Confirmar que foi aplicado
SELECT 'Função atualizada! Agora aceita até 50 produtos e tem timeout de 3 minutos' as status;
