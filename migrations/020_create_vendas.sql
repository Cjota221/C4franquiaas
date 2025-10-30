-- Migration 020: Criar tabela de vendas
-- Data: 2025-10-30
-- Descrição: Tabela para registrar vendas das franqueadas com comissões

-- Criar tabela de vendas
CREATE TABLE IF NOT EXISTS public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  franqueada_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados da venda
  items JSONB NOT NULL, -- Array de produtos vendidos
  valor_total DECIMAL(10, 2) NOT NULL,
  comissao_franqueada DECIMAL(10, 2) NOT NULL, -- Valor da comissão
  percentual_comissao DECIMAL(5, 2) NOT NULL, -- % de comissão aplicado
  
  -- Pagamento Mercado Pago
  mp_payment_id TEXT, -- ID do pagamento no MP
  mp_preference_id TEXT, -- ID da preferência (se usar)
  metodo_pagamento TEXT, -- 'pix', 'credit_card', etc
  status_pagamento TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  mp_status_detail TEXT, -- Detalhes do status do MP
  
  -- Dados do cliente
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  cliente_cpf TEXT,
  cliente_telefone TEXT,
  
  -- Endereço de entrega
  endereco_completo JSONB, -- CEP, rua, número, bairro, cidade, estado
  
  -- Repasse de comissão
  comissao_paga BOOLEAN DEFAULT FALSE,
  data_repasse_comissao TIMESTAMPTZ, -- Quando foi pago
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_vendas_loja_id ON public.vendas(loja_id);
CREATE INDEX idx_vendas_franqueada_id ON public.vendas(franqueada_id);
CREATE INDEX idx_vendas_status ON public.vendas(status_pagamento);
CREATE INDEX idx_vendas_mp_payment_id ON public.vendas(mp_payment_id);
CREATE INDEX idx_vendas_created_at ON public.vendas(created_at DESC);
CREATE INDEX idx_vendas_comissao_paga ON public.vendas(comissao_paga) WHERE comissao_paga = FALSE;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_vendas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendas_updated_at
  BEFORE UPDATE ON public.vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_vendas_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- Política: Admin vê todas as vendas
CREATE POLICY "Admin pode ver todas as vendas"
  ON public.vendas
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.tipo = 'admin'
    )
  );

-- Política: Franqueada vê apenas suas vendas
CREATE POLICY "Franqueada vê apenas suas vendas"
  ON public.vendas
  FOR SELECT
  TO authenticated
  USING (franqueada_id = auth.uid());

-- Política: Sistema pode inserir vendas (service role)
CREATE POLICY "Sistema pode inserir vendas"
  ON public.vendas
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Política: Sistema pode atualizar vendas (para webhook)
CREATE POLICY "Sistema pode atualizar vendas"
  ON public.vendas
  FOR UPDATE
  TO service_role
  USING (true);

-- Comentários
COMMENT ON TABLE public.vendas IS 'Registro de todas as vendas realizadas pelas franqueadas';
COMMENT ON COLUMN public.vendas.items IS 'Array JSON dos produtos vendidos com id, nome, tamanho, quantidade, preco';
COMMENT ON COLUMN public.vendas.comissao_franqueada IS 'Valor em reais da comissão da franqueada';
COMMENT ON COLUMN public.vendas.percentual_comissao IS 'Percentual de margem de lucro da franqueada (ex: 30.00 = 30%)';
COMMENT ON COLUMN public.vendas.comissao_paga IS 'Se a comissão já foi repassada para a franqueada';
COMMENT ON COLUMN public.vendas.data_repasse_comissao IS 'Data do repasse da comissão (quintas-feiras)';
