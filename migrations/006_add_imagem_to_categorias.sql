-- Migration: Adicionar coluna 'imagem' na tabela categorias
-- Data: 26/10/2025
-- Descrição: Permite armazenar URL da imagem de cada categoria

-- Adicionar coluna imagem (URL da imagem no Supabase Storage)
ALTER TABLE categorias
ADD COLUMN IF NOT EXISTS imagem TEXT;

-- Comentário explicativo
COMMENT ON COLUMN categorias.imagem IS 'URL da imagem da categoria no Supabase Storage';

-- Verificar se foi adicionado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'categorias'
  AND column_name = 'imagem';
