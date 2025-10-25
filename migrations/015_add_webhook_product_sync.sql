-- ============================================================================
-- Migration 015: Sistema de Webhook para Sincronização de Produtos
-- ============================================================================
-- Description: Adiciona campos para webhooks de sincronização de produtos
-- Author: GitHub Copilot
-- Date: 2025-10-25
-- 
-- Este migration adiciona:
-- 1. webhook_product_url - URL do webhook para notificar a franqueada
-- 2. webhook_secret - Chave secreta para validação do webhook
-- 3. auto_sync_enabled - Flag para habilitar sincronização automática
-- 4. last_product_sync_at - Data/hora da última sincronização
-- ============================================================================

BEGIN;

-- Adicionar campos de webhook na tabela lojas
ALTER TABLE lojas
  ADD COLUMN IF NOT EXISTS webhook_product_url TEXT,
  ADD COLUMN IF NOT EXISTS webhook_secret TEXT,
  ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_product_sync_at TIMESTAMP;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_lojas_auto_sync 
ON lojas(auto_sync_enabled) 
WHERE auto_sync_enabled = true;

-- Comentários para documentação
COMMENT ON COLUMN lojas.webhook_product_url IS 
'URL do webhook do e-commerce da franqueada para receber atualizações de produtos';

COMMENT ON COLUMN lojas.webhook_secret IS 
'Chave secreta para validação de webhooks (X-Webhook-Secret header)';

COMMENT ON COLUMN lojas.auto_sync_enabled IS 
'Se true, envia webhooks automáticos quando produtos são criados/atualizados';

COMMENT ON COLUMN lojas.last_product_sync_at IS 
'Data/hora da última sincronização de produtos';

COMMIT;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'lojas' 
-- AND column_name IN ('webhook_product_url', 'webhook_secret', 'auto_sync_enabled', 'last_product_sync_at')
-- ORDER BY column_name;
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 015 aplicada com sucesso!';
  RAISE NOTICE '🔗 Campos de webhook adicionados à tabela lojas';
  RAISE NOTICE '🔄 Sistema de sincronização automática pronto';
END $$;
