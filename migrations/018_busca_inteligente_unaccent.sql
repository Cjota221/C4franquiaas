-- ============================================================================
-- MIGRATION 018: Busca Inteligente com Insensibilidade a Acentos
-- ============================================================================
-- Ativa a extensão unaccent do PostgreSQL e cria função otimizada de busca
-- ============================================================================

BEGIN;

-- Ativa a extensão unaccent (remove acentos para comparação)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================================
-- FUNÇÃO: search_produtos_unaccent
-- ============================================================================
-- Busca produtos de forma inteligente, ignorando acentos
-- Exemplo: busca por "calcado" encontra "Calçado"
-- ============================================================================

CREATE OR REPLACE FUNCTION search_produtos_unaccent(search_term TEXT, result_limit INTEGER DEFAULT 15)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  preco_base NUMERIC,
  preco_venda NUMERIC,
  imagem TEXT,
  imagens TEXT[],
  codigo_barras TEXT,
  categoria_id UUID,
  categoria_nome TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nome,
    p.preco_base,
    p.preco_venda,
    p.imagem,
    p.imagens,
    p.codigo_barras,
    p.categoria_id,
    c.nome AS categoria_nome
  FROM produtos p
  LEFT JOIN categorias c ON p.categoria_id = c.id
  WHERE 
    p.ativo = true
    AND (
      -- Busca insensível a acentos no nome
      unaccent(LOWER(p.nome)) ILIKE unaccent(LOWER('%' || search_term || '%'))
      -- Busca exata no código de barras
      OR p.codigo_barras ILIKE '%' || search_term || '%'
    )
  ORDER BY 
    -- Prioriza matches exatos no início do nome
    CASE 
      WHEN unaccent(LOWER(p.nome)) LIKE unaccent(LOWER(search_term || '%')) THEN 1
      WHEN unaccent(LOWER(p.nome)) LIKE unaccent(LOWER('%' || search_term || '%')) THEN 2
      ELSE 3
    END,
    p.nome ASC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Comentário descritivo
COMMENT ON FUNCTION search_produtos_unaccent IS 
  'Busca produtos ignorando acentos, priorizando matches no início do nome. ' ||
  'Exemplo: search_produtos_unaccent(''calcado'', 15) encontra "Calçado Social"';

COMMIT;

-- ✅ Migration 018 concluída
-- Próximos passos:
-- 1. Aplicar esta migration no Supabase SQL Editor
-- 2. Atualizar API /api/loja/[dominio]/search/route.ts para usar a função:
--    const { data } = await supabase.rpc('search_produtos_unaccent', { 
--      search_term: query, 
--      result_limit: 15 
--    });
