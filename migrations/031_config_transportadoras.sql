-- Migration 031: Configuração de Serviços de Frete
-- Permite ativar/desativar SERVIÇOS (PAC, SEDEX, Jadlog Package, etc) e adicionar taxa de embalagem

-- Tabela de configuração por SERVIÇO (não company!)
CREATE TABLE IF NOT EXISTS config_servicos_frete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id INTEGER NOT NULL UNIQUE, -- ID do serviço no Melhor Envio
  servico_nome TEXT NOT NULL, -- Nome (PAC, SEDEX, Jadlog .Package, etc)
  company_id INTEGER NOT NULL, -- ID da transportadora
  company_name TEXT NOT NULL, -- Nome da transportadora (Correios, Jadlog)
  ativo BOOLEAN DEFAULT true, -- Se está ativo no site
  taxa_adicional DECIMAL(10,2) DEFAULT 0.00, -- Taxa extra específica deste serviço
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Configuração geral de frete
CREATE TABLE IF NOT EXISTS config_frete_geral (
  id INTEGER PRIMARY KEY DEFAULT 1,
  taxa_embalagem DECIMAL(10,2) DEFAULT 0.00, -- Taxa global de embalagem
  frete_gratis_acima DECIMAL(10,2) DEFAULT NULL, -- Frete grátis acima de X reais
  prazo_adicional INTEGER DEFAULT 0, -- Dias extras no prazo
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Inserir configuração padrão
INSERT INTO config_frete_geral (id, taxa_embalagem, frete_gratis_acima, prazo_adicional)
VALUES (1, 0.00, NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- Índices
CREATE INDEX IF NOT EXISTS idx_config_servicos_ativo ON config_servicos_frete(ativo);
CREATE INDEX IF NOT EXISTS idx_config_servicos_servico_id ON config_servicos_frete(servico_id);
CREATE INDEX IF NOT EXISTS idx_config_servicos_company_id ON config_servicos_frete(company_id);

-- Comentários
COMMENT ON TABLE config_servicos_frete IS 'Configuração individual de cada SERVIÇO de frete (PAC, SEDEX, etc)';
COMMENT ON TABLE config_frete_geral IS 'Configuração geral de frete (taxa embalagem, frete grátis, etc)';
COMMENT ON COLUMN config_servicos_frete.ativo IS 'Se true, aparece no site para clientes';
COMMENT ON COLUMN config_servicos_frete.taxa_adicional IS 'Taxa adicional específica deste serviço';
COMMENT ON COLUMN config_frete_geral.taxa_embalagem IS 'Taxa global adicionada a TODOS os fretes';
COMMENT ON COLUMN config_frete_geral.frete_gratis_acima IS 'Se compra >= este valor, frete grátis';
