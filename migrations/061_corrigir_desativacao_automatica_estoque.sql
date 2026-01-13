-- ============================================
-- Migration 061: Corrigir Desativação Automática por Estoque
-- ============================================
-- PROBLEMA: Produtos desativam automaticamente porque o trigger
--           olha apenas produtos.estoque, mas o estoque REAL
--           está nas variações (variacoes_meta[].estoque)
--
-- SOLUÇÃO: Substituir trigger para calcular estoque corretamente
-- ============================================

-- 1️⃣ REMOVER trigger problemático
DROP TRIGGER IF EXISTS trigger_reativar_estoque ON produtos;
DROP FUNCTION IF EXISTS reativar_produto_com_estoque() CASCADE;

RAISE NOTICE '✅ Trigger problemático removido';

-- 2️⃣ CRIAR função que calcula estoque REAL das variações
CREATE OR REPLACE FUNCTION calcular_estoque_total_variacoes(variacoes_meta jsonb)
RETURNS INTEGER AS $$
DECLARE
  estoque_total INTEGER := 0;
  variacao jsonb;
BEGIN
  -- Se não tem variações, retorna 0
  IF variacoes_meta IS NULL OR jsonb_array_length(variacoes_meta) = 0 THEN
    RETURN 0;
  END IF;
  
  -- Somar estoque de cada variação
  FOR variacao IN SELECT * FROM jsonb_array_elements(variacoes_meta)
  LOOP
    estoque_total := estoque_total + COALESCE((variacao->>'estoque')::integer, 0);
  END LOOP;
  
  RETURN estoque_total;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calcular_estoque_total_variacoes IS 
  'Calcula o estoque total somando todas as variações do produto';

-- 3️⃣ CRIAR função que sincroniza campo estoque com soma das variações
CREATE OR REPLACE FUNCTION sincronizar_estoque_variacoes()
RETURNS TRIGGER AS $$
DECLARE
  estoque_calculado INTEGER;
BEGIN
  -- Calcular estoque real das variações
  estoque_calculado := calcular_estoque_total_variacoes(NEW.variacoes_meta);
  
  -- Se o estoque calculado é diferente do campo estoque, atualizar
  IF estoque_calculado IS DISTINCT FROM NEW.estoque THEN
    NEW.estoque := estoque_calculado;
    RAISE NOTICE '📊 Produto % - Estoque sincronizado: %', NEW.nome, estoque_calculado;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4️⃣ CRIAR trigger que mantém campo estoque atualizado
CREATE TRIGGER trigger_sincronizar_estoque_variacoes
BEFORE INSERT OR UPDATE ON produtos
FOR EACH ROW
WHEN (NEW.variacoes_meta IS NOT NULL AND jsonb_array_length(NEW.variacoes_meta) > 0)
EXECUTE FUNCTION sincronizar_estoque_variacoes();

COMMENT ON TRIGGER trigger_sincronizar_estoque_variacoes ON produtos IS
  'Sincroniza automaticamente produtos.estoque com a soma de variacoes_meta[].estoque';

-- 5️⃣ ATUALIZAR estoque de todos os produtos existentes
UPDATE produtos
SET estoque = calcular_estoque_total_variacoes(variacoes_meta)
WHERE variacoes_meta IS NOT NULL 
  AND jsonb_array_length(variacoes_meta) > 0;

-- 6️⃣ VALIDAÇÃO: Verificar produtos que foram corrigidos
DO $$
DECLARE
  qtd_corrigidos INTEGER;
  qtd_zerados INTEGER;
  qtd_com_estoque INTEGER;
BEGIN
  -- Contar produtos corrigidos
  SELECT COUNT(*) INTO qtd_corrigidos
  FROM produtos
  WHERE variacoes_meta IS NOT NULL 
    AND jsonb_array_length(variacoes_meta) > 0;
    
  -- Contar produtos com estoque zerado
  SELECT COUNT(*) INTO qtd_zerados
  FROM produtos
  WHERE variacoes_meta IS NOT NULL 
    AND jsonb_array_length(variacoes_meta) > 0
    AND estoque = 0;
    
  -- Contar produtos com estoque > 0
  SELECT COUNT(*) INTO qtd_com_estoque
  FROM produtos
  WHERE variacoes_meta IS NOT NULL 
    AND jsonb_array_length(variacoes_meta) > 0
    AND estoque > 0;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ MIGRATION 061 APLICADA COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Produtos analisados: %', qtd_corrigidos;
  RAISE NOTICE '   • Com estoque > 0: %', qtd_com_estoque;
  RAISE NOTICE '   • Com estoque = 0: %', qtd_zerados;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger de desativação automática REMOVIDO';
  RAISE NOTICE '✅ Novo sistema de sincronização de estoque ATIVO';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 AGORA:';
  RAISE NOTICE '   • Produtos NÃO desativam automaticamente';
  RAISE NOTICE '   • Campo estoque sincroniza com variações';
  RAISE NOTICE '   • Admin tem controle total de ativação';
  RAISE NOTICE '';
END $$;

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================

-- 1. Copie este SQL completo
-- 2. Acesse Supabase → SQL Editor
-- 3. Cole e execute
-- 4. Aguarde a validação (deve mostrar quantos produtos foram corrigidos)
-- 5. Teste ativar produtos no painel admin

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Para verificar se funcionou:
/*
SELECT 
    nome,
    estoque AS estoque_campo,
    calcular_estoque_total_variacoes(variacoes_meta) AS estoque_calculado,
    jsonb_array_length(variacoes_meta) AS qtd_variacoes
FROM produtos
WHERE variacoes_meta IS NOT NULL
LIMIT 10;
*/
