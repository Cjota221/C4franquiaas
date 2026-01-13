-- ============================================
-- Migration 057: Margem Padrão de 100%
-- ============================================
-- Descrição: Define margem padrão de 100% para todos os produtos
-- Fluxo: Admin ativa → aparece para revendedora com 100% de margem
-- Data: 2026-01-13
-- ============================================

-- 1️⃣ REMOVER o trigger que bloqueia ativação sem margem (não precisa mais)
DROP TRIGGER IF EXISTS trigger_impedir_ativacao_sem_margem ON reseller_products;
DROP FUNCTION IF EXISTS impedir_ativacao_sem_margem() CASCADE;

-- 2️⃣ ATUALIZAR todos os produtos existentes para ter margem 100%
-- (apenas os que não têm margem definida ou têm margem 0)
UPDATE reseller_products
SET 
  margin_percent = 100,
  is_active = true,
  updated_at = NOW()
WHERE 
  (margin_percent IS NULL OR margin_percent = 0)
  AND (custom_price IS NULL OR custom_price = 0);

-- 3️⃣ Ativar todos os produtos que estavam inativos por falta de margem
-- (agora que todos têm margem 100%)
UPDATE reseller_products rp
SET 
  is_active = true,
  margin_percent = COALESCE(margin_percent, 100),
  updated_at = NOW()
FROM produtos p
WHERE rp.product_id = p.id
  AND p.ativo = true
  AND p.admin_aprovado = true
  AND rp.is_active = false;

-- 4️⃣ RECRIAR o trigger de auto-vinculação com margem padrão de 100%
CREATE OR REPLACE FUNCTION auto_vincular_produto_revendedoras()
RETURNS TRIGGER AS $$
DECLARE
  revendedora RECORD;
  contador INTEGER := 0;
BEGIN
  -- Só executa quando produto é ativado (ativo = true E admin_aprovado = true)
  IF NEW.ativo = true AND NEW.admin_aprovado = true THEN
    -- Para cada revendedora ativa
    FOR revendedora IN 
      SELECT id FROM resellers WHERE is_active = true AND status = 'aprovada'
    LOOP
      -- Inserir ou atualizar vinculação com MARGEM PADRÃO DE 100%
      INSERT INTO reseller_products (
        reseller_id, 
        product_id, 
        is_active, 
        margin_percent,  -- MARGEM PADRÃO 100%
        created_at, 
        updated_at
      )
      VALUES (
        revendedora.id, 
        NEW.id, 
        true,           -- Já ativo
        100,            -- MARGEM 100%
        NOW(), 
        NOW()
      )
      ON CONFLICT (reseller_id, product_id) 
      DO UPDATE SET 
        is_active = true,
        margin_percent = COALESCE(reseller_products.margin_percent, 100),  -- Mantém margem se já definida
        updated_at = NOW();
      
      contador := contador + 1;
    END LOOP;
    
    -- Log
    IF contador > 0 THEN
      RAISE NOTICE 'Produto % vinculado a % revendedoras com margem 100%%', NEW.nome, contador;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropar trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_auto_vincular_produto_revendedoras ON produtos;

-- Criar trigger
CREATE TRIGGER trigger_auto_vincular_produto_revendedoras
  AFTER INSERT OR UPDATE OF ativo, admin_aprovado ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION auto_vincular_produto_revendedoras();

-- 5️⃣ Verificar resultado
DO $$
DECLARE
  total_vinculacoes INTEGER;
  vinculacoes_ativas INTEGER;
  vinculacoes_com_margem INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_vinculacoes FROM reseller_products;
  SELECT COUNT(*) INTO vinculacoes_ativas FROM reseller_products WHERE is_active = true;
  SELECT COUNT(*) INTO vinculacoes_com_margem FROM reseller_products WHERE margin_percent >= 100;
  
  RAISE NOTICE '📊 RESULTADO:';
  RAISE NOTICE '   Total de vinculações: %', total_vinculacoes;
  RAISE NOTICE '   Vinculações ativas: %', vinculacoes_ativas;
  RAISE NOTICE '   Com margem >= 100%%: %', vinculacoes_com_margem;
END $$;

-- 6️⃣ Comentário
COMMENT ON FUNCTION auto_vincular_produto_revendedoras() IS 
  'Trigger que vincula automaticamente produtos ativados a todas as revendedoras ativas.
   Margem padrão: 100% (revendedora pode alterar depois).
   Criado em: 2026-01-13';
