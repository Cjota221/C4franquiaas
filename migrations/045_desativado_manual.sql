-- Migration 045: Controle manual de ativação de produtos
-- Data: 2024-12-28
-- Problema: Sincronização reativa produtos que foram desativados manualmente

-- Adicionar campo para marcar produtos desativados manualmente
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS desativado_manual BOOLEAN DEFAULT FALSE;

-- Comentário para documentação
COMMENT ON COLUMN produtos.desativado_manual IS 'Se TRUE, o produto foi desativado manualmente pelo admin e NÃO deve ser reativado pela sincronização';

-- Atualizar produtos que estão desativados COM estoque para marcar como manual
-- (assumindo que se tem estoque e está desativado, foi intencional)
UPDATE produtos 
SET desativado_manual = TRUE 
WHERE ativo = FALSE AND estoque > 0;
