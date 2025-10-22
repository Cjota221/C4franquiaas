-- Migration 013: Painel de Customização Avançado
-- Data: 22 de outubro de 2025
-- Descrição: Adiciona campos para customização completa da loja

BEGIN;

-- Adicionar novos campos na tabela lojas
ALTER TABLE lojas
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS slogan VARCHAR(255),
ADD COLUMN IF NOT EXISTS banner_hero TEXT,
ADD COLUMN IF NOT EXISTS texto_hero VARCHAR(255),
ADD COLUMN IF NOT EXISTS subtexto_hero TEXT,
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
ADD COLUMN IF NOT EXISTS instagram VARCHAR(100),
ADD COLUMN IF NOT EXISTS facebook VARCHAR(100),
ADD COLUMN IF NOT EXISTS email_contato VARCHAR(255),
ADD COLUMN IF NOT EXISTS telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS favicon TEXT,
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS google_analytics VARCHAR(50),
ADD COLUMN IF NOT EXISTS facebook_pixel VARCHAR(50),
ADD COLUMN IF NOT EXISTS fonte_principal VARCHAR(100) DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS fonte_secundaria VARCHAR(100) DEFAULT 'Poppins',
ADD COLUMN IF NOT EXISTS cor_texto VARCHAR(7) DEFAULT '#1F2937',
ADD COLUMN IF NOT EXISTS cor_fundo VARCHAR(7) DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS cor_botao VARCHAR(7),
ADD COLUMN IF NOT EXISTS cor_botao_hover VARCHAR(7),
ADD COLUMN IF NOT EXISTS cor_link VARCHAR(7) DEFAULT '#2563EB',
ADD COLUMN IF NOT EXISTS mostrar_estoque BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_codigo_barras BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS permitir_carrinho BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS modo_catalogo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mensagem_whatsapp TEXT DEFAULT 'Olá! Gostaria de saber mais sobre este produto:';

-- Adicionar comentários
COMMENT ON COLUMN lojas.descricao IS 'Descrição da loja exibida no site';
COMMENT ON COLUMN lojas.slogan IS 'Slogan da loja';
COMMENT ON COLUMN lojas.banner_hero IS 'URL da imagem do banner principal';
COMMENT ON COLUMN lojas.texto_hero IS 'Título principal do banner';
COMMENT ON COLUMN lojas.subtexto_hero IS 'Subtítulo do banner';
COMMENT ON COLUMN lojas.whatsapp IS 'Número de WhatsApp para contato';
COMMENT ON COLUMN lojas.instagram IS 'Perfil do Instagram (@usuario)';
COMMENT ON COLUMN lojas.facebook IS 'URL da página do Facebook';
COMMENT ON COLUMN lojas.email_contato IS 'Email de contato da loja';
COMMENT ON COLUMN lojas.telefone IS 'Telefone de contato';
COMMENT ON COLUMN lojas.endereco IS 'Endereço completo da loja';
COMMENT ON COLUMN lojas.favicon IS 'URL do favicon da loja';
COMMENT ON COLUMN lojas.meta_title IS 'Meta title para SEO';
COMMENT ON COLUMN lojas.meta_description IS 'Meta description para SEO';
COMMENT ON COLUMN lojas.google_analytics IS 'ID do Google Analytics';
COMMENT ON COLUMN lojas.facebook_pixel IS 'ID do Facebook Pixel';
COMMENT ON COLUMN lojas.fonte_principal IS 'Fonte principal do site';
COMMENT ON COLUMN lojas.fonte_secundaria IS 'Fonte secundária do site';
COMMENT ON COLUMN lojas.cor_texto IS 'Cor principal do texto';
COMMENT ON COLUMN lojas.cor_fundo IS 'Cor de fundo do site';
COMMENT ON COLUMN lojas.cor_botao IS 'Cor dos botões';
COMMENT ON COLUMN lojas.cor_botao_hover IS 'Cor dos botões ao passar o mouse';
COMMENT ON COLUMN lojas.cor_link IS 'Cor dos links';
COMMENT ON COLUMN lojas.mostrar_estoque IS 'Exibir quantidade em estoque';
COMMENT ON COLUMN lojas.mostrar_codigo_barras IS 'Exibir código de barras dos produtos';
COMMENT ON COLUMN lojas.permitir_carrinho IS 'Permitir adicionar produtos ao carrinho';
COMMENT ON COLUMN lojas.modo_catalogo IS 'Modo catálogo (vendas via WhatsApp)';
COMMENT ON COLUMN lojas.mensagem_whatsapp IS 'Mensagem padrão para WhatsApp';

COMMIT;

-- Verificar campos adicionados
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'lojas' 
  AND column_name IN (
    'descricao', 'slogan', 'banner_hero', 'texto_hero', 'subtexto_hero',
    'whatsapp', 'instagram', 'facebook', 'email_contato', 'telefone',
    'endereco', 'favicon', 'meta_title', 'meta_description',
    'google_analytics', 'facebook_pixel', 'fonte_principal', 'fonte_secundaria',
    'cor_texto', 'cor_fundo', 'cor_botao', 'cor_botao_hover', 'cor_link',
    'mostrar_estoque', 'mostrar_codigo_barras', 'permitir_carrinho',
    'modo_catalogo', 'mensagem_whatsapp'
  )
ORDER BY column_name;
