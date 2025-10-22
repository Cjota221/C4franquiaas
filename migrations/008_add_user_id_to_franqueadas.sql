-- ============================================================================
-- Migration 008: Add user_id to franqueadas for Supabase Auth integration
-- ============================================================================
-- Description: Links franqueadas to Supabase Auth users for login system
-- Author: GitHub Copilot
-- Date: 2025-10-21
-- ============================================================================

-- Add user_id column to franqueadas table
ALTER TABLE franqueadas 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add senha_definida column to track if password has been set
ALTER TABLE franqueadas 
ADD COLUMN IF NOT EXISTS senha_definida BOOLEAN DEFAULT false;

-- Add ultimo_acesso column to track last login
ALTER TABLE franqueadas 
ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_franqueadas_user_id ON franqueadas(user_id);

-- Add comments for documentation
COMMENT ON COLUMN franqueadas.user_id IS 'ID do usuário no Supabase Auth vinculado a esta franqueada';
COMMENT ON COLUMN franqueadas.senha_definida IS 'Indica se a franqueada já definiu sua senha';
COMMENT ON COLUMN franqueadas.ultimo_acesso IS 'Data e hora do último acesso da franqueada';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the columns were added:
--
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'franqueadas' 
-- AND column_name IN ('user_id', 'senha_definida', 'ultimo_acesso')
-- ORDER BY column_name;
-- ============================================================================
