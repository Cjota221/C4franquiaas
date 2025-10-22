-- ============================================================================
-- Migration 007.5: Fix franqueadas table ID column
-- ============================================================================
-- Description: Ensures id column has default UUID generation
-- Author: GitHub Copilot
-- Date: 2025-10-21
-- ============================================================================

-- Check if the table exists first
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'franqueadas') THEN
        -- Add default UUID generation to id column if not already set
        ALTER TABLE franqueadas 
        ALTER COLUMN id SET DEFAULT gen_random_uuid();
        
        RAISE NOTICE '✅ Default UUID generation added to franqueadas.id';
    ELSE
        RAISE NOTICE '⚠️ Table franqueadas does not exist yet. Run migration 007 first.';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the default was added:
--
-- SELECT column_name, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'franqueadas' AND column_name = 'id';
-- 
-- Expected result: column_default should show 'gen_random_uuid()'
-- ============================================================================
