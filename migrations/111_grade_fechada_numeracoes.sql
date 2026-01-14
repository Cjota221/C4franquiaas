-- ============================================================================
-- Migration 111: Sistema de Numerações e Grades
-- ============================================================================
-- Description: Adiciona suporte completo para grades de 12 pares com numerações
-- Author: GitHub Copilot
-- Date: 2026-01-14
-- ============================================================================

-- ============================================================================
-- TABELA: grade_fechada_numeracoes
-- Lista de numerações disponíveis para os produtos
-- ============================================================================
CREATE TABLE IF NOT EXISTS grade_fechada_numeracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(10) NOT NULL UNIQUE, -- 33, 34, 35, 36, 37, 38, 39, 40, 41, 42
  ordem INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_numeracoes_ordem ON grade_fechada_numeracoes(ordem);
CREATE INDEX IF NOT EXISTS idx_numeracoes_ativo ON grade_fechada_numeracoes(ativo);

-- ============================================================================
-- TABELA: grade_fechada_pedidos
-- Pedidos feitos pelos clientes
-- ============================================================================
CREATE TABLE IF NOT EXISTS grade_fechada_pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(50) UNIQUE NOT NULL, -- GF-2024-0001
  
  -- Cliente
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_email VARCHAR(255),
  cliente_telefone VARCHAR(20),
  cliente_cpf VARCHAR(14),
  cliente_endereco JSONB, -- { logradouro, numero, complemento, bairro, cidade, estado, cep }
  
  -- Totais
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  frete DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, confirmado, producao, enviado, entregue, cancelado
  
  -- Pagamento
  forma_pagamento VARCHAR(50), -- pix, boleto, cartao, dinheiro
  status_pagamento VARCHAR(50) DEFAULT 'pendente', -- pendente, pago, cancelado
  
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON grade_fechada_pedidos(numero);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON grade_fechada_pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado_em ON grade_fechada_pedidos(criado_em);

-- ============================================================================
-- TABELA: grade_fechada_pedido_itens
-- Itens dos pedidos (cada item = 1 grade de 12 pares)
-- ============================================================================
CREATE TABLE IF NOT EXISTS grade_fechada_pedido_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES grade_fechada_pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES grade_fechada_produtos(id),
  
  -- Tipo de grade
  tipo_grade VARCHAR(20) NOT NULL, -- 'completa' ou 'meia'
  quantidade_grades INTEGER NOT NULL DEFAULT 1, -- quantas grades deste item
  
  -- Preços
  preco_unitario DECIMAL(10,2) NOT NULL, -- preço por grade de 12 pares
  subtotal DECIMAL(10,2) NOT NULL,
  
  -- Timestamps
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_tipo_grade CHECK (tipo_grade IN ('completa', 'meia'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido_id ON grade_fechada_pedido_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_produto_id ON grade_fechada_pedido_itens(produto_id);

-- ============================================================================
-- TABELA: grade_fechada_pedido_item_cores
-- Cores escolhidas para cada item (1 ou 2 cores dependendo do tipo_grade)
-- ============================================================================
CREATE TABLE IF NOT EXISTS grade_fechada_pedido_item_cores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES grade_fechada_pedido_itens(id) ON DELETE CASCADE,
  variacao_id UUID NOT NULL REFERENCES grade_fechada_variacoes(id),
  
  -- Quantidade de pares desta cor
  quantidade_pares INTEGER NOT NULL, -- 6 ou 12 dependendo se é meia ou completa
  
  -- Timestamps
  criado_em TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_quantidade_pares CHECK (quantidade_pares IN (6, 12))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_item_cores_item_id ON grade_fechada_pedido_item_cores(item_id);
CREATE INDEX IF NOT EXISTS idx_item_cores_variacao_id ON grade_fechada_pedido_item_cores(variacao_id);

-- ============================================================================
-- TABELA: grade_fechada_pedido_item_numeracoes
-- Numerações escolhidas para cada cor
-- ============================================================================
CREATE TABLE IF NOT EXISTS grade_fechada_pedido_item_numeracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_cor_id UUID NOT NULL REFERENCES grade_fechada_pedido_item_cores(id) ON DELETE CASCADE,
  numeracao_id UUID NOT NULL REFERENCES grade_fechada_numeracoes(id),
  
  -- Quantidade de pares desta numeração
  quantidade INTEGER NOT NULL DEFAULT 1,
  
  -- Timestamps
  criado_em TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_quantidade_positiva CHECK (quantidade > 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_item_numeracoes_item_cor_id ON grade_fechada_pedido_item_numeracoes(item_cor_id);
CREATE INDEX IF NOT EXISTS idx_item_numeracoes_numeracao_id ON grade_fechada_pedido_item_numeracoes(numeracao_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE grade_fechada_numeracoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE grade_fechada_pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE grade_fechada_pedido_itens DISABLE ROW LEVEL SECURITY;
ALTER TABLE grade_fechada_pedido_item_cores DISABLE ROW LEVEL SECURITY;
ALTER TABLE grade_fechada_pedido_item_numeracoes DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FUNCTIONS E TRIGGERS
-- ============================================================================

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_grade_fechada_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamps
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
CREATE OR REPLACE FUNCTION gerar_numero_pedido()
RETURNS TEXT AS $$
DECLARE
  novo_numero TEXT;
  contador INTEGER;
BEGIN
  -- Busca o último pedido do ano atual
  SELECT COUNT(*) + 1 INTO contador
  FROM grade_fechada_pedidos
  WHERE EXTRACT(YEAR FROM criado_em) = EXTRACT(YEAR FROM NOW());
  
  -- Gera o número no formato GF-2024-0001
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
  p.numero,
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
  RAISE NOTICE '✅ Migration 111 aplicada com sucesso!';
  RAISE NOTICE '📏 Tabela grade_fechada_numeracoes criada';
  RAISE NOTICE '📦 Sistema de pedidos completo criado';
  RAISE NOTICE '🎨 Tabelas: pedidos, itens, cores e numerações';
  RAISE NOTICE '🔢 10 numerações inseridas (33 a 42)';
  RAISE NOTICE '👁️ Views criadas: vw_grade_fechada_pedidos_resumo e vw_grade_fechada_pedidos_completo';
  RAISE NOTICE '⚙️ Função gerar_numero_pedido() criada';
END $$;
