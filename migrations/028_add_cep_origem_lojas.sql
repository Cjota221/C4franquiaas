-- Migration 028: Adicionar CEP de origem nas lojas
-- Data: 2025-11-01
-- Descrição: Adiciona campo cep_origem para integração com EnvioEcom

-- Adicionar coluna cep_origem na tabela lojas
ALTER TABLE lojas 
ADD COLUMN IF NOT EXISTS cep_origem VARCHAR(8);

-- Comentários
COMMENT ON COLUMN lojas.cep_origem IS 'CEP de origem para cálculo de frete (integração EnvioEcom)';

-- Índice para performance (caso seja usado em queries)
CREATE INDEX IF NOT EXISTS idx_lojas_cep_origem ON lojas(cep_origem);

-- Atualizar lojas existentes com CEP padrão (São Paulo)
-- A franqueada pode atualizar depois no painel
UPDATE lojas 
SET cep_origem = '01310100' 
WHERE cep_origem IS NULL;
