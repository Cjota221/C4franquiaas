-- ============================================================================
-- Migration 047: WhatsApp Instance para Revendedoras
-- ============================================================================
-- Description: Adiciona campos para conexão WhatsApp individual por revendedora
-- Date: 2024-12-30

-- STEP 1: Adicionar campos de WhatsApp
ALTER TABLE resellers 
  ADD COLUMN IF NOT EXISTS whatsapp_instance_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS whatsapp_connected_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
    "novoPedido": true,
    "pedidoAprovado": true,
    "pedidoEnviado": true,
    "carrinhoAbandonado": true
  }'::jsonb;

-- STEP 2: Criar índice
CREATE INDEX IF NOT EXISTS idx_resellers_whatsapp_instance ON resellers(whatsapp_instance_id);

-- STEP 3: Comentários
COMMENT ON COLUMN resellers.whatsapp_instance_id IS 'ID da instância WhatsApp na Evolution API';
COMMENT ON COLUMN resellers.whatsapp_connected_at IS 'Data/hora da última conexão WhatsApp';
COMMENT ON COLUMN resellers.notification_settings IS 'Configurações de notificações WhatsApp (JSON)';

-- STEP 4: Validação
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 047 aplicada com sucesso!';
  RAISE NOTICE 'Campos adicionados: whatsapp_instance_id, whatsapp_connected_at, notification_settings';
END $$;
