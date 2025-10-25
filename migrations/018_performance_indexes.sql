-- ============================================================================
-- MIGRATION 018: Índices de Performance
-- ============================================================================
-- Adiciona índices críticos para otimização de buscas
-- IMPACTO ESPERADO: Redução de 80-95% no tempo de resposta das queries
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABELA: produtos
-- ============================================================================

-- Índice para busca parcial por nome (usando pg_trgm para ILIKE otimizado)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_produtos_nome_trgm ON produtos USING gin(nome gin_trgm_ops);

-- Índice para busca exata por código de barras
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON produtos(codigo_barras) 
WHERE codigo_barras IS NOT NULL;

-- Índice para filtro de produtos ativos
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo) WHERE ativo = true;

-- Índice para categoria (se usado em filtros)
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id ON produtos(categoria_id) 
WHERE categoria_id IS NOT NULL;

-- Índice composto para ordenação comum (ativo + nome)
CREATE INDEX IF NOT EXISTS idx_produtos_ativo_nome ON produtos(ativo, nome) 
WHERE ativo = true;

COMMENT ON INDEX idx_produtos_nome_trgm IS 'Índice trigram para busca rápida com ILIKE - otimiza pesquisas parciais';
COMMENT ON INDEX idx_produtos_codigo_barras IS 'Índice para busca por código de barras';
COMMENT ON INDEX idx_produtos_ativo IS 'Índice parcial para filtro de produtos ativos';
COMMENT ON INDEX idx_produtos_ativo_nome IS 'Índice composto para listagem ordenada de produtos ativos';

-- ============================================================================
-- TABELA: lojas
-- ============================================================================

-- Índice ÚNICO para busca por domínio (usado em TODA requisição da loja)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lojas_dominio ON lojas(dominio) 
WHERE ativo = true;

-- Índice para busca por franqueada
CREATE INDEX IF NOT EXISTS idx_lojas_franqueada_id ON lojas(franqueada_id);

COMMENT ON INDEX idx_lojas_dominio IS 'Índice único para busca rápida por domínio - CRÍTICO para performance';
COMMENT ON INDEX idx_lojas_franqueada_id IS 'Índice FK para relacionamento com franqueadas';

-- ============================================================================
-- TABELA: produtos_franqueadas (JOIN crítico)
-- ============================================================================

-- Índices para FKs usadas em JOINs
CREATE INDEX IF NOT EXISTS idx_produtos_franqueadas_produto_id 
ON produtos_franqueadas(produto_id);

CREATE INDEX IF NOT EXISTS idx_produtos_franqueadas_franqueada_id 
ON produtos_franqueadas(franqueada_id);

-- Índice composto para filtro comum (franqueada + ativo)
CREATE INDEX IF NOT EXISTS idx_produtos_franqueadas_franqueada_ativo 
ON produtos_franqueadas(franqueada_id, ativo) WHERE ativo = true;

COMMENT ON INDEX idx_produtos_franqueadas_produto_id IS 'Índice FK para JOIN com produtos';
COMMENT ON INDEX idx_produtos_franqueadas_franqueada_id IS 'Índice FK para filtro por franqueada';
COMMENT ON INDEX idx_produtos_franqueadas_franqueada_ativo IS 'Índice composto para listagem de produtos ativos por franqueada';

-- ============================================================================
-- TABELA: produtos_franqueadas_precos
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_produtos_franqueadas_precos_produto_franqueada_id 
ON produtos_franqueadas_precos(produto_franqueada_id);

COMMENT ON INDEX idx_produtos_franqueadas_precos_produto_franqueada_id IS 'Índice FK para JOIN com produtos_franqueadas';

-- ============================================================================
-- TABELA: categorias
-- ============================================================================

-- Índice para hierarquia de categorias
CREATE INDEX IF NOT EXISTS idx_categorias_pai_id ON categorias(pai_id) 
WHERE pai_id IS NOT NULL;

-- Índice para busca por nome (usado em autocomplete)
CREATE INDEX IF NOT EXISTS idx_categorias_nome ON categorias(nome);

COMMENT ON INDEX idx_categorias_pai_id IS 'Índice para navegação em hierarquia de categorias';
COMMENT ON INDEX idx_categorias_nome IS 'Índice para busca e ordenação por nome de categoria';

-- ============================================================================
-- TABELA: produto_categorias (junção)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_produto_categorias_produto_id 
ON produto_categorias(produto_id);

CREATE INDEX IF NOT EXISTS idx_produto_categorias_categoria_id 
ON produto_categorias(categoria_id);

-- Índice composto para queries bidirecionais
CREATE INDEX IF NOT EXISTS idx_produto_categorias_categoria_produto 
ON produto_categorias(categoria_id, produto_id);

COMMENT ON INDEX idx_produto_categorias_produto_id IS 'Índice para buscar categorias de um produto';
COMMENT ON INDEX idx_produto_categorias_categoria_id IS 'Índice para buscar produtos de uma categoria';
COMMENT ON INDEX idx_produto_categorias_categoria_produto IS 'Índice composto para queries bidirecionais';

COMMIT;

-- ============================================================================
-- ANÁLISE DE PERFORMANCE
-- ============================================================================
-- Para verificar uso dos índices, execute:
-- EXPLAIN ANALYZE SELECT * FROM produtos WHERE nome ILIKE '%batom%' AND ativo = true;
--
-- Exemplo de resultado esperado:
-- ANTES:  Seq Scan on produtos  (cost=0.00..1547.00 rows=100) (actual time=2850.123..2850.456)
-- DEPOIS: Bitmap Index Scan using idx_produtos_nome_trgm  (cost=0.00..15.25 rows=100) (actual time=12.456..12.789)
--
-- Para verificar tamanho dos índices:
-- SELECT 
--   schemaname, 
--   tablename, 
--   indexname, 
--   pg_size_pretty(pg_relation_size(indexrelid)) AS size
-- FROM pg_stat_user_indexes
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- ✅ Migration 018 concluída
-- Próximos passos:
-- 1. Verificar uso dos índices com EXPLAIN ANALYZE
-- 2. Monitorar tempo de resposta das queries principais
-- 3. Considerar VACUUM ANALYZE para atualizar estatísticas
