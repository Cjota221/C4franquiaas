# Aplicar Migration 036 - Personalização de Revendedoras

Execute no Supabase SQL Editor:

```sql
-- ============================================================================
-- Migration 036: Campos de Personalização para Revendedoras
-- ============================================================================

-- Adicionar campos de personalização
ALTER TABLE resellers 
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS banner_mobile_url TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{
  "button_style": "rounded",
  "card_style": "shadow",
  "header_style": "gradient",
  "show_prices": true,
  "show_stock": false,
  "show_whatsapp_float": true
}'::jsonb;

-- Atualizar registros existentes com theme_settings padrão
UPDATE resellers 
SET theme_settings = '{
  "button_style": "rounded",
  "card_style": "shadow",
  "header_style": "gradient",
  "show_prices": true,
  "show_stock": false,
  "show_whatsapp_float": true
}'::jsonb
WHERE theme_settings IS NULL;

-- ============================================================================
-- Criar Bucket para imagens das revendedoras
-- ============================================================================

-- Criar o bucket (público para as imagens serem acessíveis)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reseller-assets', 
  'reseller-assets', 
  true,
  5242880, -- 5MB limite
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Política: Permitir upload para usuários autenticados
CREATE POLICY "reseller_assets_insert" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'reseller-assets');

-- Política: Permitir leitura pública (para exibir as imagens)
CREATE POLICY "reseller_assets_select" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'reseller-assets');

-- Política: Permitir update para usuários autenticados
CREATE POLICY "reseller_assets_update" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'reseller-assets');

-- Política: Permitir delete para usuários autenticados
CREATE POLICY "reseller_assets_delete" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'reseller-assets');
```

## Testar

1. Acesse `/revendedora/personalizacao`
2. Faça upload de uma logo
3. Veja se aparece no catálogo!
