-- Migration 031: Configuração de Transportadoras
-- Permite ativar/desativar transportadoras e adicionar taxa de embalagem

-- Tabela de configuração por transportadora
CREATE TABLE IF NOT EXISTS config_transportadoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id INTEGER NOT NULL UNIQUE, -- ID da transportadora no Melhor Envio
  company_name TEXT NOT NULL, -- Nome (Correios, Jadlog, etc)
  ativo BOOLEAN DEFAULT true, -- Se está ativa no site
  taxa_adicional DECIMAL(10,2) DEFAULT 0.00, -- Taxa extra (embalagem)
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
CREATE INDEX IF NOT EXISTS idx_config_transportadoras_ativo ON config_transportadoras(ativo);
CREATE INDEX IF NOT EXISTS idx_config_transportadoras_company_id ON config_transportadoras(company_id);

-- Comentários
COMMENT ON TABLE config_transportadoras IS 'Configuração individual de cada transportadora';
COMMENT ON TABLE config_frete_geral IS 'Configuração geral de frete (taxa embalagem, frete grátis, etc)';
COMMENT ON COLUMN config_transportadoras.ativo IS 'Se true, aparece no site para clientes';
COMMENT ON COLUMN config_transportadoras.taxa_adicional IS 'Taxa adicional específica desta transportadora';
COMMENT ON COLUMN config_frete_geral.taxa_embalagem IS 'Taxa global adicionada a TODOS os fretes';
COMMENT ON COLUMN config_frete_geral.frete_gratis_acima IS 'Se compra >= este valor, frete grátis';
