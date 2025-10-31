-- ================================================
-- Migration 026: Configuração EnvioEcom
-- ================================================
-- Descrição: Adiciona colunas para integração com EnvioEcom
-- Autor: Sistema
-- Data: 2025-10-30
-- ================================================

-- 1. Adicionar colunas de rastreamento na tabela vendas
ALTER TABLE vendas
ADD COLUMN IF NOT EXISTS codigo_rastreio TEXT,
ADD COLUMN IF NOT EXISTS url_etiqueta TEXT,
ADD COLUMN IF NOT EXISTS servico_envioecom_id TEXT,
ADD COLUMN IF NOT EXISTS transportadora TEXT,
ADD COLUMN IF NOT EXISTS prazo_entrega_dias INTEGER;

-- 2. Comentários explicativos
COMMENT ON COLUMN vendas.codigo_rastreio IS 'Código de rastreio do EnvioEcom';
COMMENT ON COLUMN vendas.url_etiqueta IS 'URL do PDF da etiqueta de envio';
COMMENT ON COLUMN vendas.servico_envioecom_id IS 'ID do serviço de frete escolhido';
COMMENT ON COLUMN vendas.transportadora IS 'Nome da transportadora (Correios, Jadlog, etc)';
COMMENT ON COLUMN vendas.prazo_entrega_dias IS 'Prazo de entrega em dias úteis';

-- 3. Criar tabela de configuração EnvioEcom
CREATE TABLE IF NOT EXISTS config_envioecom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  etoken TEXT NOT NULL,
  
  -- Endereço de origem (remetente) como JSONB
  endereco_origem JSONB NOT NULL DEFAULT '{
    "nome": "",
    "telefone": "",
    "email": "",
    "documento": "",
    "endereco": "",
    "numero": "",
    "complemento": "",
    "bairro": "",
    "cidade": "",
    "estado": "",
    "cep": ""
  }'::jsonb,
  
  -- Dimensões padrão dos pacotes
  dimensoes_padrao JSONB NOT NULL DEFAULT '{
    "peso": 500,
    "altura": 10,
    "largura": 15,
    "comprimento": 20
  }'::jsonb,
  
  -- Configurações
  ativo BOOLEAN DEFAULT true,
  geracao_automatica BOOLEAN DEFAULT false,
  servico_padrao_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Comentários da tabela config_envioecom
COMMENT ON TABLE config_envioecom IS 'Configurações da integração com EnvioEcom';
COMMENT ON COLUMN config_envioecom.slug IS 'SLUG da conta EnvioEcom';
COMMENT ON COLUMN config_envioecom.etoken IS 'Token de autenticação EnvioEcom';
COMMENT ON COLUMN config_envioecom.endereco_origem IS 'Dados do endereço de origem (remetente) em formato JSON';
COMMENT ON COLUMN config_envioecom.dimensoes_padrao IS 'Dimensões padrão dos pacotes (peso em gramas, medidas em cm)';
COMMENT ON COLUMN config_envioecom.geracao_automatica IS 'Se true, gera etiqueta automaticamente após pagamento aprovado';
COMMENT ON COLUMN config_envioecom.servico_padrao_id IS 'ID do serviço de frete padrão para geração automática';

-- 5. Criar índices
CREATE INDEX IF NOT EXISTS idx_vendas_codigo_rastreio ON vendas(codigo_rastreio);
CREATE INDEX IF NOT EXISTS idx_vendas_transportadora ON vendas(transportadora);
CREATE INDEX IF NOT EXISTS idx_config_envioecom_ativo ON config_envioecom(ativo);

-- 6. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_config_envioecom_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_config_envioecom_updated_at
BEFORE UPDATE ON config_envioecom
FOR EACH ROW
EXECUTE FUNCTION update_config_envioecom_updated_at();

-- ================================================
-- Verificação
-- ================================================
-- SELECT * FROM config_envioecom;
-- SELECT id, codigo_rastreio, url_etiqueta, transportadora FROM vendas WHERE codigo_rastreio IS NOT NULL;
