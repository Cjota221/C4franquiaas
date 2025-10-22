-- Migration 012: Adicionar campo descricao na tabela produtos
-- Data: 22 de outubro de 2025
-- Descrição: Adiciona campo descricao para exibir nos sites das franqueadas

BEGIN;

-- Adicionar campo descricao
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Adicionar comentário
COMMENT ON COLUMN produtos.descricao IS 'Descrição completa do produto exibida no site';

COMMIT;

-- Verificar
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'produtos' 
  AND column_name = 'descricao';
