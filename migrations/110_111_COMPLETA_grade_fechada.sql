-- ============================================================================
-- Migration 110 + 111: Sistema Completo de Grade Fechada
-- ============================================================================
-- Description: Variações de produtos + Sistema de pedidos com numerações
-- Author: GitHub Copilot
-- Date: 2026-01-14
-- ============================================================================

-- ============================================================================
-- PARTE 1: VARIAÇÕES DE PRODUTOS (Migration 110)
-- ============================================================================

-- Tabela de variações
CREATE TABLE IF NOT EXISTS grade_fechada_variacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES grade_fechada_produtos(id) ON DELETE CASCADE,
  
  -- Identificação da variação
  cor VARCHAR(100) NOT NULL,
  imagem_url TEXT,
  
  -- Estoque específico desta variação
  estoque_disponivel INTEGER DEFAULT 0,
  
  -- Controle
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  
  -- Timestamps
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  
  -- Constraint para não ter cores duplicadas no mesmo produto
  UNIQUE(produto_id, cor)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_variacoes_produto_id ON grade_fechada_variacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_variacoes_ativo ON grade_fechada_variacoes(ativo);

-- Adiciona campos na tabela produtos
ALTER TABLE grade_fechada_produtos 
  ADD COLUMN IF NOT EXISTS preco_base DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS codigo VARCHAR(100),
  ADD COLUMN IF NOT EXISTS usa_variacoes BOOLEAN DEFAULT false;

-- RLS
ALTER TABLE grade_fechada_variacoes DISABLE ROW LEVEL SECURITY;

-- Trigger para timestamp
CREATE OR REPLACE FUNCTION update_grade_fechada_variacoes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_grade_fechada_variacoes_timestamp ON grade_fechada_variacoes;
CREATE TRIGGER update_grade_fechada_variacoes_timestamp
  BEFORE UPDATE ON grade_fechada_variacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_grade_fechada_variacoes_timestamp();

-- ============================================================================
-- PARTE 2: NUMERAÇÕES E PEDIDOS (Migration 111)
-- ============================================================================

-- Tabela de numerações
CREATE TABLE IF NOT EXISTS grade_fechada_numeracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(10) NOT NULL UNIQUE,
  ordem INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_numeracoes_ordem ON grade_fechada_numeracoes(ordem);
CREATE INDEX IF NOT EXISTS idx_numeracoes_ativo ON grade_fechada_numeracoes(ativo);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS grade_fechada_pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(50) UNIQUE,
  
  -- Cliente
  cliente_nome VARCHAR(255),
  cliente_email VARCHAR(255),
  cliente_telefone VARCHAR(20),
  cliente_cpf VARCHAR(14),
  cliente_endereco JSONB,
  
  -- Totais
  subtotal DECIMAL(10,2) DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  frete DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pendente',
  
  -- Pagamento
  forma_pagamento VARCHAR(50),
  status_pagamento VARCHAR(50) DEFAULT 'pendente',
  
  -- Observações
  observacoes TEXT,
  observacoes_internas TEXT,
  
  -- Timestamps
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  confirmado_em TIMESTAMP,
  enviado_em TIMESTAMP,
  entregue_em TIMESTAMP
);

-- Adicionar colunas se a tabela já existia
ALTER TABLE grade_fechada_pedidos 
  ADD COLUMN IF NOT EXISTS numero VARCHAR(50),
  ADD COLUMN IF NOT EXISTS cliente_nome VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cliente_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cliente_telefone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS cliente_cpf VARCHAR(14),
  ADD COLUMN IF NOT EXISTS cliente_endereco JSONB,
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frete DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(50),
  ADD COLUMN IF NOT EXISTS status_pagamento VARCHAR(50) DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS observacoes TEXT,
  ADD COLUMN IF NOT EXISTS observacoes_internas TEXT,
  ADD COLUMN IF NOT EXISTS confirmado_em TIMESTAMP,
  ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMP,
  ADD COLUMN IF NOT EXISTS entregue_em TIMESTAMP;

-- Criar índice único para numero (separado do ALTER TABLE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_numero_unique ON grade_fechada_pedidos(numero);

CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON grade_fechada_pedidos(numero);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON grade_fechada_pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado_em ON grade_fechada_pedidos(criado_em);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS grade_fechada_pedido_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES grade_fechada_pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES grade_fechada_produtos(id),
  
  tipo_grade VARCHAR(20) NOT NULL,
  quantidade_grades INTEGER NOT NULL DEFAULT 1,
  
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_tipo_grade CHECK (tipo_grade IN ('completa', 'meia'))
);

CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido_id ON grade_fechada_pedido_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_produto_id ON grade_fechada_pedido_itens(produto_id);

-- Tabela de cores do item
CREATE TABLE IF NOT EXISTS grade_fechada_pedido_item_cores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES grade_fechada_pedido_itens(id) ON DELETE CASCADE,
  variacao_id UUID NOT NULL REFERENCES grade_fechada_variacoes(id),
  
  quantidade_pares INTEGER NOT NULL,
  
  criado_em TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_quantidade_pares CHECK (quantidade_pares IN (6, 12))
);

CREATE INDEX IF NOT EXISTS idx_item_cores_item_id ON grade_fechada_pedido_item_cores(item_id);
CREATE INDEX IF NOT EXISTS idx_item_cores_variacao_id ON grade_fechada_pedido_item_cores(variacao_id);

-- Tabela de numerações do item
CREATE TABLE IF NOT EXISTS grade_fechada_pedido_item_numeracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_cor_id UUID NOT NULL REFERENCES grade_fechada_pedido_item_cores(id) ON DELETE CASCADE,
  numeracao_id UUID NOT NULL REFERENCES grade_fechada_numeracoes(id),
  
  quantidade INTEGER NOT NULL DEFAULT 1,
  
  criado_em TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_quantidade_positiva CHECK (quantidade > 0)
);

CREATE INDEX IF NOT EXISTS idx_item_numeracoes_item_cor_id ON grade_fechada_pedido_item_numeracoes(item_cor_id);
CREATE INDEX IF NOT EXISTS idx_item_numeracoes_numeracao_id ON grade_fechada_pedido_item_numeracoes(numeracao_id);

-- RLS
ALTER TABLE grade_fechada_numeracoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE grade_fechada_pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE grade_fechada_pedido_itens DISABLE ROW LEVEL SECURITY;
ALTER TABLE grade_fechada_pedido_item_cores DISABLE ROW LEVEL SECURITY;
ALTER TABLE grade_fechada_pedido_item_numeracoes DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FUNCTIONS E TRIGGERS
-- ============================================================================

-- Função genérica para timestamp
CREATE OR REPLACE FUNCTION update_grade_fechada_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_grade_fechada_numeracoes_timestamp ON grade_fechada_numeracoes;
CREATE TRIGGER update_grade_fechada_numeracoes_timestamp
  BEFORE UPDATE ON grade_fechada_numeracoes
  FOR EACH ROW
  EXECUTE FUNCTION update_grade_fechada_timestamp();

DROP TRIGGER IF EXISTS update_grade_fechada_pedidos_timestamp ON grade_fechada_pedidos;
CREATE TRIGGER update_grade_fechada_pedidos_timestamp
  BEFORE UPDATE ON grade_fechada_pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_grade_fechada_timestamp();

DROP TRIGGER IF EXISTS update_grade_fechada_pedido_itens_timestamp ON grade_fechada_pedido_itens;
CREATE TRIGGER update_grade_fechada_pedido_itens_timestamp
  BEFORE UPDATE ON grade_fechada_pedido_itens
  FOR EACH ROW
  EXECUTE FUNCTION update_grade_fechada_timestamp();

-- Função para gerar número do pedido
DROP TRIGGER IF EXISTS set_numero_pedido ON grade_fechada_pedidos;
DROP FUNCTION IF EXISTS gerar_numero_pedido() CASCADE;
CREATE FUNCTION gerar_numero_pedido()
RETURNS TEXT AS $$
DECLARE
  novo_numero TEXT;
  contador INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO contador
  FROM grade_fechada_pedidos
  WHERE EXTRACT(YEAR FROM criado_em) = EXTRACT(YEAR FROM NOW());
  
  novo_numero := 'GF-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(contador::TEXT, 4, '0');
  
  RETURN novo_numero;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA: Numerações padrão (33 a 42)
-- ============================================================================
INSERT INTO grade_fechada_numeracoes (numero, ordem, ativo) VALUES
  ('33', 1, true),
  ('34', 2, true),
  ('35', 3, true),
  ('36', 4, true),
  ('37', 5, true),
  ('38', 6, true),
  ('39', 7, true),
  ('40', 8, true),
  ('41', 9, true),
  ('42', 10, true)
ON CONFLICT (numero) DO NOTHING;

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View para listar pedidos com informações resumidas
CREATE OR REPLACE VIEW vw_grade_fechada_pedidos_resumo AS
SELECT 
  p.id,
  p.numero,
  p.cliente_nome,
  p.cliente_telefone,
  p.status,
  p.status_pagamento,
  p.total,
  p.criado_em,
  COUNT(DISTINCT pi.id) as total_itens,
  SUM(pi.quantidade_grades) as total_grades
FROM grade_fechada_pedidos p
LEFT JOIN grade_fechada_pedido_itens pi ON p.id = pi.pedido_id
GROUP BY p.id, p.numero, p.cliente_nome, p.cliente_telefone, p.status, p.status_pagamento, p.total, p.criado_em;

-- View para detalhes completos do pedido
CREATE OR REPLACE VIEW vw_grade_fechada_pedidos_completo AS
SELECT 
  p.id as pedido_id,
  p.numero as pedido_numero,
  p.cliente_nome,
  p.status,
  p.total,
  pi.id as item_id,
  prod.nome as produto_nome,
  prod.codigo as produto_codigo,
  pi.tipo_grade,
  pi.quantidade_grades,
  ic.id as item_cor_id,
  v.cor,
  v.imagem_url,
  ic.quantidade_pares,
  n.numero as numeracao,
  inum.quantidade as quantidade_numeracao
FROM grade_fechada_pedidos p
JOIN grade_fechada_pedido_itens pi ON p.id = pi.pedido_id
JOIN grade_fechada_produtos prod ON pi.produto_id = prod.id
JOIN grade_fechada_pedido_item_cores ic ON pi.id = ic.item_id
JOIN grade_fechada_variacoes v ON ic.variacao_id = v.id
JOIN grade_fechada_pedido_item_numeracoes inum ON ic.id = inum.item_cor_id
JOIN grade_fechada_numeracoes n ON inum.numeracao_id = n.id
ORDER BY p.criado_em DESC, pi.id, ic.id, n.ordem;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 110 + 111 aplicada com sucesso!';
  RAISE NOTICE '📦 Tabela grade_fechada_variacoes criada';
  RAISE NOTICE '📏 Tabela grade_fechada_numeracoes criada (10 números inseridos)';
  RAISE NOTICE '🛒 Sistema de pedidos completo criado';
  RAISE NOTICE '🎨 5 tabelas novas: variacoes, numeracoes, pedidos, itens, cores, numeracoes_item';
  RAISE NOTICE '👁️ 2 Views criadas para consultas';
  RAISE NOTICE '⚙️ Função gerar_numero_pedido() criada';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Próximos passos:';
  RAISE NOTICE '   1. Cadastrar produtos com variações';
  RAISE NOTICE '   2. Configurar loja pública';
  RAISE NOTICE '   3. Testar fluxo de pedidos';
END $$;
