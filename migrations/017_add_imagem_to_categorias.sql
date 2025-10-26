-- Migration: Adicionar campo de imagem para categorias
-- Data: 2025-10-26
-- Descrição: Permite upload de imagem de capa/ícone para cada categoria

-- Adicionar coluna de imagem
ALTER TABLE categorias 
ADD COLUMN IF NOT EXISTS imagem TEXT;

-- Comentário
COMMENT ON COLUMN categorias.imagem IS 'URL da imagem de capa/ícone da categoria';
