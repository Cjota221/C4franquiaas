-- Migration 024: Adicionar campo status_envio na tabela vendas
-- Data: 2025-10-30
-- Descrição: Adicionar controle de status de envio para separar operações de finanças

-- Adicionar coluna status_envio
ALTER TABLE public.vendas 
ADD COLUMN IF NOT EXISTS status_envio VARCHAR(50) DEFAULT 'A_PREPARAR';

-- Adicionar CHECK constraint para valores válidos
ALTER TABLE public.vendas
ADD CONSTRAINT vendas_status_envio_check 
CHECK (status_envio IN ('A_PREPARAR', 'ENVIADO', 'ENTREGUE', 'CANCELADO'));

-- Criar índice para melhorar performance de filtros
CREATE INDEX IF NOT EXISTS idx_vendas_status_envio 
ON public.vendas(status_envio);

-- Atualizar vendas existentes com base no status_pagamento
-- Se já foi pago, marca como "A_PREPARAR" (pronto para enviar)
UPDATE public.vendas
SET status_envio = 'A_PREPARAR'
WHERE status_pagamento = 'approved' AND status_envio IS NULL;

-- Comentários
COMMENT ON COLUMN public.vendas.status_envio IS 'Status do envio do pedido: A_PREPARAR, ENVIADO, ENTREGUE, CANCELADO';

-- Log
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Migration 024 aplicada com sucesso!';
  RAISE NOTICE '   - Coluna status_envio adicionada';
  RAISE NOTICE '   - Valores permitidos: A_PREPARAR, ENVIADO, ENTREGUE, CANCELADO';
  RAISE NOTICE '   - Índice criado para performance';
END $$;
