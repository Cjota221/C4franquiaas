-- Migration 029: Criar tabela para configuração do Melhor Envio
-- Data: 2025-01-XX
-- Descrição: Armazena tokens OAuth e configurações da integração com Melhor Envio

-- Criar tabela de configuração do Melhor Envio
CREATE TABLE IF NOT EXISTS config_melhorenvio (
  id INTEGER PRIMARY KEY DEFAULT 1,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_in INTEGER,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir que só existe uma linha
  CONSTRAINT single_row CHECK (id = 1)
);

-- Comentários
COMMENT ON TABLE config_melhorenvio IS 'Armazena tokens OAuth do Melhor Envio';
COMMENT ON COLUMN config_melhorenvio.access_token IS 'Token de acesso OAuth (válido por tempo limitado)';
COMMENT ON COLUMN config_melhorenvio.refresh_token IS 'Token para renovar o access_token';
COMMENT ON COLUMN config_melhorenvio.expires_at IS 'Data/hora de expiração do access_token';

-- Índices
CREATE INDEX IF NOT EXISTS idx_melhorenvio_expires ON config_melhorenvio(expires_at);

-- Inserir linha padrão (vazia, será preenchida após autorização OAuth)
INSERT INTO config_melhorenvio (id, access_token, refresh_token)
VALUES (1, '', '')
ON CONFLICT (id) DO NOTHING;
