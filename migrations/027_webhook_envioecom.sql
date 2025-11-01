-- ================================================
-- Migration 027: Webhook EnvioEcom (Fluxo Reverso)
-- ================================================
-- Descrição: Cria tabela para armazenar token que NÓS geramos
--            para autenticar webhooks DA EnvioEcom PARA NÓS
-- Autor: Sistema
-- Data: 2025-10-30
-- ================================================

-- 1. Criar tabela config_envioecom_webhook
CREATE TABLE IF NOT EXISTS config_envioecom_webhook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  webhook_token TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  ativo BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Comentários
COMMENT ON TABLE config_envioecom_webhook IS 'Configuração de webhook reverso - Token que NÓS geramos para EnvioEcom se autenticar';
COMMENT ON COLUMN config_envioecom_webhook.slug IS 'Identificador único da conta (exemplo: c4franquias)';
COMMENT ON COLUMN config_envioecom_webhook.webhook_token IS 'Token que NÓS geramos para EnvioEcom usar ao enviar webhooks';
COMMENT ON COLUMN config_envioecom_webhook.webhook_url IS 'URL do nosso endpoint que receberá os webhooks';
COMMENT ON COLUMN config_envioecom_webhook.ativo IS 'Se a integração está ativa';

-- 3. Criar índice
CREATE INDEX IF NOT EXISTS idx_webhook_token ON config_envioecom_webhook(webhook_token);

-- 4. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_webhook_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_webhook_config
BEFORE UPDATE ON config_envioecom_webhook
FOR EACH ROW
EXECUTE FUNCTION update_webhook_config_updated_at();

-- 5. Criar tabela de log de webhooks recebidos
CREATE TABLE IF NOT EXISTS envioecom_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_tipo TEXT NOT NULL,
  codigo_rastreio TEXT,
  status TEXT,
  payload JSONB NOT NULL,
  processado BOOLEAN DEFAULT false,
  erro TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE envioecom_webhook_logs IS 'Log de todos os webhooks recebidos da EnvioEcom';
COMMENT ON COLUMN envioecom_webhook_logs.evento_tipo IS 'Tipo de evento (ex: status_changed, etiqueta_gerada, etc)';
COMMENT ON COLUMN envioecom_webhook_logs.processado IS 'Se o webhook foi processado com sucesso';

CREATE INDEX IF NOT EXISTS idx_webhook_logs_codigo ON envioecom_webhook_logs(codigo_rastreio);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON envioecom_webhook_logs(created_at DESC);

-- ================================================
-- Verificação
-- ================================================
-- SELECT * FROM config_envioecom_webhook;
-- SELECT * FROM envioecom_webhook_logs ORDER BY created_at DESC LIMIT 10;
