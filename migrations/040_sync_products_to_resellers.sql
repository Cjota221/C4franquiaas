-- ============================================================================
-- Migration 040: Add Sync Triggers for Reseller Products
-- ============================================================================
-- Description: Extends the automatic synchronization to include resellers
--              When admin deactivates a product, it auto-deactivates for ALL:
--              - Franqueadas (already exists in 035)
--              - Revendedoras (new in this migration)
-- Author: System
-- Date: 2025-12-27
-- ============================================================================

-- ===========================================================================
-- STEP 1: Update the existing trigger function to also sync resellers
-- ===========================================================================

CREATE OR REPLACE FUNCTION sync_product_availability_to_all()
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
    
    -- Disable product in all resellers (revendedoras)
    UPDATE reseller_products
    SET 
      is_active = false,
      updated_at = NOW()
    WHERE product_id = NEW.id;
    
    RAISE NOTICE 'Product % deactivated - disabled in all franqueada and reseller sites', NEW.id;
  
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
    
    -- Disable product in all resellers (revendedoras)
    UPDATE reseller_products
    SET 
      is_active = false,
      updated_at = NOW()
    WHERE product_id = NEW.id;
    
    RAISE NOTICE 'Product % out of stock - disabled in all franqueada and reseller sites', NEW.id;
  
  -- Case 3: Product reactivated (ativo changed to true from false)
  -- NOTE: We do NOT auto-enable. Franqueadas and Resellers must manually decide.
  ELSIF (TG_OP = 'UPDATE' AND OLD.ativo = false AND NEW.ativo = true) THEN
    
    RAISE NOTICE 'Product % reactivated - available for manual activation', NEW.id;
  
  -- Case 4: Stock replenished (estoque changed from 0 to > 0)
  -- NOTE: We do NOT auto-enable.
  ELSIF (TG_OP = 'UPDATE' AND OLD.estoque = 0 AND NEW.estoque > 0) THEN
    
    RAISE NOTICE 'Product % restocked - available for manual activation', NEW.id;
  
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- STEP 2: Drop old trigger and create new one with updated function
-- ===========================================================================

DROP TRIGGER IF EXISTS trg_sync_product_availability ON produtos;
DROP TRIGGER IF EXISTS trg_sync_product_availability_to_all ON produtos;

CREATE TRIGGER trg_sync_product_availability_to_all
  AFTER UPDATE OF ativo, estoque ON produtos
  FOR EACH ROW
  WHEN (
    OLD.ativo IS DISTINCT FROM NEW.ativo 
    OR OLD.estoque IS DISTINCT FROM NEW.estoque
  )
  EXECUTE FUNCTION sync_product_availability_to_all();

-- ===========================================================================
-- STEP 3: Ensure reseller_products has updated_at column
-- ===========================================================================

ALTER TABLE reseller_products 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ===========================================================================
-- STEP 4: Create index for faster updates
-- ===========================================================================

CREATE INDEX IF NOT EXISTS idx_reseller_products_product_id 
ON reseller_products(product_id);

CREATE INDEX IF NOT EXISTS idx_reseller_products_is_active 
ON reseller_products(is_active);

-- ===========================================================================
-- STEP 5: Sync existing inactive products
-- ===========================================================================
-- This ensures all currently inactive products are also inactive in reseller_products

UPDATE reseller_products rp
SET is_active = false, updated_at = NOW()
FROM produtos p
WHERE rp.product_id = p.id
  AND (p.ativo = false OR p.estoque = 0)
  AND rp.is_active = true;

-- ===========================================================================
-- COMMENTS
-- ===========================================================================

COMMENT ON FUNCTION sync_product_availability_to_all() IS 
'Automatically syncs product availability changes from admin to ALL sites (franqueadas AND revendedoras). Deactivates everywhere when product is disabled or out of stock.';

COMMENT ON TRIGGER trg_sync_product_availability_to_all ON produtos IS 
'Fires when product status or stock changes to sync availability to ALL franqueada and reseller sites.';

-- ===========================================================================
-- VERIFICATION QUERIES
-- ===========================================================================
-- Run these to verify:
--
-- SELECT * FROM pg_trigger WHERE tgname = 'trg_sync_product_availability_to_all';
--
-- Test (replace with real product ID):
-- UPDATE produtos SET ativo = false WHERE id = 'some-uuid';
-- 
-- Check results:
-- SELECT is_active FROM reseller_products WHERE product_id = 'some-uuid';
-- ===========================================================================
