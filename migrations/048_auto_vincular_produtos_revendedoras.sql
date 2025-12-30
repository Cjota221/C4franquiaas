-- Migration 048: Auto-vincular produtos às revendedoras + Sistema de notificações
-- Data: 30/12/2025

-- =============================================
-- PARTE 1: Trigger para auto-vincular produtos
-- =============================================

-- Função que vincula produto novo a todas as revendedoras ativas
CREATE OR REPLACE FUNCTION auto_vincular_produto_revendedoras()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um produto é ATIVADO (ativo = true)
  IF NEW.ativo = true AND (TG_OP = 'INSERT' OR OLD.ativo = false) THEN
    
    -- Inserir o produto para TODAS as revendedoras aprovadas e ativas
    INSERT INTO reseller_products (
      reseller_id,
      product_id,
      margin_percent,
      is_active,
      created_at
    )
    SELECT 
      r.id,
      NEW.id,
      30, -- Margem padrão de 30%
      true, -- Produto já vem ATIVO
      NOW()
    FROM resellers r
    WHERE r.status = 'aprovada'
      AND r.is_active = true
    ON CONFLICT (reseller_id, product_id) 
    DO UPDATE SET 
      is_active = true, -- Reativa se estava desativado
      updated_at = NOW();

    -- Log da operação
    RAISE NOTICE 'Produto % vinculado automaticamente às revendedoras', NEW.nome;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa APÓS INSERT ou UPDATE na tabela produtos
DROP TRIGGER IF EXISTS trigger_auto_vincular_revendedoras ON produtos;
CREATE TRIGGER trigger_auto_vincular_revendedoras
  AFTER INSERT OR UPDATE OF ativo ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION auto_vincular_produto_revendedoras();

-- =============================================
-- PARTE 2: Tabela de notificações
-- =============================================

CREATE TABLE IF NOT EXISTS reseller_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  
  -- Tipo da notificação
  type TEXT NOT NULL, -- 'new_products', 'banner_approved', 'banner_rejected', 'sale', 'low_stock'
  
  -- Conteúdo
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Dados extras (JSON)
  metadata JSONB DEFAULT '{}',
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Link de ação (opcional)
  action_url TEXT,
  action_label TEXT, -- Ex: "Ver produtos", "Ver banner"
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reseller_notifications_reseller ON reseller_notifications(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_notifications_read ON reseller_notifications(read);
CREATE INDEX IF NOT EXISTS idx_reseller_notifications_created ON reseller_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reseller_notifications_type ON reseller_notifications(type);

-- =============================================
-- PARTE 3: Função para criar notificação de produtos novos
-- =============================================

CREATE OR REPLACE FUNCTION notificar_revendedoras_produtos_novos()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Contar quantas revendedoras receberam o produto
  SELECT COUNT(DISTINCT reseller_id)
  INTO v_count
  FROM reseller_products
  WHERE product_id = NEW.id;

  -- Criar notificação para cada revendedora
  INSERT INTO reseller_notifications (
    reseller_id,
    type,
    title,
    message,
    metadata,
    action_url,
    action_label
  )
  SELECT 
    rp.reseller_id,
    'new_products',
    '🎉 Novo produto disponível!',
    'O produto "' || NEW.nome || '" foi adicionado ao seu catálogo.',
    jsonb_build_object(
      'product_id', NEW.id,
      'product_name', NEW.nome,
      'product_price', NEW.preco_base,
      'product_image', NEW.imagem
    ),
    '/revendedora/produtos',
    'Ver produto'
  FROM reseller_products rp
  WHERE rp.product_id = NEW.id
    AND rp.is_active = true
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar notificação quando produto é vinculado
DROP TRIGGER IF EXISTS trigger_notificar_produtos_novos ON reseller_products;
CREATE TRIGGER trigger_notificar_produtos_novos
  AFTER INSERT ON reseller_products
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION notificar_revendedoras_produtos_novos();

-- =============================================
-- PARTE 4: RLS (Row Level Security)
-- =============================================

ALTER TABLE reseller_notifications ENABLE ROW LEVEL SECURITY;

-- Revendedora pode ver apenas suas próprias notificações
DROP POLICY IF EXISTS "Revendedora pode ver suas notificações" ON reseller_notifications;
CREATE POLICY "Revendedora pode ver suas notificações" 
  ON reseller_notifications FOR SELECT
  USING (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
  );

-- Revendedora pode marcar suas notificações como lidas
DROP POLICY IF EXISTS "Revendedora pode atualizar suas notificações" ON reseller_notifications;
CREATE POLICY "Revendedora pode atualizar suas notificações" 
  ON reseller_notifications FOR UPDATE
  USING (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
  );

-- Sistema pode inserir notificações (via service role)
DROP POLICY IF EXISTS "Sistema pode inserir notificações" ON reseller_notifications;
CREATE POLICY "Sistema pode inserir notificações" 
  ON reseller_notifications FOR INSERT
  WITH CHECK (true);

-- Admin pode ver todas as notificações
DROP POLICY IF EXISTS "Admin pode ver todas notificações" ON reseller_notifications;
CREATE POLICY "Admin pode ver todas notificações" 
  ON reseller_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =============================================
-- PARTE 5: Vincular produtos EXISTENTES às revendedoras
-- (Executar uma vez para produtos que já existem)
-- =============================================

-- Esta query vincula TODOS os produtos ativos existentes
-- às revendedoras aprovadas e ativas
INSERT INTO reseller_products (
  reseller_id,
  product_id,
  margin_percent,
  is_active,
  created_at
)
SELECT 
  r.id,
  p.id,
  30, -- Margem padrão de 30%
  true,
  NOW()
FROM resellers r
CROSS JOIN produtos p
WHERE r.status = 'aprovada'
  AND r.is_active = true
  AND p.ativo = true
ON CONFLICT (reseller_id, product_id) DO NOTHING;

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON TABLE reseller_notifications IS 'Notificações para revendedoras (novos produtos, banners, vendas)';
COMMENT ON COLUMN reseller_notifications.type IS 'Tipo: new_products, banner_approved, banner_rejected, sale, low_stock';
COMMENT ON COLUMN reseller_notifications.metadata IS 'Dados extras em JSON (IDs, quantidades, etc)';

-- =============================================
-- FIM DA MIGRATION
-- =============================================

-- Para executar:
-- 1. Copie este SQL
-- 2. Vá ao Supabase → SQL Editor
-- 3. Cole e execute
-- 4. Verifique os logs para confirmar sucesso
