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
  colors JSONB DEFAULT '{"primary": "#ec4899", "secondary": "#8b5cf6"}'::jsonb,
  is_active BOOLEAN DEFAULT true,
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
  product_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
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

-- STEP 3: Function auto-generate slug
CREATE OR REPLACE FUNCTION generate_slug_from_store_name()
RETURNS TRIGGER AS `$`$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := lower(regexp_replace(
      unaccent(NEW.store_name),
      '[^a-z0-9]+', '-', 'g'
    ));
    NEW.slug := trim(both '-' from NEW.slug);
  END IF;
  RETURN NEW;
END;
`$`$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_slug ON resellers;
CREATE TRIGGER trigger_generate_slug
  BEFORE INSERT OR UPDATE ON resellers
  FOR EACH ROW EXECUTE FUNCTION generate_slug_from_store_name();

-- STEP 4: Function update total_products
CREATE OR REPLACE FUNCTION update_reseller_total_products()
RETURNS TRIGGER AS `$`$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE resellers SET total_products = (
      SELECT COUNT(*) FROM reseller_products 
      WHERE reseller_id = NEW.reseller_id AND is_active = true
    ) WHERE id = NEW.reseller_id;
  END IF;
  IF TG_OP = 'DELETE' THEN
    UPDATE resellers SET total_products = (
      SELECT COUNT(*) FROM reseller_products 
      WHERE reseller_id = OLD.reseller_id AND is_active = true
    ) WHERE id = OLD.reseller_id;
  END IF;
  RETURN NEW;
END;
`$`$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reseller_total_products ON reseller_products;
CREATE TRIGGER trigger_update_reseller_total_products
  AFTER INSERT OR UPDATE OR DELETE ON reseller_products
  FOR EACH ROW EXECUTE FUNCTION update_reseller_total_products();

-- STEP 5: Function increment catalog views
CREATE OR REPLACE FUNCTION increment_catalog_views(reseller_id_param UUID)
RETURNS VOID AS `$`$
BEGIN
  UPDATE resellers 
  SET catalog_views = catalog_views + 1 
  WHERE id = reseller_id_param AND is_active = true;
END;
`$`$ LANGUAGE plpgsql;

-- STEP 6: RLS Policies
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Resellers publicos para leitura" ON resellers;
CREATE POLICY "Resellers publicos para leitura" 
  ON resellers FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin gerencia resellers" ON resellers;
CREATE POLICY "Admin gerencia resellers" 
  ON resellers FOR ALL USING (true);

DROP POLICY IF EXISTS "Produtos publicos para catalogo" ON reseller_products;
CREATE POLICY "Produtos publicos para catalogo" 
  ON reseller_products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin gerencia produtos" ON reseller_products;
CREATE POLICY "Admin gerencia produtos" 
  ON reseller_products FOR ALL USING (true);