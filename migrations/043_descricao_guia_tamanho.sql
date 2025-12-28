-- Migration 043: Adicionar descrição e guia de tamanhos nos produtos
-- Data: 2024-12-28

-- Adicionar campo de descrição detalhada
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Adicionar campo para guia de tamanhos (JSON para flexibilidade)
-- Estrutura otimizada para calçados (rasteirinhas, sandálias, etc)
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS size_guide JSONB;

-- Comentários para documentação
COMMENT ON COLUMN produtos.description IS 'Descrição detalhada do produto para exibição na página';
COMMENT ON COLUMN produtos.size_guide IS 'Guia de tamanhos - JSON com image_url, instrucoes e measurements[]';

-- Exemplo de estrutura do size_guide para CALÇADOS:
-- {
--   "image_url": "https://...",  -- Ilustração de como medir o pé/solado
--   "instrucoes": "Como medir seu pé corretamente:\n1. Coloque...",  -- Texto explicativo
--   "measurements": [
--     { "tamanho": "33", "centimetros": "21.5" },
--     { "tamanho": "34", "centimetros": "22" },
--     { "tamanho": "35", "centimetros": "22.5" },
--     { "tamanho": "36", "centimetros": "23" },
--     { "tamanho": "37", "centimetros": "23.5" },
--     { "tamanho": "38", "centimetros": "24" },
--     { "tamanho": "39", "centimetros": "24.5" },
--     { "tamanho": "40", "centimetros": "25" }
--   ]
-- }
