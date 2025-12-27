-- ============================================================================
-- Migration 035: Carrinhos Abandonados e Sistema de Promoções
-- ============================================================================
-- Description: Cria tabelas para rastrear carrinhos abandonados e promoções
-- Date: 2025-12-27

-- ============================================================================
-- PARTE 1: CARRINHOS ABANDONADOS
-- ============================================================================

-- Tabela principal de carrinhos abandonados
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  
  -- Dados do cliente
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  
  -- Status e métricas
  status VARCHAR(20) DEFAULT 'abandoned', -- abandoned, recovered, converted, expired
  total_value DECIMAL(10,2) DEFAULT 0,
  items_count INTEGER DEFAULT 0,
  
  -- Datas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recovered_at TIMESTAMP WITH TIME ZONE,
  
  -- Contato
  contacted BOOLEAN DEFAULT false,
  contacted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Índices para carrinhos abandonados
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_reseller ON abandoned_carts(reseller_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_phone ON abandoned_carts(customer_phone);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON abandoned_carts(status);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_created ON abandoned_carts(created_at DESC);

-- Itens do carrinho abandonado
CREATE TABLE IF NOT EXISTS abandoned_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES abandoned_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  
  -- Dados do produto no momento da adição
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  
  -- Variação (se aplicável)
  variation_id VARCHAR(100),
  variation_name VARCHAR(255),
  
  -- Datas
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para itens do carrinho
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON abandoned_cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON abandoned_cart_items(product_id);

-- ============================================================================
-- PARTE 2: SISTEMA DE PROMOÇÕES
-- ============================================================================

-- Tabela de promoções
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'frete_gratis', 'cupom_desconto', 'leve_pague', 'desconto_percentual', 'desconto_valor'
  
  -- Configurações do desconto
  discount_type VARCHAR(20), -- 'percentage', 'fixed_value'
  discount_value DECIMAL(10,2), -- valor ou percentual
  
  -- Configuração Leve X Pague Y
  buy_quantity INTEGER, -- quantidade para comprar
  pay_quantity INTEGER, -- quantidade para pagar
  
  -- Frete grátis
  free_shipping BOOLEAN DEFAULT false,
  min_value_free_shipping DECIMAL(10,2), -- valor mínimo para frete grátis
  
  -- Cupom
  coupon_code VARCHAR(50),
  
  -- Condições
  min_purchase_value DECIMAL(10,2), -- valor mínimo de compra
  max_discount_value DECIMAL(10,2), -- desconto máximo (para percentuais)
  max_uses INTEGER, -- limite de usos (null = ilimitado)
  uses_count INTEGER DEFAULT 0,
  
  -- Produtos específicos (null = todos)
  applies_to VARCHAR(20) DEFAULT 'all', -- 'all', 'categories', 'products'
  product_ids UUID[], -- array de IDs de produtos específicos
  category_ids TEXT[], -- array de categorias
  
  -- Período de validade
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Datas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para promoções
CREATE INDEX IF NOT EXISTS idx_promotions_reseller ON promotions(reseller_id);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_coupon ON promotions(coupon_code);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(starts_at, ends_at);

-- Tabela de uso de promoções (para rastrear quem usou)
CREATE TABLE IF NOT EXISTS promotion_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  cart_id UUID REFERENCES abandoned_carts(id),
  discount_applied DECIMAL(10,2),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotion_uses_promotion ON promotion_uses(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_uses_phone ON promotion_uses(customer_phone);

-- ============================================================================
-- PARTE 3: FUNÇÕES E TRIGGERS
-- ============================================================================

-- Função para atualizar totais do carrinho abandonado
CREATE OR REPLACE FUNCTION update_abandoned_cart_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE abandoned_carts
  SET 
    total_value = (
      SELECT COALESCE(SUM(product_price * quantity), 0)
      FROM abandoned_cart_items
      WHERE cart_id = COALESCE(NEW.cart_id, OLD.cart_id)
    ),
    items_count = (
      SELECT COALESCE(SUM(quantity), 0)
      FROM abandoned_cart_items
      WHERE cart_id = COALESCE(NEW.cart_id, OLD.cart_id)
    ),
    updated_at = NOW(),
    last_activity_at = NOW()
  WHERE id = COALESCE(NEW.cart_id, OLD.cart_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar totais
DROP TRIGGER IF EXISTS trigger_update_cart_totals ON abandoned_cart_items;
CREATE TRIGGER trigger_update_cart_totals
  AFTER INSERT OR UPDATE OR DELETE ON abandoned_cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_abandoned_cart_totals();

-- Função para incrementar uso de promoção
CREATE OR REPLACE FUNCTION increment_promotion_uses()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE promotions
  SET uses_count = uses_count + 1
  WHERE id = NEW.promotion_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para incrementar usos
DROP TRIGGER IF EXISTS trigger_increment_promo_uses ON promotion_uses;
CREATE TRIGGER trigger_increment_promo_uses
  AFTER INSERT ON promotion_uses
  FOR EACH ROW
  EXECUTE FUNCTION increment_promotion_uses();

-- ============================================================================
-- PARTE 4: RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_uses ENABLE ROW LEVEL SECURITY;

-- Políticas para carrinhos abandonados
DROP POLICY IF EXISTS "Revendedora vê seus carrinhos" ON abandoned_carts;
CREATE POLICY "Revendedora vê seus carrinhos" ON abandoned_carts
  FOR SELECT USING (
    reseller_id IN (SELECT id FROM resellers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Público pode criar carrinho" ON abandoned_carts;
CREATE POLICY "Público pode criar carrinho" ON abandoned_carts
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Público pode atualizar carrinho" ON abandoned_carts;
CREATE POLICY "Público pode atualizar carrinho" ON abandoned_carts
  FOR UPDATE USING (true);

-- Políticas para itens do carrinho
DROP POLICY IF EXISTS "Acesso itens carrinho" ON abandoned_cart_items;
CREATE POLICY "Acesso itens carrinho" ON abandoned_cart_items
  FOR ALL USING (true);

-- Políticas para promoções
DROP POLICY IF EXISTS "Revendedora gerencia promoções" ON promotions;
CREATE POLICY "Revendedora gerencia promoções" ON promotions
  FOR ALL USING (
    reseller_id IN (SELECT id FROM resellers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Público vê promoções ativas" ON promotions;
CREATE POLICY "Público vê promoções ativas" ON promotions
  FOR SELECT USING (
    is_active = true 
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

-- Políticas para uso de promoções
DROP POLICY IF EXISTS "Acesso uso promoções" ON promotion_uses;
CREATE POLICY "Acesso uso promoções" ON promotion_uses
  FOR ALL USING (true);

-- ============================================================================
-- PARTE 5: COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE abandoned_carts IS 'Carrinhos abandonados para recuperação de vendas';
COMMENT ON TABLE abandoned_cart_items IS 'Itens dos carrinhos abandonados';
COMMENT ON TABLE promotions IS 'Promoções das revendedoras (cupons, frete grátis, etc)';
COMMENT ON TABLE promotion_uses IS 'Registro de uso das promoções';

COMMENT ON COLUMN promotions.type IS 'Tipos: frete_gratis, cupom_desconto, leve_pague, desconto_percentual, desconto_valor';
COMMENT ON COLUMN abandoned_carts.status IS 'Status: abandoned, recovered, converted, expired';

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 035 aplicada com sucesso!';
  RAISE NOTICE '📦 Tabelas criadas: abandoned_carts, abandoned_cart_items, promotions, promotion_uses';
END $$;
