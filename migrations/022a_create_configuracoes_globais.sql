-- Migration 022: Criar tabela de configurações globais
-- Descrição: Armazena configurações que afetam toda a plataforma (ex: Mercado Pago global)
-- Data: 2025-10-29

CREATE TABLE IF NOT EXISTS configuracoes_globais (
  id INTEGER PRIMARY KEY DEFAULT 1,
  mp_ativado BOOLEAN DEFAULT true,
  mp_modo_producao BOOLEAN DEFAULT false,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Inserir registro padrão
INSERT INTO configuracoes_globais (id, mp_ativado, mp_modo_producao)
VALUES (1, true, false)
ON CONFLICT (id) DO NOTHING;

-- Comentários
COMMENT ON TABLE configuracoes_globais IS 'Configurações globais da plataforma que afetam todas as lojas';
COMMENT ON COLUMN configuracoes_globais.mp_ativado IS 'Mercado Pago ativado globalmente para todas as lojas';
COMMENT ON COLUMN configuracoes_globais.mp_modo_producao IS 'true = produção (pagamentos reais), false = teste';
COMMENT ON CONSTRAINT single_row_check ON configuracoes_globais IS 'Garante que só existe um registro de configuração';
