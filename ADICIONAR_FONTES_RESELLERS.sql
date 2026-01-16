-- ============================================
-- 🎨 ADICIONAR COLUNAS DE FONTE NA TABELA RESELLERS
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Adicionar colunas de fonte (se não existirem)
ALTER TABLE resellers 
ADD COLUMN IF NOT EXISTS fonte_principal VARCHAR(100) DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS fonte_secundaria VARCHAR(100) DEFAULT 'Inter';

-- 2. Comentários
COMMENT ON COLUMN resellers.fonte_principal IS 'Fonte principal do site (Google Fonts)';
COMMENT ON COLUMN resellers.fonte_secundaria IS 'Fonte secundária do site (Google Fonts)';

-- 3. Verificar se foi criado
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'resellers' 
AND column_name IN ('fonte_principal', 'fonte_secundaria');

-- ============================================
-- 📊 FONTES DISPONÍVEIS:
-- ============================================
-- Inter (padrão) - Moderna, legível
-- Poppins - Moderna, arredondada
-- Montserrat - Moderna, geométrica
-- Roboto - Moderna, versátil
-- Open Sans - Moderna, neutra
-- Lato - Moderna, humanista
-- Nunito - Arredondada, amigável
-- Quicksand - Arredondada, geométrica
-- Comfortaa - Arredondada, moderna
-- Playfair Display - Elegante, serifada
-- Cormorant Garamond - Elegante, clássica
-- Libre Baskerville - Elegante, tradicional
-- Raleway - Sofisticada, display
-- Josefin Sans - Sofisticada, geométrica
-- DM Sans - Moderna, clean
-- Space Grotesk - Tech, futurista

-- ============================================
-- 🔄 EXEMPLO: Atualizar fonte de uma revendedora
-- ============================================
-- UPDATE resellers 
-- SET fonte_principal = 'Poppins'
-- WHERE slug = 'minha-loja';
