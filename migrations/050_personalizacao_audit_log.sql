-- ============================================================================
-- Migration: Sistema de Audit Log para Personalização
-- ============================================================================
-- Descrição: Cria tabela e triggers para rastrear mudanças em personalizações
-- Data: 2026-01-10

-- ============================================================================
-- 1. CRIAR TABELA DE HISTÓRICO
-- ============================================================================

CREATE TABLE IF NOT EXISTS personalizacao_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  
  -- Tipo de elemento alterado
  elemento VARCHAR(50) NOT NULL CHECK (elemento IN (
    'logo',
    'cores',
    'banner_desktop',
    'banner_mobile',
    'estilos',
    'margem_produto'
  )),
  
  -- Tipo de ação
  acao VARCHAR(20) NOT NULL CHECK (acao IN ('criado', 'atualizado', 'removido')),
  
  -- Valores (JSON para flexibilidade)
  valor_anterior JSONB,
  valor_novo JSONB,
  
  -- Metadados adicionais
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_personalizacao_historico_reseller 
  ON personalizacao_historico(reseller_id);
CREATE INDEX IF NOT EXISTS idx_personalizacao_historico_elemento 
  ON personalizacao_historico(elemento);
CREATE INDEX IF NOT EXISTS idx_personalizacao_historico_created 
  ON personalizacao_historico(created_at DESC);

-- ============================================================================
-- 2. FUNÇÃO PARA REGISTRAR MUDANÇA DE LOGO
-- ============================================================================

CREATE OR REPLACE FUNCTION log_logo_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se logo mudou
  IF (NEW.logo_url IS DISTINCT FROM OLD.logo_url) THEN
    INSERT INTO personalizacao_historico (
      reseller_id,
      elemento,
      acao,
      valor_anterior,
      valor_novo
    ) VALUES (
      NEW.id,
      'logo',
      CASE
        WHEN OLD.logo_url IS NULL AND NEW.logo_url IS NOT NULL THEN 'criado'
        WHEN OLD.logo_url IS NOT NULL AND NEW.logo_url IS NULL THEN 'removido'
        ELSE 'atualizado'
      END,
      jsonb_build_object('url', OLD.logo_url),
      jsonb_build_object('url', NEW.logo_url)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. FUNÇÃO PARA REGISTRAR MUDANÇA DE CORES
-- ============================================================================

CREATE OR REPLACE FUNCTION log_colors_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se cores mudaram
  IF (NEW.colors IS DISTINCT FROM OLD.colors) THEN
    INSERT INTO personalizacao_historico (
      reseller_id,
      elemento,
      acao,
      valor_anterior,
      valor_novo
    ) VALUES (
      NEW.id,
      'cores',
      CASE
        WHEN OLD.colors IS NULL AND NEW.colors IS NOT NULL THEN 'criado'
        WHEN OLD.colors IS NOT NULL AND NEW.colors IS NULL THEN 'removido'
        ELSE 'atualizado'
      END,
      OLD.colors::jsonb,
      NEW.colors::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. FUNÇÃO PARA REGISTRAR MUDANÇA DE BANNERS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_banner_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Banner Desktop mudou
  IF (NEW.banner_url IS DISTINCT FROM OLD.banner_url) THEN
    INSERT INTO personalizacao_historico (
      reseller_id,
      elemento,
      acao,
      valor_anterior,
      valor_novo
    ) VALUES (
      NEW.id,
      'banner_desktop',
      CASE
        WHEN OLD.banner_url IS NULL AND NEW.banner_url IS NOT NULL THEN 'criado'
        WHEN OLD.banner_url IS NOT NULL AND NEW.banner_url IS NULL THEN 'removido'
        ELSE 'atualizado'
      END,
      jsonb_build_object('url', OLD.banner_url),
      jsonb_build_object('url', NEW.banner_url)
    );
  END IF;
  
  -- Banner Mobile mudou
  IF (NEW.banner_mobile_url IS DISTINCT FROM OLD.banner_mobile_url) THEN
    INSERT INTO personalizacao_historico (
      reseller_id,
      elemento,
      acao,
      valor_anterior,
      valor_novo
    ) VALUES (
      NEW.id,
      'banner_mobile',
      CASE
        WHEN OLD.banner_mobile_url IS NULL AND NEW.banner_mobile_url IS NOT NULL THEN 'criado'
        WHEN OLD.banner_mobile_url IS NOT NULL AND NEW.banner_mobile_url IS NULL THEN 'removido'
        ELSE 'atualizado'
      END,
      jsonb_build_object('url', OLD.banner_mobile_url),
      jsonb_build_object('url', NEW.banner_mobile_url)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. FUNÇÃO PARA REGISTRAR MUDANÇA DE ESTILOS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_styles_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se theme_settings mudou
  IF (NEW.theme_settings IS DISTINCT FROM OLD.theme_settings) THEN
    INSERT INTO personalizacao_historico (
      reseller_id,
      elemento,
      acao,
      valor_anterior,
      valor_novo
    ) VALUES (
      NEW.id,
      'estilos',
      CASE
        WHEN OLD.theme_settings IS NULL AND NEW.theme_settings IS NOT NULL THEN 'criado'
        WHEN OLD.theme_settings IS NOT NULL AND NEW.theme_settings IS NULL THEN 'removido'
        ELSE 'atualizado'
      END,
      OLD.theme_settings::jsonb,
      NEW.theme_settings::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. FUNÇÃO PARA REGISTRAR MUDANÇA DE MARGEM DE PRODUTO
-- ============================================================================

CREATE OR REPLACE FUNCTION log_margin_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se margem ou preço custom mudou
  IF (NEW.margin_percent IS DISTINCT FROM OLD.margin_percent) OR
     (NEW.custom_price IS DISTINCT FROM OLD.custom_price) THEN
    INSERT INTO personalizacao_historico (
      reseller_id,
      elemento,
      acao,
      valor_anterior,
      valor_novo,
      metadata
    ) VALUES (
      NEW.reseller_id,
      'margem_produto',
      CASE
        WHEN OLD.margin_percent IS NULL AND OLD.custom_price IS NULL THEN 'criado'
        ELSE 'atualizado'
      END,
      jsonb_build_object(
        'margin_percent', OLD.margin_percent,
        'custom_price', OLD.custom_price
      ),
      jsonb_build_object(
        'margin_percent', NEW.margin_percent,
        'custom_price', NEW.custom_price
      ),
      jsonb_build_object(
        'product_id', NEW.product_id,
        'reseller_product_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. CRIAR TRIGGERS
-- ============================================================================

-- Trigger para mudanças na tabela resellers
DROP TRIGGER IF EXISTS resellers_personalizacao_trigger ON resellers;
CREATE TRIGGER resellers_personalizacao_trigger
  AFTER UPDATE ON resellers
  FOR EACH ROW
  EXECUTE FUNCTION log_logo_change();

DROP TRIGGER IF EXISTS resellers_colors_trigger ON resellers;
CREATE TRIGGER resellers_colors_trigger
  AFTER UPDATE ON resellers
  FOR EACH ROW
  EXECUTE FUNCTION log_colors_change();

DROP TRIGGER IF EXISTS resellers_banner_trigger ON resellers;
CREATE TRIGGER resellers_banner_trigger
  AFTER UPDATE ON resellers
  FOR EACH ROW
  EXECUTE FUNCTION log_banner_change();

DROP TRIGGER IF EXISTS resellers_styles_trigger ON resellers;
CREATE TRIGGER resellers_styles_trigger
  AFTER UPDATE ON resellers
  FOR EACH ROW
  EXECUTE FUNCTION log_styles_change();

-- Trigger para mudanças em reseller_products
DROP TRIGGER IF EXISTS reseller_products_margin_trigger ON reseller_products;
CREATE TRIGGER reseller_products_margin_trigger
  AFTER INSERT OR UPDATE ON reseller_products
  FOR EACH ROW
  EXECUTE FUNCTION log_margin_change();

-- ============================================================================
-- 8. RLS (Row Level Security)
-- ============================================================================

ALTER TABLE personalizacao_historico ENABLE ROW LEVEL SECURITY;

-- Admins podem ver tudo (criar policy somente se tabela `perfil` existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'perfil' AND table_schema = current_schema()
  ) THEN
    EXECUTE '
      CREATE POLICY "Admins podem ver histórico"
        ON personalizacao_historico FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM perfil
            WHERE perfil.id = auth.uid()
            AND perfil.tipo = ''admin''
          )
        )';
  ELSE
    -- Se não existir a tabela `perfil`, criar uma policy mais genérica
    -- que permite SELECT apenas a usuários autenticados com claim 'admin' no JWT
    -- OBS: Ajuste conforme sua estratégia de roles no Supabase.
    RAISE NOTICE 'Tabela "perfil" não encontrada: pulando criação da policy específica. Por favor, verifique roles/admins e ajuste manualmente.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Revendedoras podem ver apenas seu histórico (criaremos a policy usando `resellers` que deve existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'resellers' AND table_schema = current_schema()
  ) THEN
    EXECUTE '
      CREATE POLICY "Revendedoras veem seu histórico"
        ON personalizacao_historico FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM resellers
            WHERE resellers.id = personalizacao_historico.reseller_id
            AND resellers.user_id = auth.uid()
          )
        )';
  ELSE
    RAISE NOTICE 'Tabela "resellers" não encontrada: pulando criação da policy que limita revendedoras. Verifique o schema.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE personalizacao_historico IS 'Histórico de mudanças em personalizações das revendedoras';
COMMENT ON COLUMN personalizacao_historico.elemento IS 'Tipo de elemento: logo, cores, banner_desktop, banner_mobile, estilos, margem_produto';
COMMENT ON COLUMN personalizacao_historico.acao IS 'Tipo de ação: criado, atualizado, removido';
COMMENT ON COLUMN personalizacao_historico.valor_anterior IS 'Valor anterior em JSON';
COMMENT ON COLUMN personalizacao_historico.valor_novo IS 'Novo valor em JSON';
COMMENT ON COLUMN personalizacao_historico.metadata IS 'Metadados adicionais (product_id, etc)';

-- ============================================================================
-- 10. QUERY DE EXEMPLO PARA VER HISTÓRICO
-- ============================================================================

/*
-- Ver histórico de uma revendedora específica
SELECT
  ph.created_at,
  ph.elemento,
  ph.acao,
  ph.valor_anterior,
  ph.valor_novo,
  r.store_name
FROM personalizacao_historico ph
JOIN resellers r ON r.id = ph.reseller_id
WHERE ph.reseller_id = 'UUID_DA_REVENDEDORA'
ORDER BY ph.created_at DESC;

-- Ver últimas mudanças de logo (últimas 50)
SELECT
  ph.created_at,
  r.store_name,
  r.slug,
  ph.acao,
  ph.valor_novo->>'url' as nova_logo_url
FROM personalizacao_historico ph
JOIN resellers r ON r.id = ph.reseller_id
WHERE ph.elemento = 'logo'
ORDER BY ph.created_at DESC
LIMIT 50;

-- Ver revendedoras que NUNCA personalizaram
SELECT
  r.id,
  r.store_name,
  r.slug,
  r.created_at
FROM resellers r
LEFT JOIN personalizacao_historico ph ON ph.reseller_id = r.id
WHERE ph.id IS NULL
AND r.is_active = true
ORDER BY r.created_at DESC;
*/

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
