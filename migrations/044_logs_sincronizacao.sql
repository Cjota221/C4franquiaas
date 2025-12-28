-- Migration 044: Criar/Atualizar tabela logs_sincronizacao
-- Data: 2024-12-28

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS logs_sincronizacao (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tipo TEXT,
  descricao TEXT,
  produto_id UUID,
  facilzap_id TEXT,
  payload JSONB,
  sucesso BOOLEAN DEFAULT true,
  erro TEXT
);

-- Adicionar colunas que podem estar faltando (se a tabela já existir)
DO $$
BEGIN
  -- Adicionar created_at se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'logs_sincronizacao' AND column_name = 'created_at') THEN
    ALTER TABLE logs_sincronizacao ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- Adicionar descricao se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'logs_sincronizacao' AND column_name = 'descricao') THEN
    ALTER TABLE logs_sincronizacao ADD COLUMN descricao TEXT;
  END IF;
  
  -- Adicionar produto_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'logs_sincronizacao' AND column_name = 'produto_id') THEN
    ALTER TABLE logs_sincronizacao ADD COLUMN produto_id UUID;
  END IF;
  
  -- Adicionar facilzap_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'logs_sincronizacao' AND column_name = 'facilzap_id') THEN
    ALTER TABLE logs_sincronizacao ADD COLUMN facilzap_id TEXT;
  END IF;
  
  -- Adicionar payload se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'logs_sincronizacao' AND column_name = 'payload') THEN
    ALTER TABLE logs_sincronizacao ADD COLUMN payload JSONB;
  END IF;
  
  -- Adicionar sucesso se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'logs_sincronizacao' AND column_name = 'sucesso') THEN
    ALTER TABLE logs_sincronizacao ADD COLUMN sucesso BOOLEAN DEFAULT true;
  END IF;
  
  -- Adicionar erro se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'logs_sincronizacao' AND column_name = 'erro') THEN
    ALTER TABLE logs_sincronizacao ADD COLUMN erro TEXT;
  END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_logs_sincronizacao_created_at ON logs_sincronizacao(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_sincronizacao_tipo ON logs_sincronizacao(tipo);
CREATE INDEX IF NOT EXISTS idx_logs_sincronizacao_produto_id ON logs_sincronizacao(produto_id);

-- Comentários
COMMENT ON TABLE logs_sincronizacao IS 'Logs de sincronização com FacilZap e webhooks';
