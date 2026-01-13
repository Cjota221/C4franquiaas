-- ============================================
-- Migration 060 - VERSÃO CONCORRENTE (NÃO-BLOQUEANTE)
-- ============================================
-- ❌ ATENÇÃO: ESTE ARQUIVO NÃO FUNCIONA NO SUPABASE SQL EDITOR!
-- 
-- O Supabase SQL Editor executa comandos dentro de transação,
-- e CREATE INDEX CONCURRENTLY não pode rodar em transação.
--
-- ============================================
-- SOLUÇÃO: USE A OPÇÃO 1 (SEM CONCURRENTLY)
-- ============================================
-- 
-- Use o arquivo: 060_fix_delete_timeout_indices.sql
-- Ele funcionará perfeitamente no Supabase SQL Editor
--
-- Este arquivo é útil APENAS se você tiver acesso direto ao PostgreSQL
-- via psql ou outro cliente que permita autocommit.
--
-- ============================================
-- PARA USAR CONCURRENTLY (via psql):
-- ============================================
-- 1. Conecte via psql com autocommit ON
-- 2. Execute cada comando abaixo separadamente
-- 3. Aguarde cada índice terminar antes do próximo

-- ============================================
-- PARTE 1: ÍNDICES (executar UM POR VEZ)
-- ============================================

-- COMANDO 1: Executar sozinho
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reseller_products_product_id 
ON reseller_products(product_id);

-- ⏳ AGUARDE TERMINAR antes de executar o próximo!

-- COMANDO 2: Executar sozinho
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_produtos_franqueadas_precos_produto_franqueada 
ON produtos_franqueadas_precos(produto_franqueada_id);

-- ⏳ AGUARDE TERMINAR antes de executar o próximo!

-- COMANDO 3: Executar sozinho
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reseller_products_product_active 
ON reseller_products(product_id, is_active);

-- ⏳ AGUARDE TERMINAR antes de prosseguir!

-- ============================================
-- PARTE 2: FUNÇÃO E VALIDAÇÃO (executar tudo junto)
-- ============================================
-- ✅ Após criar todos os índices acima, copie e execute tudo abaixo:

CREATE OR REPLACE FUNCTION excluir_produtos_completo(produto_ids UUID[])
RETURNS JSON AS $$
DECLARE
  total_excluidos INTEGER := 0;
  pid UUID;
  ext_id TEXT;
  max_produtos INTEGER := 10;
BEGIN
  IF array_length(produto_ids, 1) > max_produtos THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Limite de %s produtos por vez. Recebidos: %s', max_produtos, array_length(produto_ids, 1))
    );
  END IF;

  SET LOCAL statement_timeout = '120000';

  FOREACH pid IN ARRAY produto_ids
  LOOP
    SELECT id_externo INTO ext_id FROM produtos WHERE id = pid;
    
    IF ext_id IS NOT NULL THEN
      INSERT INTO produtos_excluidos (id_externo, excluido_por) 
      VALUES (ext_id, 'admin') 
      ON CONFLICT (id_externo) DO UPDATE 
      SET excluido_em = NOW(), excluido_por = 'admin';
    END IF;
    
    DELETE FROM reseller_products WHERE product_id = pid;
    DELETE FROM produto_categorias WHERE produto_id = pid;
    DELETE FROM produtos_franqueadas_precos 
    WHERE produto_franqueada_id IN (
      SELECT id FROM produtos_franqueadas WHERE produto_id = pid
    );
    DELETE FROM produtos_franqueadas WHERE produto_id = pid;
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

GRANT EXECUTE ON FUNCTION excluir_produtos_completo(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION excluir_produtos_completo(UUID[]) TO service_role;

COMMENT ON INDEX idx_reseller_products_product_id IS 
  'Índice crítico para evitar FULL TABLE SCAN ao deletar produtos.';

COMMENT ON FUNCTION excluir_produtos_completo IS 
  'Função otimizada para excluir produtos com timeout de 120s.';

-- Validação
DO $$
DECLARE
  idx_count INTEGER;
BEGIN
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
  ELSE
    RAISE WARNING '⚠️  Apenas % de 3 índices criados', idx_count;
  END IF;
END $$;

-- ============================================
-- RESUMO:
-- ============================================
-- ✅ VANTAGEM: Não trava as tabelas durante criação dos índices
-- ⏱️ TEMPO: 3-10 minutos (dependendo do volume de dados)
-- 📋 PASSOS: 4 execuções separadas (3 índices + função)
