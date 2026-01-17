-- =============================================
-- Migration 068: Sistema de Notificações de Novidades (Changelog)
-- =============================================

-- 1. Tabela principal de notificações do sistema
CREATE TABLE IF NOT EXISTS system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'feature' CHECK (type IN ('feature', 'fix', 'alert', 'improvement')),
  image_url TEXT,
  high_priority BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'resellers', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela para rastrear quais notificações o usuário já leu
CREATE TABLE IF NOT EXISTS user_read_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES system_notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed_popup BOOLEAN DEFAULT FALSE, -- Se o usuário fechou o popup (para high_priority)
  UNIQUE(user_id, notification_id)
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_system_notifications_active ON system_notifications(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_notifications_priority ON system_notifications(high_priority, is_active);
CREATE INDEX IF NOT EXISTS idx_user_read_notifications_user ON user_read_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_read_notifications_notification ON user_read_notifications(notification_id);

-- 4. RLS Policies
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_read_notifications ENABLE ROW LEVEL SECURITY;

-- Todos podem ler notificações ativas
CREATE POLICY "Anyone can read active notifications" ON system_notifications
  FOR SELECT USING (is_active = true);

-- Usuários autenticados podem gerenciar suas próprias leituras
CREATE POLICY "Users can manage their own read notifications" ON user_read_notifications
  FOR ALL USING (auth.uid() = user_id);

-- 5. Função para obter notificações não lidas de um usuário
CREATE OR REPLACE FUNCTION get_unread_notifications(p_user_id UUID, p_audience VARCHAR DEFAULT 'all')
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  type VARCHAR,
  image_url TEXT,
  high_priority BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sn.id,
    sn.title,
    sn.description,
    sn.type,
    sn.image_url,
    sn.high_priority,
    sn.created_at
  FROM system_notifications sn
  LEFT JOIN user_read_notifications urn 
    ON sn.id = urn.notification_id AND urn.user_id = p_user_id
  WHERE sn.is_active = true
    AND (sn.target_audience = 'all' OR sn.target_audience = p_audience)
    AND urn.id IS NULL
  ORDER BY sn.high_priority DESC, sn.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para obter notificações high_priority não vistas (para popup)
CREATE OR REPLACE FUNCTION get_unseen_priority_notifications(p_user_id UUID, p_audience VARCHAR DEFAULT 'all')
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  type VARCHAR,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sn.id,
    sn.title,
    sn.description,
    sn.type,
    sn.image_url,
    sn.created_at
  FROM system_notifications sn
  LEFT JOIN user_read_notifications urn 
    ON sn.id = urn.notification_id AND urn.user_id = p_user_id
  WHERE sn.is_active = true
    AND sn.high_priority = true
    AND (sn.target_audience = 'all' OR sn.target_audience = p_audience)
    AND (urn.id IS NULL OR urn.dismissed_popup = false)
  ORDER BY sn.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Inserir algumas notificações de exemplo
INSERT INTO system_notifications (title, description, type, high_priority, target_audience) VALUES
('🎉 Sistema de Pedido Mínimo', 'Agora você pode definir um valor ou quantidade mínima para os pedidos na sua loja! Acesse Configurações para ativar.', 'feature', true, 'resellers'),
('🔔 Melhorias no Carrinho', 'O carrinho agora mostra o progresso do pedido mínimo com uma barra visual.', 'improvement', false, 'resellers'),
('🐛 Correção de Bug', 'Corrigimos um problema onde os filtros de tamanho estavam sendo cortados.', 'fix', false, 'all');

-- 8. Comentários nas tabelas
COMMENT ON TABLE system_notifications IS 'Notificações de novidades do sistema (changelog)';
COMMENT ON TABLE user_read_notifications IS 'Registro de notificações lidas por cada usuário';
COMMENT ON COLUMN system_notifications.type IS 'Tipo: feature (nova funcionalidade), fix (correção), alert (alerta), improvement (melhoria)';
COMMENT ON COLUMN system_notifications.high_priority IS 'Se true, mostra popup automático ao logar';
COMMENT ON COLUMN system_notifications.target_audience IS 'Público alvo: all (todos), resellers (revendedoras), admin (administradores)';
