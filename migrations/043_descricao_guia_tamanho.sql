-- Migration 043: Adicionar descrição e guia de tamanhos nos produtos
-- Data: 2024-12-28

-- Adicionar campo de descrição detalhada
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Adicionar campo para guia de tamanhos (JSON para flexibilidade)
-- Pode conter: imagem URL ou tabela de medidas
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS size_guide JSONB;

-- Comentários para documentação
COMMENT ON COLUMN produtos.description IS 'Descrição detalhada do produto para exibição na página';
COMMENT ON COLUMN produtos.size_guide IS 'Guia de tamanhos - JSON com image_url e/ou measurements[]';

-- Exemplo de estrutura do size_guide:
-- {
--   "image_url": "https://...",
--   "measurements": [
--     { "size": "P", "busto": "88-92", "cintura": "68-72", "quadril": "94-98" },
--     { "size": "M", "busto": "92-96", "cintura": "72-76", "quadril": "98-102" },
--     { "size": "G", "busto": "96-100", "cintura": "76-80", "quadril": "102-106" },
--     { "size": "GG", "busto": "100-104", "cintura": "80-84", "quadril": "106-110" }
--   ]
-- }
