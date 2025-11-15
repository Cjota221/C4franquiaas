-- ============================================================================
-- Migration 032: Sistema de Revendedoras
-- ============================================================================
-- Description: Cria tabelas para sistema de revendedoras com catálogo próprio
-- Date: 2025-11-15

-- STEP 1: Criar tabela resellers
CREATE TABLE IF NOT EXISTS resellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  store_name TEXT NOT NULL DEFAULT 'Minha Loja',
  slug TEXT UNIQUE,
  logo_url TEXT,
  color_primary TEXT DEFAULT '#DB1472',
  color_secondary TEXT DEFAULT '#333333',
  is_active BOOLEAN DEFAULT true,
  show_prices BOOLEAN DEFAULT true,
  total_products INTEGER DEFAULT 0,
  catalog_views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resellers_email ON resellers(email);
CREATE INDEX IF NOT EXISTS idx_resellers_slug ON resellers(slug);
CREATE INDEX IF NOT EXISTS idx_resellers_is_active ON resellers(is_active);

-- STEP 2: Criar tabela reseller_products
CREATE TABLE IF NOT EXISTS reseller_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  margin_percent DECIMAL(5,2) DEFAULT 30.00,
  custom_price DECIMAL(10,2),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reseller_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_reseller_products_reseller ON reseller_products(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_products_active ON reseller_products(is_active);

-- STEP 3: Functions e Triggers
CREATE OR REPLACE FUNCTION update_reseller_total_products()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE resellers SET total_products = (
      SELECT COUNT(*) FROM reseller_products WHERE reseller_id = NEW.reseller_id AND is_active = true
    ) WHERE id = NEW.reseller_id;
  END IF;
  IF TG_OP = 'DELETE' THEN
    UPDATE resellers SET total_products = (
      SELECT COUNT(*) FROM reseller_products WHERE reseller_id = OLD.reseller_id AND is_active = true
    ) WHERE id = OLD.reseller_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reseller_total_products ON reseller_products;
CREATE TRIGGER trigger_update_reseller_total_products
  AFTER INSERT OR UPDATE OR DELETE ON reseller_products
  FOR EACH ROW EXECUTE FUNCTION update_reseller_total_products();

-- STEP 4: Função de incremento de views
CREATE OR REPLACE FUNCTION increment_catalog_views(p_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE resellers SET catalog_views = catalog_views + 1 WHERE slug = p_slug AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- STEP 5: RLS
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resellers publicos para leitura" ON resellers FOR SELECT USING (true);
CREATE POLICY "Admin gerencia resellers" ON resellers FOR ALL USING (true);
CREATE POLICY "Produtos publicos para catalogo" ON reseller_products FOR SELECT USING (true);
CREATE POLICY "Admin gerencia produtos" ON reseller_products FOR ALL USING (true);