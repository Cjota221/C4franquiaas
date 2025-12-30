-- Migration 040: Sistema de Analytics Completo
-- Rastreamento de visualizações, eventos e métricas

-- =============================================
-- TABELA: Visualizações de Página
-- =============================================
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  
  -- Página visitada
  page_path TEXT NOT NULL,
  page_title TEXT,
  page_type TEXT, -- 'catalogo', 'produto', 'checkout', 'admin', 'franqueada', 'landing'
  
  -- Referência
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Dispositivo
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  
  -- Localização (aproximada)
  country TEXT,
  region TEXT,
  city TEXT,
  
  -- Tempo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  time_on_page INTEGER DEFAULT 0 -- em segundos
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_page_views_loja ON page_views(loja_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_type ON page_views(page_type);

-- =============================================
-- TABELA: Visualizações de Produto
-- =============================================
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL,
  
  -- Dados do produto
  produto_nome TEXT,
  produto_categoria TEXT,
  produto_preco DECIMAL(10,2),
  
  -- Contexto
  source TEXT, -- 'catalogo', 'busca', 'relacionados', 'promocao'
  search_query TEXT, -- se veio de busca
  
  -- Dispositivo
  device_type TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_views_produto ON product_views(produto_id);
CREATE INDEX IF NOT EXISTS idx_product_views_loja ON product_views(loja_id);
CREATE INDEX IF NOT EXISTS idx_product_views_created ON product_views(created_at);

-- =============================================
-- TABELA: Eventos do Carrinho
-- =============================================
CREATE TABLE IF NOT EXISTS cart_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  
  -- Evento
  event_type TEXT NOT NULL, -- 'add_to_cart', 'remove_from_cart', 'update_quantity', 'view_cart', 'begin_checkout', 'purchase'
  
  -- Produto (se aplicável)
  produto_id UUID,
  produto_nome TEXT,
  produto_preco DECIMAL(10,2),
  quantidade INTEGER,
  variacao TEXT, -- tamanho/cor
  
  -- Valor total (para checkout/purchase)
  cart_total DECIMAL(10,2),
  cart_items_count INTEGER,
  
  -- Extras
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_events_loja ON cart_events(loja_id);
CREATE INDEX IF NOT EXISTS idx_cart_events_type ON cart_events(event_type);
CREATE INDEX IF NOT EXISTS idx_cart_events_created ON cart_events(created_at);
CREATE INDEX IF NOT EXISTS idx_cart_events_produto ON cart_events(produto_id);

-- =============================================
-- TABELA: Eventos de Busca
-- =============================================
CREATE TABLE IF NOT EXISTS search_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  session_id TEXT NOT NULL,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  
  -- Busca
  search_query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  
  -- Ação após busca
  clicked_product_id UUID,
  clicked_position INTEGER, -- posição do produto clicado nos resultados
  
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_events_loja ON search_events(loja_id);
CREATE INDEX IF NOT EXISTS idx_search_events_query ON search_events(search_query);
CREATE INDEX IF NOT EXISTS idx_search_events_created ON search_events(created_at);

-- =============================================
-- TABELA: Sessões (para agrupar eventos)
-- =============================================
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id TEXT PRIMARY KEY,
  
  -- Identificação
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  
  -- Primeira visita
  first_page TEXT,
  landing_page TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Dispositivo
  device_type TEXT,
  browser TEXT,
  os TEXT,
  
  -- Métricas da sessão
  page_views_count INTEGER DEFAULT 1,
  products_viewed INTEGER DEFAULT 0,
  cart_additions INTEGER DEFAULT 0,
  
  -- Conversão
  converted BOOLEAN DEFAULT FALSE,
  order_id UUID,
  order_total DECIMAL(10,2),
  
  -- Tempo
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_loja ON analytics_sessions(loja_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON analytics_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_converted ON analytics_sessions(converted);

-- =============================================
-- VIEW: Resumo diário por loja
-- =============================================
CREATE OR REPLACE VIEW analytics_daily_summary AS
SELECT 
  DATE(pv.created_at) as data,
  pv.loja_id,
  l.nome as loja_nome,
  l.dominio,
  
  -- Métricas de visualização
  COUNT(DISTINCT pv.id) as page_views,
  COUNT(DISTINCT pv.session_id) as sessoes,
  COUNT(DISTINCT CASE WHEN pv.device_type = 'mobile' THEN pv.session_id END) as sessoes_mobile,
  COUNT(DISTINCT CASE WHEN pv.device_type = 'desktop' THEN pv.session_id END) as sessoes_desktop

FROM page_views pv
LEFT JOIN lojas l ON l.id = pv.loja_id
GROUP BY DATE(pv.created_at), pv.loja_id, l.nome, l.dominio
ORDER BY data DESC, page_views DESC;

-- =============================================
-- VIEW: Produtos mais visualizados
-- =============================================
CREATE OR REPLACE VIEW analytics_top_products AS
SELECT 
  pv.produto_id,
  pv.produto_nome,
  pv.loja_id,
  COUNT(*) as visualizacoes,
  COUNT(DISTINCT pv.session_id) as visitantes_unicos,
  COALESCE(ce.adicoes_carrinho, 0) as adicoes_carrinho
FROM product_views pv
LEFT JOIN (
  SELECT produto_id, COUNT(*) as adicoes_carrinho
  FROM cart_events 
  WHERE event_type = 'add_to_cart'
  GROUP BY produto_id
) ce ON ce.produto_id = pv.produto_id
WHERE pv.created_at >= NOW() - INTERVAL '30 days'
GROUP BY pv.produto_id, pv.produto_nome, pv.loja_id, ce.adicoes_carrinho
ORDER BY visualizacoes DESC;

-- =============================================
-- VIEW: Ranking de lojas
-- =============================================
CREATE OR REPLACE VIEW analytics_store_ranking AS
SELECT 
  l.id as loja_id,
  l.nome as loja_nome,
  l.dominio,
  
  -- Visualizações (últimos 30 dias)
  COALESCE(pv_count.total, 0) as page_views_total,
  COALESCE(pv_count.sessoes, 0) as sessoes_total,
  
  -- Produtos visualizados
  COALESCE(prod_count.total, 0) as produtos_visualizados,
  
  -- Conversões
  COALESCE(cart_add.total, 0) as adicoes_carrinho,
  COALESCE(cart_purchase.total, 0) as vendas

FROM lojas l
LEFT JOIN (
  SELECT loja_id, COUNT(*) as total, COUNT(DISTINCT session_id) as sessoes
  FROM page_views 
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY loja_id
) pv_count ON pv_count.loja_id = l.id
LEFT JOIN (
  SELECT loja_id, COUNT(DISTINCT produto_id) as total
  FROM product_views 
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY loja_id
) prod_count ON prod_count.loja_id = l.id
LEFT JOIN (
  SELECT loja_id, COUNT(*) as total
  FROM cart_events 
  WHERE event_type = 'add_to_cart' AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY loja_id
) cart_add ON cart_add.loja_id = l.id
LEFT JOIN (
  SELECT loja_id, COUNT(*) as total
  FROM cart_events 
  WHERE event_type = 'purchase' AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY loja_id
) cart_purchase ON cart_purchase.loja_id = l.id
WHERE l.ativa = true
ORDER BY page_views_total DESC;

-- =============================================
-- VIEW: Termos mais buscados
-- =============================================
CREATE OR REPLACE VIEW analytics_top_searches AS
SELECT 
  search_query,
  loja_id,
  COUNT(*) as total_buscas,
  AVG(results_count) as media_resultados,
  COUNT(clicked_product_id) as cliques,
  ROUND(COUNT(clicked_product_id)::numeric / COUNT(*) * 100, 2) as taxa_clique
FROM search_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY search_query, loja_id
ORDER BY total_buscas DESC;

-- =============================================
-- Políticas RLS
-- =============================================
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT para todos (tracking anônimo)
CREATE POLICY "Permitir insert analytics" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir insert product_views" ON product_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir insert cart_events" ON cart_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir insert search_events" ON search_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir insert sessions" ON analytics_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir update sessions" ON analytics_sessions FOR UPDATE USING (true);

-- Admin pode ver tudo
CREATE POLICY "Admin pode ver page_views" ON page_views FOR SELECT 
  USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY "Admin pode ver product_views" ON product_views FOR SELECT 
  USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY "Admin pode ver cart_events" ON cart_events FOR SELECT 
  USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY "Admin pode ver search_events" ON search_events FOR SELECT 
  USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY "Admin pode ver sessions" ON analytics_sessions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'));

-- Franqueada pode ver analytics da própria loja
CREATE POLICY "Franqueada pode ver page_views da loja" ON page_views FOR SELECT 
  USING (loja_id IN (SELECT id FROM lojas WHERE user_id = auth.uid()));
CREATE POLICY "Franqueada pode ver product_views da loja" ON product_views FOR SELECT 
  USING (loja_id IN (SELECT id FROM lojas WHERE user_id = auth.uid()));
CREATE POLICY "Franqueada pode ver cart_events da loja" ON cart_events FOR SELECT 
  USING (loja_id IN (SELECT id FROM lojas WHERE user_id = auth.uid()));
CREATE POLICY "Franqueada pode ver search_events da loja" ON search_events FOR SELECT 
  USING (loja_id IN (SELECT id FROM lojas WHERE user_id = auth.uid()));
CREATE POLICY "Franqueada pode ver sessions da loja" ON analytics_sessions FOR SELECT 
  USING (loja_id IN (SELECT id FROM lojas WHERE user_id = auth.uid()));

COMMENT ON TABLE page_views IS 'Visualizações de páginas para analytics';
COMMENT ON TABLE product_views IS 'Visualizações de produtos específicos';
COMMENT ON TABLE cart_events IS 'Eventos relacionados ao carrinho de compras';
COMMENT ON TABLE search_events IS 'Buscas realizadas nas lojas';
COMMENT ON TABLE analytics_sessions IS 'Sessões de usuários para agrupamento de eventos';
