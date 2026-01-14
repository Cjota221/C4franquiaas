-- ============================================
-- Migration 063: Fix RLS e Policies para Exclusão de Produtos
-- ============================================
-- PROBLEMA IDENTIFICADO: Tabela 'produtos' não tem RLS nem policies de DELETE
-- IMPACTO: Função excluir_produtos_completo() bloqueada por falta de permissões
-- DATA: 2026-01-13
-- DIAGNÓSTICO: Query revelou que:
--   - produtos: RLS = false, 0 policies de DELETE
--   - reseller_products: RLS = true, 2 policies de DELETE ✅
--   - produto_categorias: RLS = true, 1 policy de DELETE ✅
-- SOLUÇÃO: Habilitar RLS e criar policies consistentes

-- ============================================
-- PARTE 1: HABILITAR RLS NA TABELA PRODUTOS
-- ============================================

-- Se RLS já estiver habilitado, não faz nada (idempotente)
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
DROP POLICY IF EXISTS "Funções podem deletar produtos" ON produtos;
CREATE POLICY "Funções podem deletar produtos"
ON produtos
FOR DELETE
TO authenticated
USING (auth.uid() IS NULL);

-- Policy 3: Admins podem deletar produtos
DROP POLICY IF EXISTS "Admins podem deletar produtos" ON produtos;
CREATE POLICY "Admins podem deletar produtos"
ON produtos
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM resellers WHERE reseller_type = 'franchise'
  )
);

-- ============================================
-- PARTE 3: GARANTIR POLICIES NAS TABELAS FILHAS
-- ============================================

-- Reforçar policy em produtos_franqueadas_precos (estava faltando no diagnóstico)
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

-- ============================================
-- PARTE 4: VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se policies foram criadas corretamente
DO $$
BEGIN
  -- Confirmar que RLS está ativo
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'produtos' 
    AND rowsecurity = true
  ) THEN
    RAISE WARNING 'RLS não foi habilitado na tabela produtos!';
  END IF;
  
  -- Confirmar que policies existem
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'produtos' 
    AND cmd = 'DELETE'
  ) THEN
    RAISE WARNING 'Nenhuma policy de DELETE foi criada para produtos!';
  ELSE
    RAISE NOTICE '✅ Policies de DELETE criadas com sucesso para produtos';
  END IF;
END $$;

-- ============================================
-- TESTE MANUAL (COMENTADO - DESCOMENTE PARA TESTAR)
-- ============================================

-- Listar todas as policies de DELETE
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'produtos' AND cmd = 'DELETE';

-- Verificar RLS
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'produtos';
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
