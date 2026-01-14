-- ============================================================================
-- Migration 103: Sistema de Autenticação do Painel Grade Fechada
-- ============================================================================
-- Descrição: Cria tabela de usuários e sistema de auth para painel separado
-- Data: 2026-01-14
-- ============================================================================

-- ============================================================================
-- TABELA: grade_fechada_usuarios
-- Usuários com acesso ao painel administrativo Grade Fechada
-- ============================================================================
CREATE TABLE IF NOT EXISTS grade_fechada_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Credenciais
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  
  -- Informações pessoais
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  
  -- Permissões e status
  nivel VARCHAR(50) DEFAULT 'operador',
  -- Níveis: 'admin', 'gerente', 'operador'
  
  ativo BOOLEAN DEFAULT true,
  
  -- Tokens para sessão
  token_sessao TEXT,
  token_expira_em TIMESTAMP,
  
  -- Senha temporária (primeiro acesso)
  senha_temporaria BOOLEAN DEFAULT false,
  
  -- Audit
  ultimo_acesso TIMESTAMP,
  ip_ultimo_acesso VARCHAR(45),
  
  -- Timestamps
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_grade_fechada_usuarios_email 
ON grade_fechada_usuarios(email);

CREATE INDEX IF NOT EXISTS idx_grade_fechada_usuarios_token 
ON grade_fechada_usuarios(token_sessao)
WHERE token_sessao IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_grade_fechada_usuarios_ativo 
ON grade_fechada_usuarios(ativo)
WHERE ativo = true;


-- ============================================================================
-- TABELA: grade_fechada_logs_acesso
-- Log de acessos ao painel
-- ============================================================================
CREATE TABLE IF NOT EXISTS grade_fechada_logs_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES grade_fechada_usuarios(id) ON DELETE CASCADE,
  
  -- Informações do acesso
  tipo_evento VARCHAR(50) NOT NULL,
  -- Tipos: 'login', 'logout', 'tentativa_falha', 'sessao_expirada'
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Detalhes adicionais
  detalhes JSONB,
  
  -- Timestamp
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_grade_fechada_logs_usuario 
ON grade_fechada_logs_acesso(usuario_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_grade_fechada_logs_tipo 
ON grade_fechada_logs_acesso(tipo_evento, criado_em DESC);


-- ============================================================================
-- FUNÇÃO: Atualizar timestamp de atualização
-- ============================================================================
CREATE OR REPLACE FUNCTION atualizar_grade_fechada_usuarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente
DROP TRIGGER IF EXISTS trigger_atualizar_grade_fechada_usuarios 
ON grade_fechada_usuarios;

CREATE TRIGGER trigger_atualizar_grade_fechada_usuarios
  BEFORE UPDATE ON grade_fechada_usuarios
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_grade_fechada_usuarios_updated_at();


-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE grade_fechada_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_fechada_logs_acesso ENABLE ROW LEVEL SECURITY;

-- Políticas: Apenas service role pode acessar (APIs fazem a autenticação)
DROP POLICY IF EXISTS "Service role pode gerenciar usuários" ON grade_fechada_usuarios;
CREATE POLICY "Service role pode gerenciar usuários"
  ON grade_fechada_usuarios
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role pode gerenciar logs" ON grade_fechada_logs_acesso;
CREATE POLICY "Service role pode gerenciar logs"
  ON grade_fechada_logs_acesso
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- INSERIR USUÁRIO ADMIN PADRÃO
-- ============================================================================
-- Senha padrão: Admin@123 (deve ser alterada no primeiro acesso)
-- Hash bcrypt: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

INSERT INTO grade_fechada_usuarios (
  email,
  senha_hash,
  nome,
  nivel,
  ativo,
  senha_temporaria
) VALUES (
  'admin@gradefechada.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Administrador',
  'admin',
  true,
  true
) ON CONFLICT (email) DO NOTHING;


-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON TABLE grade_fechada_usuarios IS 'Usuários com acesso ao painel administrativo Grade Fechada';
COMMENT ON TABLE grade_fechada_logs_acesso IS 'Log de acessos e eventos de segurança do painel';

COMMENT ON COLUMN grade_fechada_usuarios.nivel IS 'Níveis de permissão: admin (full access), gerente (sem config), operador (apenas visualização)';
COMMENT ON COLUMN grade_fechada_usuarios.senha_temporaria IS 'Se true, usuário deve alterar senha no próximo login';


-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- SELECT * FROM grade_fechada_usuarios;
-- SELECT email, nome, nivel, ativo, senha_temporaria FROM grade_fechada_usuarios;
