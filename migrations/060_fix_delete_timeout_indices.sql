-- ============================================
-- Migration 060: Fix Timeout na Exclusão de Produtos
-- ============================================
-- Problema: Timeout ao excluir produtos devido à falta de índice na FK product_id
-- Solução: Adicionar índices críticos para exclusão + otimizar statement timeout

-- 📊 DIAGNÓSTICO DO PROBLEMA:
-- 1. reseller_products.product_id NÃO tinha índice (causa FULL TABLE SCAN)
-- 2. Outras tabelas também podem ter FKs sem índice
-- 3. Statement timeout padrão do Supabase: 30 segundos

-- ============================================
-- PARTE 1: ADICIONAR ÍNDICES CRÍTICOS
-- ============================================
-- ⚠️ NOTA: Removido CONCURRENTLY para permitir execução em transação
-- Os índices serão criados de forma bloqueante (pode travar tabela por alguns segundos)
-- Se o sistema estiver em uso pesado, execute em horário de baixo tráfego

-- 🔥 CRÍTICO: Índice na FK product_id de reseller_products
CREATE INDEX IF NOT EXISTS idx_reseller_products_product_id 
ON reseller_products(product_id);

-- Melhorar outros índices para exclusão
CREATE INDEX IF NOT EXISTS idx_produtos_franqueadas_precos_produto_franqueada 
ON produtos_franqueadas_precos(produto_franqueada_id);

-- Índice composto para verificar vinculações ativas
CREATE INDEX IF NOT EXISTS idx_reseller_products_product_active 
ON reseller_products(product_id, is_active);

-- ============================================
-- PARTE 2: ATUALIZAR FUNÇÃO DE EXCLUSÃO COM TIMEOUT
-- ============================================

CREATE OR REPLACE FUNCTION excluir_produtos_completo(produto_ids UUID[])
RETURNS JSON AS $$
DECLARE
  total_excluidos INTEGER := 0;
  pid UUID;
  ext_id TEXT;
  max_produtos INTEGER := 10; -- Limitar a 10 produtos por chamada
BEGIN
  -- ⚠️ Verificar se não está tentando excluir muitos produtos de uma vez
  IF array_length(produto_ids, 1) > max_produtos THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Limite de %s produtos por vez. Recebidos: %s', max_produtos, array_length(produto_ids, 1))
    );
  END IF;

  -- ⏱️ Aumentar timeout para esta transação (2 minutos)
  SET LOCAL statement_timeout = '120000'; -- 120 segundos

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
    
    -- 1️⃣ DELETAR vinculações com revendedoras (agora com índice!)
    DELETE FROM reseller_products WHERE product_id = pid;
    
    -- 2️⃣ DELETAR categorias
    DELETE FROM produto_categorias WHERE produto_id = pid;
    
    -- 3️⃣ DELETAR preços das franqueadas (primeiro por causa da FK)
    DELETE FROM produtos_franqueadas_precos 
    WHERE produto_franqueada_id IN (
      SELECT id FROM produtos_franqueadas WHERE produto_id = pid
    );
    
    -- 4️⃣ DELETAR vinculações com franqueadas
    DELETE FROM produtos_franqueadas WHERE produto_id = pid;
    
    -- 5️⃣ DELETAR o produto
    DELETE FROM produtos WHERE id = pid;
    
    total_excluidos := total_excluidos + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'total_excluidos', total_excluidos,
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
-- PARTE 3: ATUALIZAR PERMISSÕES
-- ============================================

GRANT EXECUTE ON FUNCTION excluir_produtos_completo(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION excluir_produtos_completo(UUID[]) TO service_role;

-- ============================================
-- PARTE 4: COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON INDEX idx_reseller_products_product_id IS 
  'Índice crítico para evitar FULL TABLE SCAN ao deletar produtos. 
   Sem este índice, exclusões causam timeout.';

COMMENT ON FUNCTION excluir_produtos_completo IS 
  'Função otimizada para excluir produtos com timeout de 120s.
   Limite: 10 produtos por chamada.
   Trata erro de timeout e retorna quantos foram excluídos parcialmente.';

-- ============================================
-- PARTE 5: VALIDAÇÃO
-- ============================================

DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  -- Verificar se os índices foram criados
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes 
  WHERE schemaname = 'public' 
    AND indexname IN (
      'idx_reseller_products_product_id',
      'idx_reseller_products_product_active',
      'idx_produtos_franqueadas_precos_produto_franqueada'
    );
  
  IF idx_count >= 3 THEN
    RAISE NOTICE '✅ Migration 060 aplicada com sucesso!';
    RAISE NOTICE '✅ % índices críticos criados', idx_count;
    RAISE NOTICE '✅ Função excluir_produtos_completo atualizada';
    RAISE NOTICE '⏱️  Timeout aumentado para 120 segundos';
    RAISE NOTICE '📊 Limite de 10 produtos por exclusão';
  ELSE
    RAISE WARNING '⚠️  Apenas % de 3 índices criados', idx_count;
  END IF;
END $$;

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================

-- Para executar:
-- 1. Copie este SQL completo
-- 2. Acesse Supabase → SQL Editor
-- 3. Cole e execute
-- 4. Aguarde a criação dos índices (pode levar alguns minutos)
-- 5. Teste excluir alguns produtos no painel admin

-- Para verificar se funcionou:
-- SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public' AND relname = 'reseller_products';
