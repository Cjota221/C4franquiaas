-- ============================================
-- Migration 063: Validação Antes de Excluir Produtos
-- ============================================
-- PROBLEMA: Produtos estão sendo excluídos sem verificar se há referências ativas
-- IMPACTO: Dados órfãos em vendas, carrinhos abandonados, promoções e histórico de estoque

-- ============================================
-- PARTE 1: FUNÇÃO DE VALIDAÇÃO
-- ============================================

CREATE OR REPLACE FUNCTION validar_exclusao_produto(produto_id UUID)
RETURNS JSON AS $$
DECLARE
  total_vendas INTEGER := 0;
  total_carrinhos INTEGER := 0;
  total_promocoes_ativas INTEGER := 0;
  total_movimentacoes INTEGER := 0;
  pode_excluir BOOLEAN := true;
  avisos TEXT[] := ARRAY[]::TEXT[];
  erros TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- 1️⃣ VERIFICAR VENDAS (CRÍTICO - NUNCA EXCLUIR)
  -- Verificar se produto aparece no JSONB items de vendas
  SELECT COUNT(*)
  INTO total_vendas
  FROM vendas
  WHERE items::text LIKE '%"produto_id":"' || produto_id || '"%'
     OR items::text LIKE '%"id":"' || produto_id || '"%';
  
  IF total_vendas > 0 THEN
    pode_excluir := false;
    erros := array_append(erros, format('Produto está em %s venda(s) registrada(s). EXCLUSÃO BLOQUEADA.', total_vendas));
  END IF;

  -- 2️⃣ VERIFICAR CARRINHOS ABANDONADOS ATIVOS (últimos 30 dias)
  SELECT COUNT(*)
  INTO total_carrinhos
  FROM abandoned_cart_items aci
  JOIN abandoned_carts ac ON aci.cart_id = ac.id
  WHERE aci.product_id = produto_id::text
    AND ac.status = 'active'
    AND ac.created_at > NOW() - INTERVAL '30 days';
  
  IF total_carrinhos > 0 THEN
    avisos := array_append(avisos, format('%s carrinho(s) abandonado(s) ativo(s) nos últimos 30 dias.', total_carrinhos));
  END IF;

  -- 3️⃣ VERIFICAR PROMOÇÕES ATIVAS
  SELECT COUNT(*)
  INTO total_promocoes_ativas
  FROM promotions
  WHERE is_active = true
    AND produto_id = ANY(product_ids)
    AND (ends_at IS NULL OR ends_at > NOW());
  
  IF total_promocoes_ativas > 0 THEN
    pode_excluir := false;
    erros := array_append(erros, format('Produto está em %s promoção(ões) ativa(s). DESATIVE AS PROMOÇÕES PRIMEIRO.', total_promocoes_ativas));
  END IF;

  -- 4️⃣ VERIFICAR MOVIMENTAÇÕES DE ESTOQUE RECENTES (últimos 90 dias)
  SELECT COUNT(*)
  INTO total_movimentacoes
  FROM estoque_movimentacoes
  WHERE produto_id = validar_exclusao_produto.produto_id
    AND created_at > NOW() - INTERVAL '90 days';
  
  IF total_movimentacoes > 0 THEN
    avisos := array_append(avisos, format('%s movimentação(ões) de estoque nos últimos 90 dias serão perdidas.', total_movimentacoes));
  END IF;

  -- 5️⃣ RETORNAR RESULTADO
  RETURN json_build_object(
    'pode_excluir', pode_excluir,
    'total_vendas', total_vendas,
    'total_carrinhos_ativos', total_carrinhos,
    'total_promocoes_ativas', total_promocoes_ativas,
    'total_movimentacoes_90dias', total_movimentacoes,
    'erros', erros,
    'avisos', avisos
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 2: ATUALIZAR FUNÇÃO DE EXCLUSÃO
-- ============================================

CREATE OR REPLACE FUNCTION excluir_produtos_completo(produto_ids UUID[])
RETURNS JSON AS $$
DECLARE
  total_excluidos INTEGER := 0;
  total_bloqueados INTEGER := 0;
  pid UUID;
  ext_id TEXT;
  validacao JSON;
  max_produtos INTEGER := 10;
  resultados JSON[] := ARRAY[]::JSON[];
BEGIN
  -- Verificar limite
  IF array_length(produto_ids, 1) > max_produtos THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Limite de %s produtos por vez. Recebidos: %s', max_produtos, array_length(produto_ids, 1))
    );
  END IF;

  -- Aumentar timeout
  SET LOCAL statement_timeout = '120000';

  -- Processar cada produto
  FOREACH pid IN ARRAY produto_ids
  LOOP
    -- 🔍 VALIDAR ANTES DE EXCLUIR
    SELECT validar_exclusao_produto(pid) INTO validacao;
    
    -- Se não pode excluir, pular
    IF NOT (validacao->>'pode_excluir')::boolean THEN
      total_bloqueados := total_bloqueados + 1;
      resultados := array_append(resultados, json_build_object(
        'produto_id', pid,
        'excluido', false,
        'motivo', validacao->>'erros'
      ));
      CONTINUE; -- Pular para o próximo
    END IF;
    
    -- Buscar id_externo antes de deletar
    SELECT id_externo INTO ext_id FROM produtos WHERE id = pid;
    
    -- Se tem id_externo, guardar na tabela de excluídos
    IF ext_id IS NOT NULL THEN
      INSERT INTO produtos_excluidos (id_externo, excluido_por) 
      VALUES (ext_id, 'admin') 
      ON CONFLICT (id_externo) DO UPDATE 
      SET excluido_em = NOW(), excluido_por = 'admin';
    END IF;
    
    -- 1️⃣ SOFT DELETE EM CARRINHOS ABANDONADOS (manter histórico)
    UPDATE abandoned_cart_items 
    SET product_id = 'DELETED_' || product_id
    WHERE product_id = pid::text;
    
    -- 2️⃣ DESATIVAR PROMOÇÕES (não deletar, apenas marcar como inválidas)
    UPDATE promotions
    SET is_active = false,
        description = COALESCE(description, '') || ' [PRODUTO EXCLUÍDO]'
    WHERE pid = ANY(product_ids);
    
    -- 3️⃣ DELETAR vinculações com revendedoras
    DELETE FROM reseller_products WHERE product_id = pid;
    
    -- 4️⃣ DELETAR categorias
    DELETE FROM produto_categorias WHERE produto_id = pid;
    
    -- 5️⃣ DELETAR preços das franqueadas (primeiro por causa da FK)
    DELETE FROM produtos_franqueadas_precos 
    WHERE produto_franqueada_id IN (
      SELECT id FROM produtos_franqueadas WHERE produto_id = pid
    );
    
    -- 6️⃣ DELETAR vinculações com franqueadas
    DELETE FROM produtos_franqueadas WHERE produto_id = pid;
    
    -- 7️⃣ MANTER HISTÓRICO DE ESTOQUE (adicionar flag ao invés de deletar)
    -- NÃO DELETAR: DELETE FROM estoque_movimentacoes WHERE produto_id = pid;
    
    -- 8️⃣ DELETAR o produto
    DELETE FROM produtos WHERE id = pid;
    
    total_excluidos := total_excluidos + 1;
    resultados := array_append(resultados, json_build_object(
      'produto_id', pid,
      'excluido', true,
      'avisos', validacao->>'avisos'
    ));
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'total_excluidos', total_excluidos,
    'total_bloqueados', total_bloqueados,
    'resultados', resultados,
    'tempo_limite', '120s'
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

-- ============================================
-- PARTE 3: PERMISSÕES
-- ============================================

GRANT EXECUTE ON FUNCTION validar_exclusao_produto(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validar_exclusao_produto(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION excluir_produtos_completo(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION excluir_produtos_completo(UUID[]) TO service_role;

-- ============================================
-- PARTE 4: COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION validar_exclusao_produto IS 
  'Valida se um produto pode ser excluído verificando vendas, carrinhos, promoções e movimentações.
   BLOQUEIA exclusão se houver vendas registradas ou promoções ativas.';

COMMENT ON FUNCTION excluir_produtos_completo IS 
  'Exclui produtos com validação prévia.
   - BLOQUEIA se houver vendas registradas
   - BLOQUEIA se houver promoções ativas
   - MANTÉM histórico de movimentações de estoque
   - FAZ soft delete em carrinhos abandonados
   - DESATIVA promoções ao invés de deletar';
