# 🔍 VERIFICAR E EXECUTAR MIGRATION DE PERSONALIZAÇÃO

## ❌ Problema: Tabela não foi criada

A migration não foi executada completamente. Vamos corrigir isso agora.

---

## 📋 PASSO 1: Verificar se tabela existe

Execute no Supabase SQL Editor:

```sql
-- Verificar se a tabela existe
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'personalizacao_historico';
```

**Se retornar vazio** = tabela não existe ❌  
**Se retornar uma linha** = tabela existe ✅

---

## 🚀 PASSO 2: Executar a migration completa

**Copie TODO o conteúdo do arquivo `migrations/050_personalizacao_audit_log.sql` e execute no Supabase SQL Editor.**

Ou execute linha por linha:

### 2.1 - Criar a tabela

```sql
CREATE TABLE IF NOT EXISTS personalizacao_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,

  elemento VARCHAR(50) NOT NULL CHECK (elemento IN (
    'logo',
    'cores',
    'banner_desktop',
    'banner_mobile',
    'estilos',
    'margem_produto'
  )),

  acao VARCHAR(20) NOT NULL CHECK (acao IN ('criado', 'atualizado', 'removido')),

  valor_anterior JSONB,
  valor_novo JSONB,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 - Criar índices

```sql
CREATE INDEX IF NOT EXISTS idx_personalizacao_historico_reseller
  ON personalizacao_historico(reseller_id);

CREATE INDEX IF NOT EXISTS idx_personalizacao_historico_elemento
  ON personalizacao_historico(elemento);

CREATE INDEX IF NOT EXISTS idx_personalizacao_historico_created
  ON personalizacao_historico(created_at DESC);
```

### 2.3 - Criar funções de log

```sql
-- Função para logo
CREATE OR REPLACE FUNCTION log_logo_change()
RETURNS TRIGGER AS $$
BEGIN
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

-- Função para cores
CREATE OR REPLACE FUNCTION log_colors_change()
RETURNS TRIGGER AS $$
BEGIN
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

-- Função para banners
CREATE OR REPLACE FUNCTION log_banner_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.banner_url IS DISTINCT FROM OLD.banner_url) THEN
    INSERT INTO personalizacao_historico (
      reseller_id, elemento, acao, valor_anterior, valor_novo
    ) VALUES (
      NEW.id, 'banner_desktop',
      CASE
        WHEN OLD.banner_url IS NULL AND NEW.banner_url IS NOT NULL THEN 'criado'
        WHEN OLD.banner_url IS NOT NULL AND NEW.banner_url IS NULL THEN 'removido'
        ELSE 'atualizado'
      END,
      jsonb_build_object('url', OLD.banner_url),
      jsonb_build_object('url', NEW.banner_url)
    );
  END IF;

  IF (NEW.banner_mobile_url IS DISTINCT FROM OLD.banner_mobile_url) THEN
    INSERT INTO personalizacao_historico (
      reseller_id, elemento, acao, valor_anterior, valor_novo
    ) VALUES (
      NEW.id, 'banner_mobile',
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

-- Função para estilos
CREATE OR REPLACE FUNCTION log_styles_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.theme_settings IS DISTINCT FROM OLD.theme_settings) THEN
    INSERT INTO personalizacao_historico (
      reseller_id, elemento, acao, valor_anterior, valor_novo
    ) VALUES (
      NEW.id, 'estilos',
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

-- Função para margens
CREATE OR REPLACE FUNCTION log_margin_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.margin_percent IS DISTINCT FROM OLD.margin_percent) OR
     (NEW.custom_price IS DISTINCT FROM OLD.custom_price) THEN
    INSERT INTO personalizacao_historico (
      reseller_id, elemento, acao, valor_anterior, valor_novo, metadata
    ) VALUES (
      NEW.reseller_id, 'margem_produto',
      CASE
        WHEN OLD.margin_percent IS NULL AND OLD.custom_price IS NULL THEN 'criado'
        ELSE 'atualizado'
      END,
      jsonb_build_object('margin_percent', OLD.margin_percent, 'custom_price', OLD.custom_price),
      jsonb_build_object('margin_percent', NEW.margin_percent, 'custom_price', NEW.custom_price),
      jsonb_build_object('product_id', NEW.product_id, 'reseller_product_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2.4 - Criar triggers

```sql
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

DROP TRIGGER IF EXISTS reseller_products_margin_trigger ON reseller_products;
CREATE TRIGGER reseller_products_margin_trigger
  AFTER INSERT OR UPDATE ON reseller_products
  FOR EACH ROW
  EXECUTE FUNCTION log_margin_change();
```

### 2.5 - Configurar RLS

```sql
ALTER TABLE personalizacao_historico ENABLE ROW LEVEL SECURITY;

-- Policy para revendedoras verem apenas seu histórico
CREATE POLICY "Revendedoras veem seu histórico"
  ON personalizacao_historico FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resellers
      WHERE resellers.id = personalizacao_historico.reseller_id
      AND resellers.user_id = auth.uid()
    )
  );
```

---

## ✅ PASSO 3: Verificar se funcionou

```sql
-- 1. Verificar tabela criada
SELECT table_name FROM information_schema.tables
WHERE table_name = 'personalizacao_historico';

-- 2. Verificar triggers criados
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname LIKE '%resellers%' OR tgname LIKE '%reseller_products%'
ORDER BY tgname;

-- 3. Testar insert manual (opcional)
INSERT INTO personalizacao_historico (reseller_id, elemento, acao, valor_novo)
VALUES (
  (SELECT id FROM resellers LIMIT 1),
  'logo',
  'criado',
  '{"url": "teste.jpg"}'::jsonb
);

-- 4. Ver se o registro foi inserido
SELECT * FROM personalizacao_historico ORDER BY created_at DESC LIMIT 1;
```

---

## 🎯 Após executar tudo acima

O sistema estará funcionando! Agora você pode:

1. **Acessar o painel:**

   ```
   https://c4franquias.com/admin/personalizacao
   ```

2. **Testar alterando uma loja:**

   ```sql
   -- Alterar logo de teste
   UPDATE resellers
   SET logo_url = 'https://teste-' || NOW()::text || '.jpg'
   WHERE id = (SELECT id FROM resellers LIMIT 1);

   -- Ver se foi registrado
   SELECT * FROM personalizacao_historico
   WHERE elemento = 'logo'
   ORDER BY created_at DESC LIMIT 1;
   ```

---

## 🆘 Se ainda der erro

Cole aqui a mensagem de erro COMPLETA que aparecer e eu te ajudo a resolver!
