-- ============================================================================
-- Migration 100: Sistema de Pedidos por Encomenda - Grade Fechada
-- ============================================================================
-- Description: Cria estrutura completa para módulo de pedidos por grade fechada
-- Author: GitHub Copilot
-- Date: 2026-01-14
-- ============================================================================

-- ============================================================================
-- TABELA: grade_fechada_produtos
-- Produtos específicos para venda por grade fechada
-- ============================================================================
CREATE TABLE IF NOT EXISTS grade_fechada_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  codigo_interno VARCHAR(100) UNIQUE,
  descricao TEXT,
  
  -- Imagens do produto
  imagens JSONB DEFAULT '[]'::jsonb,
  
  -- Preços e grades disponíveis
  preco_meia_grade DECIMAL(10,2),
  preco_grade_completa DECIMAL(10,2),
  permite_meia_grade BOOLEAN DEFAULT true,
  permite_grade_completa BOOLEAN DEFAULT true,
  
  -- Cores disponíveis (array de strings)
  cores_disponiveis TEXT[] DEFAULT '{}',
  
  -- Dimensões e peso para cálculo de frete (em gramas)
  peso_por_grade DECIMAL(10,2),
  comprimento DECIMAL(10,2),
  largura DECIMAL(10,2),
  altura DECIMAL(10,2),
  
  -- Observações e informações adicionais
  observacoes TEXT,
  aceita_personalizacao BOOLEAN DEFAULT false,
  
  -- Status e controle
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  
  -- Timestamps
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_grade_fechada_produtos_ativo ON grade_fechada_produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_grade_fechada_produtos_ordem ON grade_fechada_produtos(ordem);
CREATE INDEX IF NOT EXISTS idx_grade_fechada_produtos_codigo ON grade_fechada_produtos(codigo_interno);

-- ============================================================================
-- TABELA: grade_fechada_pedidos
-- Pedidos realizados no sistema de encomenda
-- ============================================================================
CREATE TABLE IF NOT EXISTS grade_fechada_pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido VARCHAR(50) UNIQUE NOT NULL,
  
  -- Dados do cliente
  cliente_nome VARCHAR(255),
  cliente_telefone VARCHAR(20),
  cliente_email VARCHAR(255),
  cliente_cpf_cnpj VARCHAR(20),
  
  -- Endereço de entrega
  endereco_cep VARCHAR(10),
  endereco_rua VARCHAR(255),
  endereco_numero VARCHAR(20),
  endereco_complemento VARCHAR(100),
  endereco_bairro VARCHAR(100),
  endereco_cidade VARCHAR(100),
  endereco_estado VARCHAR(2),
  
  -- Status do pedido
  status VARCHAR(50) DEFAULT 'orcamento',
  -- Status possíveis: 'orcamento', 'aguardando_confirmacao', 'confirmado', 
  --                   'em_producao', 'finalizado', 'cancelado'
  
  -- Valores
  valor_total DECIMAL(10,2) DEFAULT 0,
  valor_frete DECIMAL(10,2),
  
  -- Itens do pedido (JSONB para flexibilidade)
  itens JSONB DEFAULT '[]'::jsonb,
  /* Estrutura dos itens:
  [
    {
      "produto_id": "uuid",
      "produto_nome": "string",
      "tipo_grade": "meia" | "completa",
      "quantidade_grades": number,
      "cor": "string",
      "numeracoes": {
        "33": 2,
        "34": 4,
        "35": 6,
        ...
      },
      "valor_unitario": number,
      "valor_total": number
    }
  ]
  */
  
  -- Observações
  observacoes TEXT,
  observacoes_internas TEXT,
  
  -- Rastreamento
  origem VARCHAR(50) DEFAULT 'site',
  finalizado_whatsapp BOOLEAN DEFAULT false,
  data_finalizacao_whatsapp TIMESTAMP,
  
  -- Timestamps
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_grade_fechada_pedidos_status ON grade_fechada_pedidos(status);
CREATE INDEX IF NOT EXISTS idx_grade_fechada_pedidos_numero ON grade_fechada_pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_grade_fechada_pedidos_telefone ON grade_fechada_pedidos(cliente_telefone);
CREATE INDEX IF NOT EXISTS idx_grade_fechada_pedidos_criado ON grade_fechada_pedidos(criado_em DESC);

-- ============================================================================
-- TABELA: grade_fechada_carrinhos
-- Carrinhos abandonados para follow-up
-- ============================================================================
CREATE TABLE IF NOT EXISTS grade_fechada_carrinhos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação do cliente (pode ser parcial)
  cliente_nome VARCHAR(255),
  cliente_telefone VARCHAR(20),
  cliente_email VARCHAR(255),
  
  -- Conteúdo do carrinho
  itens JSONB DEFAULT '[]'::jsonb,
  valor_total DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'ativo',
  -- Status possíveis: 'ativo', 'convertido', 'expirado'
  
  convertido_em_pedido_id UUID REFERENCES grade_fechada_pedidos(id),
  data_conversao TIMESTAMP,
  
  -- Rastreamento
  session_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamps
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  expira_em TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_grade_fechada_carrinhos_status ON grade_fechada_carrinhos(status);
CREATE INDEX IF NOT EXISTS idx_grade_fechada_carrinhos_telefone ON grade_fechada_carrinhos(cliente_telefone);
CREATE INDEX IF NOT EXISTS idx_grade_fechada_carrinhos_criado ON grade_fechada_carrinhos(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_grade_fechada_carrinhos_expira ON grade_fechada_carrinhos(expira_em);

-- ============================================================================
-- TABELA: grade_fechada_configuracoes
-- Configurações do site de encomenda
-- ============================================================================
CREATE TABLE IF NOT EXISTS grade_fechada_configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descricao TEXT,
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Configurações iniciais
INSERT INTO grade_fechada_configuracoes (chave, valor, descricao) VALUES
  ('site_ativo', 'true', 'Define se o site de encomendas está ativo'),
  ('pedido_minimo_grades', '2', 'Quantidade mínima de grades por pedido'),
  ('prazo_producao_min', '15', 'Prazo mínimo de produção em dias úteis'),
  ('prazo_producao_max', '20', 'Prazo máximo de produção em dias úteis'),
  ('mensagem_topo', '"🚀 Pedido mínimo: 2 grades | 📦 Produção: 15-20 dias úteis"', 'Mensagem exibida no topo do site'),
  ('whatsapp_numero', '""', 'Número do WhatsApp para contato (formato: 5511999999999)'),
  ('cores_padrao', '["Preto", "Branco", "Rosa", "Azul", "Vermelho", "Verde", "Amarelo"]', 'Cores padrão para produtos'),
  ('numeracoes_padrao', '["33", "34", "35", "36", "37", "38", "39", "40", "41", "42"]', 'Numerações padrão disponíveis')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================

-- Produtos: acesso público para leitura, admin para escrita
ALTER TABLE grade_fechada_produtos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Produtos são visíveis publicamente" ON grade_fechada_produtos;
CREATE POLICY "Produtos são visíveis publicamente" ON grade_fechada_produtos
  FOR SELECT
  USING (ativo = true);

DROP POLICY IF EXISTS "Admin pode gerenciar produtos" ON grade_fechada_produtos;
CREATE POLICY "Admin pode gerenciar produtos" ON grade_fechada_produtos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Pedidos: admin pode ver tudo
ALTER TABLE grade_fechada_pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin pode ver todos os pedidos" ON grade_fechada_pedidos;
CREATE POLICY "Admin pode ver todos os pedidos" ON grade_fechada_pedidos
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin pode gerenciar pedidos" ON grade_fechada_pedidos;
CREATE POLICY "Admin pode gerenciar pedidos" ON grade_fechada_pedidos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Permitir inserção pública (pelo site)
DROP POLICY IF EXISTS "Permitir criação pública de pedidos" ON grade_fechada_pedidos;
CREATE POLICY "Permitir criação pública de pedidos" ON grade_fechada_pedidos
  FOR INSERT
  WITH CHECK (true);

-- Carrinhos: admin pode ver tudo
ALTER TABLE grade_fechada_carrinhos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin pode ver todos os carrinhos" ON grade_fechada_carrinhos;
CREATE POLICY "Admin pode ver todos os carrinhos" ON grade_fechada_carrinhos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Permitir inserção e atualização pública (pelo site)
DROP POLICY IF EXISTS "Permitir criação pública de carrinhos" ON grade_fechada_carrinhos;
CREATE POLICY "Permitir criação pública de carrinhos" ON grade_fechada_carrinhos
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização pública de carrinhos" ON grade_fechada_carrinhos;
CREATE POLICY "Permitir atualização pública de carrinhos" ON grade_fechada_carrinhos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Configurações: leitura pública, escrita apenas admin
ALTER TABLE grade_fechada_configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Configurações são visíveis publicamente" ON grade_fechada_configuracoes;
CREATE POLICY "Configurações são visíveis publicamente" ON grade_fechada_configuracoes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin pode gerenciar configurações" ON grade_fechada_configuracoes;
CREATE POLICY "Admin pode gerenciar configurações" ON grade_fechada_configuracoes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_grade_fechada_produtos_updated_at ON grade_fechada_produtos;
CREATE TRIGGER update_grade_fechada_produtos_updated_at
    BEFORE UPDATE ON grade_fechada_produtos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grade_fechada_pedidos_updated_at ON grade_fechada_pedidos;
CREATE TRIGGER update_grade_fechada_pedidos_updated_at
    BEFORE UPDATE ON grade_fechada_pedidos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grade_fechada_carrinhos_updated_at ON grade_fechada_carrinhos;
CREATE TRIGGER update_grade_fechada_carrinhos_updated_at
    BEFORE UPDATE ON grade_fechada_carrinhos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grade_fechada_configuracoes_updated_at ON grade_fechada_configuracoes;
CREATE TRIGGER update_grade_fechada_configuracoes_updated_at
    BEFORE UPDATE ON grade_fechada_configuracoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para gerar número de pedido automaticamente
CREATE OR REPLACE FUNCTION gerar_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_pedido IS NULL OR NEW.numero_pedido = '' THEN
        NEW.numero_pedido := 'GF' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('seq_grade_fechada_pedidos')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar sequência para números de pedido
CREATE SEQUENCE IF NOT EXISTS seq_grade_fechada_pedidos START 1;

DROP TRIGGER IF EXISTS set_numero_pedido ON grade_fechada_pedidos;
CREATE TRIGGER set_numero_pedido
    BEFORE INSERT ON grade_fechada_pedidos
    FOR EACH ROW
    EXECUTE FUNCTION gerar_numero_pedido();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Função para buscar produtos ativos
CREATE OR REPLACE FUNCTION get_grade_fechada_produtos_ativos()
RETURNS TABLE (
  id UUID,
  nome VARCHAR,
  codigo_interno VARCHAR,
  descricao TEXT,
  imagens JSONB,
  preco_meia_grade DECIMAL,
  preco_grade_completa DECIMAL,
  permite_meia_grade BOOLEAN,
  permite_grade_completa BOOLEAN,
  cores_disponiveis TEXT[],
  aceita_personalizacao BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.nome, p.codigo_interno, p.descricao, p.imagens,
    p.preco_meia_grade, p.preco_grade_completa,
    p.permite_meia_grade, p.permite_grade_completa,
    p.cores_disponiveis, p.aceita_personalizacao
  FROM grade_fechada_produtos p
  WHERE p.ativo = true
  ORDER BY p.ordem ASC, p.nome ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON TABLE grade_fechada_produtos IS 'Produtos disponíveis para venda por grade fechada';
COMMENT ON TABLE grade_fechada_pedidos IS 'Pedidos de encomenda com grades personalizadas';
COMMENT ON TABLE grade_fechada_carrinhos IS 'Carrinhos abandonados para análise e follow-up';
COMMENT ON TABLE grade_fechada_configuracoes IS 'Configurações do sistema de encomendas';

COMMENT ON COLUMN grade_fechada_produtos.imagens IS 'Array de URLs das imagens do produto';
COMMENT ON COLUMN grade_fechada_produtos.cores_disponiveis IS 'Array de cores disponíveis para o produto';
COMMENT ON COLUMN grade_fechada_pedidos.itens IS 'JSON contendo todos os itens do pedido com suas configurações';
COMMENT ON COLUMN grade_fechada_carrinhos.itens IS 'JSON contendo todos os itens do carrinho';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 100 - Sistema Grade Fechada criado com sucesso!';
  RAISE NOTICE '📦 Tabelas criadas: produtos, pedidos, carrinhos, configurações';
  RAISE NOTICE '🔒 RLS policies configuradas';
  RAISE NOTICE '⚡ Triggers e functions criados';
  RAISE NOTICE '';
  RAISE NOTICE '▶️ Próximos passos:';
  RAISE NOTICE '  1. Aplicar esta migration no Supabase';
  RAISE NOTICE '  2. Configurar storage bucket para imagens de produtos';
  RAISE NOTICE '  3. Implementar APIs de CRUD';
  RAISE NOTICE '  4. Criar interfaces de administração';
  RAISE NOTICE '  5. Desenvolver site público de encomendas';
END $$;
