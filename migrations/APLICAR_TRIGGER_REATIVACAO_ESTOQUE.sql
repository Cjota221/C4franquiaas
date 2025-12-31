-- ============================================================================
-- CORREÇÃO: Reativação Automática de Produtos com Estoque Reposto
-- ============================================================================
-- PROBLEMA: Produtos com estoque reposto não reativam automaticamente
-- SOLUÇÃO: Trigger que reativa produtos quando estoque muda de 0 para > 0
-- ============================================================================

-- STEP 1: Criar função que reativa produtos automaticamente
CREATE OR REPLACE FUNCTION reativar_produto_com_estoque()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se estoque mudou de 0 para > 0 e produto está ativo
  IF (OLD.estoque = 0 OR OLD.estoque IS NULL) AND NEW.estoque > 0 AND NEW.ativo = true THEN
    
    RAISE NOTICE '🔄 Produto % teve estoque reposto: % → %', NEW.nome, OLD.estoque, NEW.estoque;
    
    -- Reativar em produtos_franqueadas_precos
    UPDATE produtos_franqueadas_precos
    SET ativo_no_site = true,
        updated_at = NOW()
    WHERE produto_franqueada_id IN (
      SELECT id FROM produtos_franqueadas WHERE produto_id = NEW.id
    )
    AND ativo_no_site = false; -- Só reativar os que estão desativados
    
    RAISE NOTICE '✅ Produto % reativado nas franqueadas', NEW.nome;
    
    -- Reativar em reseller_products
    UPDATE reseller_products
    SET is_active = true,
        updated_at = NOW()
    WHERE product_id = NEW.id
    AND is_active = false; -- Só reativar os que estão desativados
    
    RAISE NOTICE '✅ Produto % reativado nas revendedoras', NEW.nome;
    
    -- Registrar log
    INSERT INTO logs_sincronizacao (
      tipo,
      produto_id,
      facilzap_id,
      descricao,
      payload,
      sucesso,
      erro
    ) VALUES (
      'reativacao_automatica',
      NEW.id,
      NEW.facilzap_id,
      format('Produto "%s" reativado automaticamente (estoque: %s → %s)', NEW.nome, OLD.estoque, NEW.estoque),
      jsonb_build_object(
        'produto_id', NEW.id,
        'nome', NEW.nome,
        'estoque_anterior', OLD.estoque,
        'estoque_novo', NEW.estoque
      ),
      true,
      null
    );
    
  END IF;
  
  -- Se estoque mudou para 0, desativar
  IF OLD.estoque > 0 AND NEW.estoque = 0 THEN
    
    RAISE NOTICE '⚠️ Produto % ficou sem estoque: % → 0', NEW.nome, OLD.estoque;
    
    -- Desativar em produtos_franqueadas_precos
    UPDATE produtos_franqueadas_precos
    SET ativo_no_site = false,
        updated_at = NOW()
    WHERE produto_franqueada_id IN (
      SELECT id FROM produtos_franqueadas WHERE produto_id = NEW.id
    )
    AND ativo_no_site = true;
    
    RAISE NOTICE '❌ Produto % desativado nas franqueadas (sem estoque)', NEW.nome;
    
    -- Desativar em reseller_products
    UPDATE reseller_products
    SET is_active = false,
        updated_at = NOW()
    WHERE product_id = NEW.id
    AND is_active = true;
    
    RAISE NOTICE '❌ Produto % desativado nas revendedoras (sem estoque)', NEW.nome;
    
    -- Registrar log
    INSERT INTO logs_sincronizacao (
      tipo,
      produto_id,
      facilzap_id,
      descricao,
      payload,
      sucesso,
      erro
    ) VALUES (
      'desativacao_automatica',
      NEW.id,
      NEW.facilzap_id,
      format('Produto "%s" desativado automaticamente (estoque zerado)', NEW.nome),
      jsonb_build_object(
        'produto_id', NEW.id,
        'nome', NEW.nome,
        'estoque_anterior', OLD.estoque,
        'estoque_novo', 0
      ),
      true,
      null
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_reativar_estoque ON produtos;

-- STEP 3: Criar novo trigger
CREATE TRIGGER trigger_reativar_estoque
AFTER UPDATE ON produtos
FOR EACH ROW
WHEN (OLD.estoque IS DISTINCT FROM NEW.estoque) -- Só executa se estoque mudou
EXECUTE FUNCTION reativar_produto_com_estoque();

-- STEP 4: Adicionar comentários
COMMENT ON FUNCTION reativar_produto_com_estoque() IS 
'Trigger que reativa/desativa automaticamente produtos quando estoque muda.
- Estoque 0 → >0: Reativa em franqueadas e revendedoras
- Estoque >0 → 0: Desativa em franqueadas e revendedoras';

COMMENT ON TRIGGER trigger_reativar_estoque ON produtos IS
'Executa reativação/desativação automática quando estoque é alterado';

-- STEP 5: Validação
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ TRIGGER DE REATIVAÇÃO AUTOMÁTICA CRIADO COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Comportamento:';
  RAISE NOTICE '  ✓ Estoque 0 → >0: Reativa automaticamente';
  RAISE NOTICE '  ✓ Estoque >0 → 0: Desativa automaticamente';
  RAISE NOTICE '  ✓ Aplica em franqueadas e revendedoras';
  RAISE NOTICE '  ✓ Registra logs de auditoria';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Para testar:';
  RAISE NOTICE '  1. Zere o estoque de um produto';
  RAISE NOTICE '  2. Repor estoque (qualquer valor > 0)';
  RAISE NOTICE '  3. Produto reativará automaticamente';
  RAISE NOTICE '';
END $$;
