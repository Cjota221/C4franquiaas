-- ================================================
-- Migration 026: Configuração EnvioEcom (CORRIGIDO)
-- ================================================
-- Descrição: Adiciona colunas para integração REVERSA com EnvioEcom
-- A EnvioEcom SE CONECTA a NÓS via Webhook
-- NÓS geramos o token que ELES usam para autenticar
-- Autor: Sistema
-- Data: 2025-11-01
-- ================================================

-- 0. DELETAR TABELA ANTIGA SE EXISTIR (com estrutura errada)
DROP TABLE IF EXISTS config_envioecom CASCADE;

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

-- 3. Criar tabela de configuração EnvioEcom (TOKEN QUE NÓS GERAMOS)
CREATE TABLE IF NOT EXISTS config_envioecom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- SLUG: Identificador único da nossa conta (ex: c4franquias)
  slug TEXT NOT NULL UNIQUE,
  
  -- TOKEN: Chave secreta que NÓS geramos e fornecemos para a EnvioEcom
  webhook_token TEXT NOT NULL UNIQUE,
  
  -- URL do webhook que a EnvioEcom vai chamar
  webhook_url TEXT,
  
  -- Configurações
  ativo BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Comentários da tabela config_envioecom
COMMENT ON TABLE config_envioecom IS 'Configurações da integração REVERSA com EnvioEcom (ELES se conectam a NÓS)';
COMMENT ON COLUMN config_envioecom.slug IS 'Identificador único da nossa conta (ex: c4franquias)';
COMMENT ON COLUMN config_envioecom.webhook_token IS 'Token de autenticação que NÓS geramos para validar chamadas da EnvioEcom';
COMMENT ON COLUMN config_envioecom.webhook_url IS 'URL do nosso endpoint que a EnvioEcom vai chamar';

-- 5. Criar tabela de log de webhooks recebidos
CREATE TABLE IF NOT EXISTS envioecom_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento TEXT NOT NULL,
  payload JSONB NOT NULL,
  headers JSONB,
  token_valido BOOLEAN DEFAULT false,
  processado BOOLEAN DEFAULT false,
  erro TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE envioecom_webhook_logs IS 'Log de todos os webhooks recebidos da EnvioEcom';

-- 6. Criar índices
CREATE INDEX IF NOT EXISTS idx_vendas_codigo_rastreio ON vendas(codigo_rastreio);
CREATE INDEX IF NOT EXISTS idx_vendas_transportadora ON vendas(transportadora);
CREATE INDEX IF NOT EXISTS idx_config_envioecom_ativo ON config_envioecom(ativo);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_evento ON envioecom_webhook_logs(evento);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON envioecom_webhook_logs(created_at);

-- 7. Trigger para atualizar updated_at
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
-- SELECT * FROM envioecom_webhook_logs ORDER BY created_at DESC LIMIT 10;
-- SELECT id, codigo_rastreio, url_etiqueta, transportadora FROM vendas WHERE codigo_rastreio IS NOT NULL;
