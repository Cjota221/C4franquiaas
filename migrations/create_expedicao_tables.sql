-- =====================================================
-- MIGRAÇÃO: Módulo de Expedição Completo
-- Data: 02/11/2025
-- Descrição: Cria tabelas, views e triggers para gestão
--            completa de separação, expedição e rastreamento
-- =====================================================

-- 1. ADICIONAR COLUNAS NA TABELA PEDIDOS
-- =====================================================

ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS status_expedicao VARCHAR(50) DEFAULT ''pendente'',
ADD COLUMN IF NOT EXISTS data_separacao TIMESTAMP,
ADD COLUMN IF NOT EXISTS data_postagem TIMESTAMP,
ADD COLUMN IF NOT EXISTS data_entrega TIMESTAMP,
ADD COLUMN IF NOT EXISTS transportadora VARCHAR(100),
ADD COLUMN IF NOT EXISTS servico_entrega VARCHAR(100),
ADD COLUMN IF NOT EXISTS codigo_rastreio VARCHAR(100),
ADD COLUMN IF NOT EXISTS etiqueta_url TEXT,
ADD COLUMN IF NOT EXISTS peso_total DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS valor_frete DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS problema_descricao TEXT,
ADD COLUMN IF NOT EXISTS operador_separacao_id INTEGER,
ADD COLUMN IF NOT EXISTS tempo_separacao INTEGER;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_pedidos_status_expedicao ON pedidos(status_expedicao);
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo_rastreio ON pedidos(codigo_rastreio);
CREATE INDEX IF NOT EXISTS idx_pedidos_data_separacao ON pedidos(data_separacao);

-- 2. CRIAR TABELA DE ITENS DE EXPEDIÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS pedido_itens_expedicao (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    quantidade_conferida INTEGER NOT NULL DEFAULT 0,
    conferido BOOLEAN DEFAULT FALSE,
    conferido_em TIMESTAMP,
    conferido_por INTEGER,
    problema BOOLEAN DEFAULT FALSE,
    tipo_problema VARCHAR(50),
    observacao_problema TEXT,
    localizacao_estoque VARCHAR(100),
    codigo_barras VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_itens_expedicao_pedido ON pedido_itens_expedicao(pedido_id);
CREATE INDEX IF NOT EXISTS idx_itens_expedicao_produto ON pedido_itens_expedicao(produto_id);
CREATE INDEX IF NOT EXISTS idx_itens_expedicao_conferido ON pedido_itens_expedicao(conferido);

-- 3. CRIAR TABELA DE EVENTOS DE RASTREAMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS rastreamento_eventos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,
    codigo_rastreio VARCHAR(100) NOT NULL,
    tipo_evento VARCHAR(100) NOT NULL,
    descricao TEXT,
    data_evento TIMESTAMP NOT NULL,
    localizacao VARCHAR(200),
    transportadora VARCHAR(100),
    status_normalizado VARCHAR(50),
    recebido_via_webhook BOOLEAN DEFAULT FALSE,
    metadados JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rastreamento_pedido ON rastreamento_eventos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_rastreamento_codigo ON rastreamento_eventos(codigo_rastreio);

-- 4. CRIAR TABELA DE CONFIGURAÇÃO DE TRANSPORTADORAS
-- =====================================================

CREATE TABLE IF NOT EXISTS transportadoras_config (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    prioridade INTEGER DEFAULT 0,
    prazo_medio INTEGER,
    taxa_base DECIMAL(10,2),
    config_api JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. CRIAR TABELA DE LOGS DE EXPEDIÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS expedicao_logs (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,
    usuario_id INTEGER,
    acao VARCHAR(100) NOT NULL,
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50),
    descricao TEXT,
    metadados JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_pedido ON expedicao_logs(pedido_id);
CREATE INDEX IF NOT EXISTS idx_logs_data ON expedicao_logs(created_at DESC);

-- 6. CRIAR TABELA DE MÉTRICAS
-- =====================================================

CREATE TABLE IF NOT EXISTS expedicao_metricas (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    operador_id INTEGER,
    pedidos_separados INTEGER DEFAULT 0,
    tempo_medio_separacao INTEGER DEFAULT 0,
    itens_conferidos INTEGER DEFAULT 0,
    problemas_reportados INTEGER DEFAULT 0,
    pedidos_enviados INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(data, operador_id)
);

-- 7. POPULAR TRANSPORTADORAS
-- =====================================================

INSERT INTO transportadoras_config (nome, codigo, ativo, prioridade, prazo_medio) 
VALUES 
    (''Melhor Envio'', ''melhor_envio'', true, 1, 5),
    (''Correios PAC'', ''correios_pac'', true, 2, 12),
    (''Correios SEDEX'', ''correios_sedex'', true, 3, 5),
    (''Jadlog'', ''jadlog'', false, 4, 7)
ON CONFLICT (codigo) DO NOTHING;
