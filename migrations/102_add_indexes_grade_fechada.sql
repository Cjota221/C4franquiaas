-- Migration 102: Adicionar índices para otimização de performance do sistema Grade Fechada
-- Data: 2026-01-14
-- Descrição: Índices para melhorar performance das queries mais comuns

-- ============================================
-- ÍNDICES PARA grade_fechada_produtos
-- ============================================

-- Índice para busca por status ativo (usado no catálogo público)
CREATE INDEX IF NOT EXISTS idx_grade_fechada_produtos_ativo 
ON grade_fechada_produtos(ativo)
WHERE ativo = true;

-- Índice para ordenação (usado em listagens)
CREATE INDEX IF NOT EXISTS idx_grade_fechada_produtos_ordem 
ON grade_fechada_produtos(ordem, nome);

-- Índice para busca por código interno (usado em buscas admin)
CREATE INDEX IF NOT EXISTS idx_grade_fechada_produtos_codigo 
ON grade_fechada_produtos(codigo_interno)
WHERE codigo_interno IS NOT NULL;

-- Índice composto para queries do catálogo público (ativo + ordem)
CREATE INDEX IF NOT EXISTS idx_grade_fechada_produtos_catalogo 
ON grade_fechada_produtos(ativo, ordem, nome)
WHERE ativo = true;


-- ============================================
-- ÍNDICES PARA grade_fechada_pedidos
-- ============================================

-- Índice para busca por status (queries mais comuns)
CREATE INDEX IF NOT EXISTS idx_grade_fechada_pedidos_status 
ON grade_fechada_pedidos(status);

-- Índice para ordenação por data (usado em dashboard)
CREATE INDEX IF NOT EXISTS idx_grade_fechada_pedidos_data 
ON grade_fechada_pedidos(criado_em DESC);

-- Índice composto para relatórios por status e data
CREATE INDEX IF NOT EXISTS idx_grade_fechada_pedidos_status_data 
ON grade_fechada_pedidos(status, criado_em DESC);

-- Índice para busca por número do pedido
CREATE INDEX IF NOT EXISTS idx_grade_fechada_pedidos_numero 
ON grade_fechada_pedidos(numero_pedido);

-- Índice para busca por nome do cliente (usado em filtros)
CREATE INDEX IF NOT EXISTS idx_grade_fechada_pedidos_cliente 
ON grade_fechada_pedidos(cliente_nome);

-- Índice para busca por telefone (usado em busca rápida)
CREATE INDEX IF NOT EXISTS idx_grade_fechada_pedidos_telefone 
ON grade_fechada_pedidos(cliente_telefone);

-- Índice GIN para busca full-text em observações
CREATE INDEX IF NOT EXISTS idx_grade_fechada_pedidos_observacoes_gin 
ON grade_fechada_pedidos USING GIN (to_tsvector('portuguese', observacoes))
WHERE observacoes IS NOT NULL;


-- ============================================
-- ÍNDICES PARA grade_fechada_carrinhos
-- ============================================

-- Índice para busca por status (carrinhos ativos vs abandonados)
CREATE INDEX IF NOT EXISTS idx_grade_fechada_carrinhos_status 
ON grade_fechada_carrinhos(status);

-- Índice para ordenação por última modificação
CREATE INDEX IF NOT EXISTS idx_grade_fechada_carrinhos_updated 
ON grade_fechada_carrinhos(atualizado_em DESC);

-- Índice composto para carrinhos abandonados (relatórios)
CREATE INDEX IF NOT EXISTS idx_grade_fechada_carrinhos_abandonados 
ON grade_fechada_carrinhos(status, atualizado_em DESC)
WHERE status = 'abandonado';

-- Índice para busca por session_id (recuperação de carrinho)
CREATE INDEX IF NOT EXISTS idx_grade_fechada_carrinhos_session 
ON grade_fechada_carrinhos(session_id)
WHERE session_id IS NOT NULL;


-- ============================================
-- ÍNDICES PARA JSONB (Numerações)
-- ============================================

-- Índice GIN para queries em numeracoes JSONB (grade_fechada_pedidos.itens)
-- Permite buscar pedidos que contenham numerações específicas
CREATE INDEX IF NOT EXISTS idx_grade_fechada_pedidos_itens_gin 
ON grade_fechada_pedidos USING GIN (itens);

-- Índice GIN para queries em itens JSONB (grade_fechada_carrinhos)
CREATE INDEX IF NOT EXISTS idx_grade_fechada_carrinhos_itens_gin 
ON grade_fechada_carrinhos USING GIN (itens);


-- ============================================
-- ANÁLISE E ESTATÍSTICAS
-- ============================================

-- Atualizar estatísticas para o otimizador de queries
ANALYZE grade_fechada_produtos;
ANALYZE grade_fechada_pedidos;
ANALYZE grade_fechada_carrinhos;
ANALYZE grade_fechada_configuracoes;


-- ============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON INDEX idx_grade_fechada_produtos_ativo IS 'Otimiza query de produtos ativos no catálogo público';
COMMENT ON INDEX idx_grade_fechada_produtos_ordem IS 'Otimiza ordenação de produtos por ordem + nome';
COMMENT ON INDEX idx_grade_fechada_produtos_catalogo IS 'Índice composto para performance do catálogo público';

COMMENT ON INDEX idx_grade_fechada_pedidos_status IS 'Otimiza filtragem de pedidos por status';
COMMENT ON INDEX idx_grade_fechada_pedidos_data IS 'Otimiza ordenação de pedidos por data de criação';
COMMENT ON INDEX idx_grade_fechada_pedidos_numero IS 'Otimiza busca rápida por número do pedido';

COMMENT ON INDEX idx_grade_fechada_carrinhos_status IS 'Otimiza queries de carrinhos por status';
COMMENT ON INDEX idx_grade_fechada_carrinhos_abandonados IS 'Otimiza relatório de carrinhos abandonados';


-- ============================================
-- VERIFICAÇÃO DOS ÍNDICES CRIADOS
-- ============================================

-- Para verificar os índices criados, execute:
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename LIKE 'grade_fechada_%'
-- ORDER BY tablename, indexname;
