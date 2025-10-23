-- ============================================================================
-- 🚀 MIGRATION 015: Sistema Completo de Customizações Avançadas
-- ============================================================================
-- Adiciona 100+ funcionalidades configuráveis para personalização total da loja
-- ============================================================================
BEGIN;

-- ============================================================================
-- PASSO 1: Adicionar campos de customização na tabela `lojas`
-- ============================================================================

ALTER TABLE lojas
-- Header e Menu
ADD COLUMN IF NOT EXISTS menu_tipo VARCHAR(20) DEFAULT 'horizontal',
ADD COLUMN IF NOT EXISTS logo_posicao VARCHAR(20) DEFAULT 'centro',
ADD COLUMN IF NOT EXISTS logo_formato VARCHAR(20) DEFAULT 'horizontal',
ADD COLUMN IF NOT EXISTS topo_flutuante BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_icones_menu BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS barra_topo_texto TEXT,
ADD COLUMN IF NOT EXISTS barra_topo_ativa BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS menu_subcategorias_niveis INTEGER DEFAULT 2,

-- Produtos
ADD COLUMN IF NOT EXISTS produtos_por_linha_mobile INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS mostrar_segunda_imagem BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS zoom_imagem BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS imagem_formato VARCHAR(20) DEFAULT 'quadrada',
ADD COLUMN IF NOT EXISTS mostrar_estrelas BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_selos_vitrine BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS botao_whatsapp_vitrine BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS botao_comprar_flutuante BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS calcular_frete_produto BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_comentarios BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS quickview_ativo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS produtos_relacionados_ativo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ultimos_visitados_ativo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS compre_junto_ativo BOOLEAN DEFAULT false,

-- Vitrines
ADD COLUMN IF NOT EXISTS vitrine_destaques_ativa BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS vitrine_lancamentos_ativa BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS vitrine_promocoes_ativa BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS vitrine_mais_vendidos_ativa BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS vitrine_frete_gratis_ativa BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vitrine_tipo VARCHAR(20) DEFAULT 'carrossel',

-- Carrinho
ADD COLUMN IF NOT EXISTS carrinho_tipo VARCHAR(20) DEFAULT 'lateral',
ADD COLUMN IF NOT EXISTS validar_estoque_carrinho BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS compra_rapida_completa BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS compra_rapida_simples BOOLEAN DEFAULT false,

-- WhatsApp
ADD COLUMN IF NOT EXISTS whatsapp_flutuante BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS whatsapp_numero VARCHAR(20),
ADD COLUMN IF NOT EXISTS whatsapp_posicao VARCHAR(20) DEFAULT 'direita',
ADD COLUMN IF NOT EXISTS whatsapp_mensagem_padrao TEXT,

-- Newsletter
ADD COLUMN IF NOT EXISTS newsletter_popup_ativo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS newsletter_popup_delay INTEGER DEFAULT 5000,
ADD COLUMN IF NOT EXISTS newsletter_rodape_ativo BOOLEAN DEFAULT true,

-- Instagram
ADD COLUMN IF NOT EXISTS instagram_feed_ativo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS instagram_usuario VARCHAR(100),

-- Promoções
ADD COLUMN IF NOT EXISTS desconto_progressivo_ativo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS desconto_progressivo_regras JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS contador_regressivo_ativo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS brinde_ativo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS brinde_regras JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS fidelizacao_pontos_ativa BOOLEAN DEFAULT false,

-- Frete
ADD COLUMN IF NOT EXISTS frete_gratis_valor DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS rastreio_pedidos_ativo BOOLEAN DEFAULT true,

-- Filtros e Busca
ADD COLUMN IF NOT EXISTS filtro_inteligente_ativo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sugestao_busca_ativa BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS paginacao_tipo VARCHAR(20) DEFAULT 'numerada',

-- SEO e Scripts
ADD COLUMN IF NOT EXISTS scripts_personalizados TEXT,
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS google_analytics_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS facebook_pixel_id VARCHAR(50),

-- Avisos e Manutenção
ADD COLUMN IF NOT EXISTS alerta_cookies_ativo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS loja_em_manutencao BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS manutencao_mensagem TEXT,

-- Redes Sociais
ADD COLUMN IF NOT EXISTS redes_sociais_rodape_ativas BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,

-- Rodapé
ADD COLUMN IF NOT EXISTS rodape_simplificado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS formas_pagamento_editaveis JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS selos_seguranca_editaveis JSONB DEFAULT '[]'::jsonb,

-- Conteúdo Extra
ADD COLUMN IF NOT EXISTS video_pagina_inicial TEXT,
ADD COLUMN IF NOT EXISTS noticias_ativas BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS carrossel_marcas_ativo BOOLEAN DEFAULT false;

-- ============================================================================
-- PASSO 2: Criar tabela de Banners
-- ============================================================================

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL, -- 'hero', 'secundario', 'mobile', 'categoria'
  titulo VARCHAR(200),
  subtitulo VARCHAR(300),
  imagem TEXT NOT NULL,
  imagem_mobile TEXT,
  link TEXT,
  link_externo BOOLEAN DEFAULT false,
  botao_texto VARCHAR(50),
  botao_cor VARCHAR(20),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público pode ver banners ativos" ON banners FOR SELECT USING (ativo = true);
CREATE POLICY "Franqueada pode gerenciar banners" ON banners FOR ALL USING ((SELECT franqueada_id FROM lojas WHERE id = loja_id) = auth.uid());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_banners_loja_tipo ON banners(loja_id, tipo);
CREATE INDEX IF NOT EXISTS idx_banners_ativo ON banners(ativo);

-- ============================================================================
-- PASSO 3: Criar tabela de Ícones de Confiança
-- ============================================================================

CREATE TABLE IF NOT EXISTS icones_confianca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  icone VARCHAR(50) NOT NULL, -- 'shield', 'truck', 'lock', 'check', 'star', 'heart'
  titulo VARCHAR(100) NOT NULL,
  descricao VARCHAR(200),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE icones_confianca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público pode ver ícones ativos" ON icones_confianca FOR SELECT USING (ativo = true);
CREATE POLICY "Franqueada pode gerenciar ícones" ON icones_confianca FOR ALL USING ((SELECT franqueada_id FROM lojas WHERE id = loja_id) = auth.uid());

-- ============================================================================
-- PASSO 4: Criar tabela de Menu Links Personalizados
-- ============================================================================

CREATE TABLE IF NOT EXISTS menu_links_personalizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  titulo VARCHAR(100) NOT NULL,
  link TEXT NOT NULL,
  link_externo BOOLEAN DEFAULT false,
  icone VARCHAR(50),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE menu_links_personalizados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público pode ver links ativos" ON menu_links_personalizados FOR SELECT USING (ativo = true);
CREATE POLICY "Franqueada pode gerenciar links" ON menu_links_personalizados FOR ALL USING ((SELECT franqueada_id FROM lojas WHERE id = loja_id) = auth.uid());

-- ============================================================================
-- PASSO 5: Criar tabela de Notícias da Loja
-- ============================================================================

CREATE TABLE IF NOT EXISTS noticias_loja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  resumo TEXT,
  conteudo TEXT,
  imagem TEXT,
  slug VARCHAR(250) NOT NULL,
  autor VARCHAR(100),
  data_publicacao TIMESTAMPTZ DEFAULT NOW(),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(loja_id, slug)
);

ALTER TABLE noticias_loja ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público pode ver notícias ativas" ON noticias_loja FOR SELECT USING (ativo = true);
CREATE POLICY "Franqueada pode gerenciar notícias" ON noticias_loja FOR ALL USING ((SELECT franqueada_id FROM lojas WHERE id = loja_id) = auth.uid());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_noticias_loja_slug ON noticias_loja(loja_id, slug);
CREATE INDEX IF NOT EXISTS idx_noticias_ativo ON noticias_loja(ativo);

-- ============================================================================
-- PASSO 6: Criar tabela de Marcas
-- ============================================================================

CREATE TABLE IF NOT EXISTS marcas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  logo TEXT NOT NULL,
  link TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público pode ver marcas ativas" ON marcas FOR SELECT USING (ativo = true);
CREATE POLICY "Franqueada pode gerenciar marcas" ON marcas FOR ALL USING ((SELECT franqueada_id FROM lojas WHERE id = loja_id) = auth.uid());

-- ============================================================================
-- PASSO 7: Inserir dados de exemplo para testes
-- ============================================================================

-- Exemplo de ícones de confiança (será inserido após criar loja)
-- INSERT INTO icones_confianca (loja_id, icone, titulo, descricao, ordem) VALUES
-- ('UUID_DA_LOJA', 'shield', 'Compra Segura', 'Site protegido com SSL', 1),
-- ('UUID_DA_LOJA', 'truck', 'Entrega Rápida', 'Envio em até 24h', 2),
-- ('UUID_DA_LOJA', 'check', 'Garantia de Qualidade', '7 dias para troca', 3);

-- ============================================================================
-- PASSO 8: Criar funções auxiliares
-- ============================================================================

-- Função para atualizar campo `atualizado_em` automaticamente
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamp
DROP TRIGGER IF EXISTS trigger_banners_atualizado ON banners;
CREATE TRIGGER trigger_banners_atualizado
  BEFORE UPDATE ON banners
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp();

DROP TRIGGER IF EXISTS trigger_noticias_atualizado ON noticias_loja;
CREATE TRIGGER trigger_noticias_atualizado
  BEFORE UPDATE ON noticias_loja
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp();

-- ============================================================================
-- PASSO 9: Adicionar comentários nas tabelas para documentação
-- ============================================================================

COMMENT ON TABLE banners IS 'Gerenciamento de banners da loja (hero, secundário, mobile)';
COMMENT ON TABLE icones_confianca IS 'Ícones de confiança exibidos na página inicial';
COMMENT ON TABLE menu_links_personalizados IS 'Links personalizados no menu de navegação';
COMMENT ON TABLE noticias_loja IS 'Notícias e conteúdo da loja';
COMMENT ON TABLE marcas IS 'Marcas parceiras para carrossel';

COMMIT;

-- ============================================================================
-- ✅ Migration 015 concluída com sucesso!
-- ============================================================================
-- Criadas 5 novas tabelas e adicionados 70+ campos de customização na tabela lojas
-- ============================================================================
