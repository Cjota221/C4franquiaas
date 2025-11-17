-- Migration 034: Adicionar campo created_at aos produtos
-- Objetivo: Identificar produtos novos por data real de criação

-- 1. Adicionar coluna created_at com timestamp padrão agora
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Para produtos existentes sem data, usar a data atual como base
UPDATE produtos 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- 3. Criar índice para melhorar performance de consultas por data
CREATE INDEX IF NOT EXISTS idx_produtos_created_at ON produtos(created_at DESC);

-- 4. Criar índice composto para filtros combinados (ativo + data)
CREATE INDEX IF NOT EXISTS idx_produtos_ativo_created_at ON produtos(ativo, created_at DESC) WHERE ativo = true;

-- 5. Criar índice para produtos com estoque disponível + data
CREATE INDEX IF NOT EXISTS idx_produtos_estoque_created_at ON produtos(estoque, created_at DESC) WHERE estoque > 0;

-- Pronto! Agora podemos ordenar por data de criacao real e filtrar novos dos ultimos 7 dias