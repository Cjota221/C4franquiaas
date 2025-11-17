-- ============================================================================
-- Migration 035: Add Sync Triggers for Product Status and Stock
-- ============================================================================
-- Description: Implements automatic synchronization between admin products and 
--              franqueada/revendedora product visibility
-- Business Rules:
--   - When product is deactivated (ativo = false) → auto-disable in all sites
--   - When stock is depleted (estoque = 0) → auto-disable in all sites  
--   - When reactivated/restocked → set to "ready to activate" (ativo_no_site = false)
--   - Franqueada must manually reactivate products
-- Author: Manus AI
-- Date: 2025-11-17
-- ============================================================================

-- ===========================================================================
-- STEP 1: Create trigger function for produtos table changes
-- ===========================================================================

CREATE OR REPLACE FUNCTION sync_product_availability_to_franchisees()
RETURNS TRIGGER AS $$
BEGIN
  -- Case 1: Product was deactivated (ativo changed to false)
  IF (TG_OP = 'UPDATE' AND OLD.ativo = true AND NEW.ativo = false) THEN
    
    -- Disable product in all franqueadas
    UPDATE produtos_franqueadas_precos
    SET 
      ativo_no_site = false,
      atualizado_em = NOW()
    WHERE produto_franqueada_id IN (
      SELECT id FROM produtos_franqueadas WHERE produto_id = NEW.id
    );
    
    RAISE NOTICE 'Product % deactivated - disabled in all franqueada sites', NEW.id;
  
  -- Case 2: Stock depleted (estoque changed to 0)
  ELSIF (TG_OP = 'UPDATE' AND OLD.estoque > 0 AND NEW.estoque = 0) THEN
    
    -- Disable product in all franqueadas
    UPDATE produtos_franqueadas_precos
    SET 
      ativo_no_site = false,
      atualizado_em = NOW()
    WHERE produto_franqueada_id IN (
      SELECT id FROM produtos_franqueadas WHERE produto_id = NEW.id
    );
    
    RAISE NOTICE 'Product % out of stock - disabled in all franqueada sites', NEW.id;
  
  -- Case 3: Product reactivated (ativo changed to true from false)
  ELSIF (TG_OP = 'UPDATE' AND OLD.ativo = false AND NEW.ativo = true) THEN
    
    -- Set to "ready to activate" but DO NOT auto-enable
    -- Franqueada must manually decide to reactivate
    -- Just update the timestamp to signal availability
    UPDATE produtos_franqueadas_precos
    SET atualizado_em = NOW()
    WHERE produto_franqueada_id IN (
      SELECT id FROM produtos_franqueadas WHERE produto_id = NEW.id
    );
    
    RAISE NOTICE 'Product % reactivated - marked as ready to activate in franqueada panels', NEW.id;
  
  -- Case 4: Stock replenished (estoque changed from 0 to > 0)
  ELSIF (TG_OP = 'UPDATE' AND OLD.estoque = 0 AND NEW.estoque > 0) THEN
    
    -- Set to "ready to activate" but DO NOT auto-enable
    UPDATE produtos_franqueadas_precos
    SET atualizado_em = NOW()
    WHERE produto_franqueada_id IN (
      SELECT id FROM produtos_franqueadas WHERE produto_id = NEW.id
    );
    
    RAISE NOTICE 'Product % restocked - marked as ready to activate in franqueada panels', NEW.id;
  
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- STEP 2: Create trigger on produtos table
-- ===========================================================================

DROP TRIGGER IF EXISTS trg_sync_product_availability ON produtos;

CREATE TRIGGER trg_sync_product_availability
  AFTER UPDATE OF ativo, estoque ON produtos
  FOR EACH ROW
  WHEN (
    -- Only fire when these specific fields change
    OLD.ativo IS DISTINCT FROM NEW.ativo 
    OR OLD.estoque IS DISTINCT FROM NEW.estoque
  )
  EXECUTE FUNCTION sync_product_availability_to_franchisees();

-- ===========================================================================
-- STEP 3: Add helper columns to produtos_franqueadas_precos (if needed)
-- ===========================================================================

-- Add column to track last admin sync (for debugging/auditing)
ALTER TABLE produtos_franqueadas_precos 
ADD COLUMN IF NOT EXISTS ultima_sincronizacao TIMESTAMP DEFAULT NOW();

-- Update existing records
UPDATE produtos_franqueadas_precos 
SET ultima_sincronizacao = atualizado_em 
WHERE ultima_sincronizacao IS NULL;

-- ===========================================================================
-- STEP 4: Create function to check product availability status
-- ===========================================================================

CREATE OR REPLACE FUNCTION get_product_availability_status(p_produto_id BIGINT)
RETURNS TABLE (
  produto_id BIGINT,
  is_active BOOLEAN,
  has_stock BOOLEAN,
  availability_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS produto_id,
    p.ativo AS is_active,
    (p.estoque > 0) AS has_stock,
    CASE 
      WHEN NOT p.ativo THEN 'DESATIVADO_ADMIN'
      WHEN p.estoque = 0 THEN 'SEM_ESTOQUE'
      ELSE 'DISPONIVEL'
    END AS availability_status
  FROM produtos p
  WHERE p.id = p_produto_id;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- VERIFICATION QUERIES
-- ===========================================================================
-- Run these to verify the triggers were created:
--
-- SELECT * FROM pg_trigger WHERE tgname = 'trg_sync_product_availability';
-- 
-- SELECT proname, prosrc FROM pg_proc 
-- WHERE proname = 'sync_product_availability_to_franchisees';
--
-- Test the function:
-- SELECT * FROM get_product_availability_status(1);
--
-- Test trigger (replace with real product ID):
-- UPDATE produtos SET ativo = false WHERE id = 1;
-- SELECT * FROM produtos_franqueadas_precos WHERE produto_franqueada_id IN 
--   (SELECT id FROM produtos_franqueadas WHERE produto_id = 1);
-- ===========================================================================

COMMENT ON FUNCTION sync_product_availability_to_franchisees() IS 
'Automatically syncs product availability changes from admin to all franqueada sites. Deactivates when product is disabled or out of stock, marks as ready when reactivated/restocked.';

COMMENT ON FUNCTION get_product_availability_status(BIGINT) IS 
'Returns the current availability status of a product for debugging and display purposes.';

COMMENT ON TRIGGER trg_sync_product_availability ON produtos IS 
'Fires when product status or stock changes to sync availability to all franqueada sites.';
