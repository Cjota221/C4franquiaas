-- ============================================================================
-- REMOVER NOTIFICAÇÕES DE PRODUTOS NOVOS
-- ============================================================================
-- Agora produtos novos já vêm com margem aplicada automaticamente
-- Não precisamos mais notificar sobre produtos novos
-- ============================================================================

-- STEP 1: Dropar trigger de notificação de produtos novos
DROP TRIGGER IF EXISTS trigger_notificar_produtos_novos ON reseller_products;

-- STEP 2: Dropar função de notificação (opcional, pode manter para uso futuro)
DROP FUNCTION IF EXISTS notificar_revendedoras_produtos_novos();

-- STEP 3: Limpar notificações antigas de produtos novos (opcional)
DELETE FROM reseller_notifications 
WHERE type = 'new_products';

-- ============================================================================
-- ✅ PRONTO!
-- ============================================================================
-- Agora produtos novos:
-- 1. Chegam automaticamente com margem_padrao da loja aplicada
-- 2. Já ficam ATIVOS no catálogo
-- 3. NÃO geram notificações
-- ============================================================================
