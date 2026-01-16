-- ============================================
-- 🔄 SCRIPT 2: TRIGGERS AUTOMÁTICOS (CORRIGIDO)
-- ============================================
-- Cria gatilhos para FUTURAS aprovações
-- Usa apenas ativo = true (ignora admin_aprovado)
-- ============================================

-- ============================================
-- PASSO 1: FUNÇÃO QUE VINCULA PRODUTOS À REVENDEDORA
-- ============================================
CREATE OR REPLACE FUNCTION fn_vincular_produtos_revendedora_aprovada()
RETURNS TRIGGER AS $$
DECLARE
  v_produtos_vinculados INTEGER := 0;
BEGIN
  -- Só executa quando status MUDA PARA 'aprovada'
  IF NEW.status = 'aprovada' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'aprovada') THEN
    
    -- INSERIR todos os produtos ativos para a nova revendedora
    INSERT INTO reseller_products (
      reseller_id,
      product_id,
      margin_percent,
      is_active,
      created_at,
      updated_at
    )
    SELECT 
      NEW.id,                        -- ID da revendedora recém-aprovada
      p.id,                          -- ID do produto
      100,                           -- 🎯 Margem padrão 100%
      true,                          -- ✅ Já vem ATIVO
      NOW(),
      NOW()
    FROM produtos p
    WHERE p.ativo = true             -- Só produtos ativos
    ON CONFLICT (reseller_id, product_id) 
    DO UPDATE SET
      margin_percent = 100,
      is_active = true,
      updated_at = NOW();
    
    GET DIAGNOSTICS v_produtos_vinculados = ROW_COUNT;

    RAISE NOTICE '✅ Revendedora "%" aprovada! % produtos vinculados com margem 100%%.', 
      NEW.name, v_produtos_vinculados;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PASSO 2: TRIGGER PARA UPDATE (aprovação)
-- ============================================
DROP TRIGGER IF EXISTS trg_revendedora_aprovada_vincular_produtos ON resellers;

CREATE TRIGGER trg_revendedora_aprovada_vincular_produtos
  AFTER UPDATE OF status ON resellers
  FOR EACH ROW
  WHEN (NEW.status = 'aprovada' AND OLD.status IS DISTINCT FROM 'aprovada')
  EXECUTE FUNCTION fn_vincular_produtos_revendedora_aprovada();

-- ============================================
-- PASSO 3: TRIGGER PARA INSERT (nova já aprovada)
-- ============================================
DROP TRIGGER IF EXISTS trg_revendedora_nova_aprovada_vincular_produtos ON resellers;

CREATE TRIGGER trg_revendedora_nova_aprovada_vincular_produtos
  AFTER INSERT ON resellers
  FOR EACH ROW
  WHEN (NEW.status = 'aprovada')
  EXECUTE FUNCTION fn_vincular_produtos_revendedora_aprovada();

-- ============================================
-- PASSO 4: FUNÇÃO PARA NOVOS PRODUTOS
-- ============================================
CREATE OR REPLACE FUNCTION fn_vincular_novo_produto_todas_revendedoras()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Quando produto é ATIVADO → vincular a todas as revendedoras aprovadas
  IF NEW.ativo = true AND (TG_OP = 'INSERT' OR OLD.ativo = false) THEN
    
    INSERT INTO reseller_products (
      reseller_id,
      product_id,
      margin_percent,
      is_active,
      created_at,
      updated_at
    )
    SELECT 
      r.id,              -- ID da revendedora
      NEW.id,            -- ID do novo produto
      100,               -- Margem 100%
      true,              -- Ativo
      NOW(),
      NOW()
    FROM resellers r
    WHERE r.status = 'aprovada'
    ON CONFLICT (reseller_id, product_id) 
    DO UPDATE SET 
      is_active = true,
      margin_percent = 100,
      updated_at = NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Produto "%" ativado! Vinculado a % revendedoras.', NEW.nome, v_count;
  END IF;

  -- Quando produto é DESATIVADO → desativar para todas
  IF NEW.ativo = false AND OLD.ativo = true THEN
    
    UPDATE reseller_products
    SET is_active = false, updated_at = NOW()
    WHERE product_id = NEW.id;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RAISE NOTICE '⚠️ Produto "%" desativado para % revendedoras.', NEW.nome, v_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PASSO 5: TRIGGER PARA PRODUTOS
-- ============================================
DROP TRIGGER IF EXISTS trg_produto_ativado_vincular_revendedoras ON produtos;

CREATE TRIGGER trg_produto_ativado_vincular_revendedoras
  AFTER INSERT OR UPDATE OF ativo ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION fn_vincular_novo_produto_todas_revendedoras();

-- ============================================
-- VERIFICAÇÃO: Listar triggers criados
-- ============================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'trg_%'
ORDER BY event_object_table, trigger_name;
