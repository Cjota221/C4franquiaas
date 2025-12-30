-- Funções RPC para incrementar contadores de sessão
-- Execute no Supabase SQL Editor

-- Incrementar page views da sessão
CREATE OR REPLACE FUNCTION increment_session_page_views(session_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE analytics_sessions 
  SET page_views_count = page_views_count + 1,
      last_activity_at = NOW()
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrementar produtos visualizados da sessão
CREATE OR REPLACE FUNCTION increment_session_products_viewed(session_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE analytics_sessions 
  SET products_viewed = products_viewed + 1,
      last_activity_at = NOW()
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrementar adições ao carrinho da sessão
CREATE OR REPLACE FUNCTION increment_session_cart_additions(session_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE analytics_sessions 
  SET cart_additions = cart_additions + 1,
      last_activity_at = NOW()
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION increment_session_page_views(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_session_products_viewed(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_session_cart_additions(TEXT) TO anon, authenticated;
