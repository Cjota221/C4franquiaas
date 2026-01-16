-- ============================================
-- 🎯 CONFIGURAR META PIXEL (FACEBOOK ADS)
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Verificar se a coluna já existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lojas' 
AND column_name IN ('facebook_pixel', 'google_analytics');

-- 2. Adicionar coluna se não existir (provavelmente já existe)
ALTER TABLE lojas 
ADD COLUMN IF NOT EXISTS facebook_pixel VARCHAR(50),
ADD COLUMN IF NOT EXISTS google_analytics VARCHAR(50);

-- 3. Comentários
COMMENT ON COLUMN lojas.facebook_pixel IS 'ID do Meta Pixel (Facebook Ads) - Ex: 123456789012345';
COMMENT ON COLUMN lojas.google_analytics IS 'ID do Google Analytics 4 - Ex: G-XXXXXXXXXX';

-- ============================================
-- 🎯 CONFIGURAR PIXEL PARA UMA LOJA ESPECÍFICA
-- Substitua os valores abaixo:
-- ============================================

-- Exemplo: Configurar pixel para loja "minha-loja"
-- UPDATE lojas 
-- SET facebook_pixel = 'SEU_PIXEL_ID_AQUI'
-- WHERE slug = 'minha-loja';

-- ============================================
-- 📊 COMO OBTER O PIXEL ID:
-- ============================================
-- 1. Acesse: https://business.facebook.com/events_manager2
-- 2. Clique em "Conectar fontes de dados"
-- 3. Selecione "Web"
-- 4. Escolha "Meta Pixel"
-- 5. Nomeie o pixel (ex: "Loja C4 - Nome da Revendedora")
-- 6. Copie o ID do Pixel (número de 15-16 dígitos)
-- 7. Cole no comando UPDATE acima

-- ============================================
-- 📊 EVENTOS QUE SERÃO RASTREADOS:
-- ============================================
-- ✅ PageView (automático em todas as páginas)
-- ✅ ViewContent (visualização de produto)
-- ✅ AddToCart (adicionar ao carrinho)
-- ✅ InitiateCheckout (finalizar via WhatsApp)
-- ✅ Search (busca de produtos)
-- ✅ Contact (clique no WhatsApp)

-- ============================================
-- 🔥 CONFIGURAR PIXEL PARA TODAS AS LOJAS DE UMA VEZ
-- (Use com cuidado - apenas se TODAS usarem o mesmo pixel)
-- ============================================
-- UPDATE lojas 
-- SET facebook_pixel = 'SEU_PIXEL_ID_MASTER'
-- WHERE ativo = true AND facebook_pixel IS NULL;

-- ============================================
-- 📊 VERIFICAR LOJAS COM PIXEL CONFIGURADO
-- ============================================
SELECT 
  id,
  nome,
  slug,
  facebook_pixel,
  google_analytics,
  ativo
FROM lojas
WHERE ativo = true
ORDER BY nome;
