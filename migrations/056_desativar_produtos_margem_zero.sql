-- ============================================
-- Migration 056: Desativar Produtos com Margem Zero
-- ============================================
-- Descrição: URGENTE! Desativa todos os produtos que estão ativos mas têm margem 0%
-- Isso resolve o problema de produtos aparecendo no site público sem preço correto
-- Data: 2026-01-10
-- ============================================

-- 1️⃣ Verificar quantos produtos serão afetados (APENAS PARA DEBUG)
DO $$
DECLARE
  qtd_afetados INTEGER;
BEGIN
  SELECT COUNT(*) INTO qtd_afetados
  FROM reseller_products
  WHERE is_active = true 
    AND (margin_percent IS NULL OR margin_percent = 0)
    AND (custom_price IS NULL OR custom_price = 0);
  
  RAISE NOTICE '📊 Produtos ativos com margem 0%% que serão desativados: %', qtd_afetados;
END $$;

-- 2️⃣ DESATIVAR todos os produtos com margem zero que estão ativos
UPDATE reseller_products
SET 
  is_active = false,
  updated_at = NOW()
WHERE 
  is_active = true 
  AND (margin_percent IS NULL OR margin_percent = 0)
  AND (custom_price IS NULL OR custom_price = 0);

-- 3️⃣ Criar trigger para IMPEDIR ativação de produto com margem zero
CREATE OR REPLACE FUNCTION impedir_ativacao_sem_margem()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está tentando ativar (is_active = true)
  IF NEW.is_active = true THEN
    -- Verificar se tem margem OU preço customizado válido
    IF (NEW.margin_percent IS NULL OR NEW.margin_percent = 0) 
       AND (NEW.custom_price IS NULL OR NEW.custom_price = 0) THEN
      RAISE EXCEPTION 'Não é possível ativar produto sem margem definida. Defina margin_percent > 0 ou custom_price > 0 antes de ativar.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropar trigger se existir
DROP TRIGGER IF EXISTS trigger_impedir_ativacao_sem_margem ON reseller_products;

-- Criar trigger
CREATE TRIGGER trigger_impedir_ativacao_sem_margem
  BEFORE INSERT OR UPDATE ON reseller_products
  FOR EACH ROW
  EXECUTE FUNCTION impedir_ativacao_sem_margem();

-- 4️⃣ Verificar resultado após update
DO $$
DECLARE
  qtd_restantes INTEGER;
BEGIN
  SELECT COUNT(*) INTO qtd_restantes
  FROM reseller_products
  WHERE is_active = true 
    AND (margin_percent IS NULL OR margin_percent = 0)
    AND (custom_price IS NULL OR custom_price = 0);
  
  IF qtd_restantes = 0 THEN
    RAISE NOTICE '✅ SUCESSO! Nenhum produto ativo com margem 0%% restante.';
  ELSE
    RAISE NOTICE '⚠️ ATENÇÃO: Ainda há % produtos ativos com margem 0%%. Verificar!', qtd_restantes;
  END IF;
END $$;

-- 5️⃣ Comentário sobre o trigger
COMMENT ON FUNCTION impedir_ativacao_sem_margem() IS 
  'Trigger que impede a ativação de produtos sem margem definida. 
   A revendedora DEVE definir margin_percent > 0 ou custom_price > 0 antes de ativar.';
