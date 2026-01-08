-- ================================================
-- MIGRATION: Adicionar coluna onboarding_completo
-- ================================================
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar coluna onboarding_completo na tabela resellers
ALTER TABLE resellers 
ADD COLUMN IF NOT EXISTS onboarding_completo BOOLEAN DEFAULT FALSE;

-- 2. Marcar revendedoras existentes (antigas) como já tendo completado o onboarding
-- Para não mostrar o tutorial para quem já usa o sistema
UPDATE resellers 
SET onboarding_completo = TRUE 
WHERE created_at < NOW() - INTERVAL '3 days';

-- 3. Verificar se a coluna foi criada
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'resellers' 
AND column_name = 'onboarding_completo';

-- ================================================
-- RESULTADO ESPERADO:
-- ✅ Coluna onboarding_completo criada
-- ✅ Revendedoras antigas marcadas como completo
-- ✅ Novas revendedoras verão o tutorial
-- ================================================
