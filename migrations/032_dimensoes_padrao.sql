-- Migration 032: Adiciona dimensões e peso padrão na config_frete_geral
-- Permite configurar dimensões padrão para todos os produtos

ALTER TABLE config_frete_geral
ADD COLUMN IF NOT EXISTS peso_padrao DECIMAL(10,3) DEFAULT 0.300, -- kg (300g)
ADD COLUMN IF NOT EXISTS altura_padrao INTEGER DEFAULT 5, -- cm
ADD COLUMN IF NOT EXISTS largura_padrao INTEGER DEFAULT 12, -- cm
ADD COLUMN IF NOT EXISTS comprimento_padrao INTEGER DEFAULT 25; -- cm

-- Atualizar registro existente com valores padrão
UPDATE config_frete_geral
SET 
  peso_padrao = 0.300,
  altura_padrao = 5,
  largura_padrao = 12,
  comprimento_padrao = 25
WHERE id = 1;

-- Comentários
COMMENT ON COLUMN config_frete_geral.peso_padrao IS 'Peso padrão de cada produto em kg (ex: 0.300 = 300g)';
COMMENT ON COLUMN config_frete_geral.altura_padrao IS 'Altura padrão da embalagem em cm';
COMMENT ON COLUMN config_frete_geral.largura_padrao IS 'Largura padrão da embalagem em cm';
COMMENT ON COLUMN config_frete_geral.comprimento_padrao IS 'Comprimento padrão da embalagem em cm';
