-- Migration 022: Módulo Financeiro Completo
-- Data: 2025-10-30
-- Descrição: Sistema de comissões com PIX para franqueadas

-- ============================================
-- 1️⃣ TABELA: Dados de Pagamento PIX
-- ============================================
CREATE TABLE IF NOT EXISTS public.franqueadas_dados_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franqueada_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  tipo_chave_pix VARCHAR(20) NOT NULL CHECK (tipo_chave_pix IN ('CPF', 'CNPJ', 'EMAIL', 'CELULAR', 'ALEATORIA')),
  chave_pix VARCHAR(255) NOT NULL,
  nome_completo VARCHAR(255) NOT NULL, -- Nome para aparecer no PIX
  cidade VARCHAR(100) DEFAULT 'Sao Paulo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_dados_pagamento_franqueada ON public.franqueadas_dados_pagamento(franqueada_id);

-- ============================================
-- 2️⃣ ADICIONAR CAMPOS NA TABELA VENDAS
-- ============================================
-- Adicionar status da comissão
ALTER TABLE public.vendas 
ADD COLUMN IF NOT EXISTS status_comissao VARCHAR(20) DEFAULT 'pendente' CHECK (status_comissao IN ('pendente', 'paga'));

-- Data do pagamento
ALTER TABLE public.vendas 
ADD COLUMN IF NOT EXISTS data_pagamento_comissao TIMESTAMP NULL;

-- Quem pagou (admin)
ALTER TABLE public.vendas 
ADD COLUMN IF NOT EXISTS pago_por UUID REFERENCES auth.users(id) NULL;

-- Índice para buscar vendas pendentes
CREATE INDEX IF NOT EXISTS idx_vendas_status_comissao ON public.vendas(status_comissao, franqueada_id);

-- ============================================
-- 3️⃣ TABELA: Histórico de Pagamentos
-- ============================================
CREATE TABLE IF NOT EXISTS public.pagamentos_comissao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franqueada_id UUID REFERENCES auth.users(id) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  quantidade_vendas INTEGER NOT NULL,
  vendas_ids UUID[] NOT NULL, -- Array de IDs das vendas pagas
  chave_pix_usada VARCHAR(255) NOT NULL,
  tipo_chave_pix VARCHAR(20) NOT NULL,
  payload_pix TEXT NOT NULL, -- QR Code "Copia e Cola"
  pago_por UUID REFERENCES auth.users(id) NOT NULL,
  observacoes TEXT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pagamentos_franqueada ON public.pagamentos_comissao(franqueada_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data ON public.pagamentos_comissao(created_at DESC);

-- ============================================
-- 4️⃣ POLÍTICAS RLS
-- ============================================

-- A. Dados de Pagamento PIX
ALTER TABLE public.franqueadas_dados_pagamento ENABLE ROW LEVEL SECURITY;

-- Franqueada pode ver e editar seus próprios dados
DROP POLICY IF EXISTS "Franqueada gerencia seus dados PIX" ON public.franqueadas_dados_pagamento;
CREATE POLICY "Franqueada gerencia seus dados PIX"
  ON public.franqueadas_dados_pagamento
  FOR ALL
  TO authenticated
  USING (franqueada_id = auth.uid())
  WITH CHECK (franqueada_id = auth.uid());

-- Admin pode ver dados PIX de todas (para gerar o pagamento)
DROP POLICY IF EXISTS "Admin vê dados PIX" ON public.franqueadas_dados_pagamento;
CREATE POLICY "Admin vê dados PIX"
  ON public.franqueadas_dados_pagamento
  FOR SELECT
  TO authenticated
  USING (true); -- TODO: Adicionar verificação de role admin

-- B. Histórico de Pagamentos
ALTER TABLE public.pagamentos_comissao ENABLE ROW LEVEL SECURITY;

-- Franqueada vê apenas seus pagamentos
DROP POLICY IF EXISTS "Franqueada vê seus pagamentos" ON public.pagamentos_comissao;
CREATE POLICY "Franqueada vê seus pagamentos"
  ON public.pagamentos_comissao
  FOR SELECT
  TO authenticated
  USING (franqueada_id = auth.uid());

-- Admin vê todos os pagamentos e pode criar
DROP POLICY IF EXISTS "Admin gerencia pagamentos" ON public.pagamentos_comissao;
CREATE POLICY "Admin gerencia pagamentos"
  ON public.pagamentos_comissao
  FOR ALL
  TO authenticated
  USING (true) -- TODO: Adicionar verificação de role admin
  WITH CHECK (true);

-- ============================================
-- 5️⃣ FUNÇÕES ÚTEIS
-- ============================================

-- Função para calcular total pendente de uma franqueada
CREATE OR REPLACE FUNCTION calcular_comissao_pendente(p_franqueada_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(comissao_franqueada), 0)
  INTO total
  FROM public.vendas
  WHERE franqueada_id = p_franqueada_id
    AND status_comissao = 'pendente'
    AND status_pagamento = 'approved'; -- Apenas vendas aprovadas

  RETURN total;
END;
$$;

-- Função para calcular total já pago de uma franqueada
CREATE OR REPLACE FUNCTION calcular_comissao_paga(p_franqueada_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(comissao_franqueada), 0)
  INTO total
  FROM public.vendas
  WHERE franqueada_id = p_franqueada_id
    AND status_comissao = 'paga';

  RETURN total;
END;
$$;

-- ============================================
-- 6️⃣ TRIGGER: Atualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dados_pagamento_updated_at ON public.franqueadas_dados_pagamento;
CREATE TRIGGER update_dados_pagamento_updated_at
  BEFORE UPDATE ON public.franqueadas_dados_pagamento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ✅ VERIFICAÇÃO
-- ============================================
-- Execute após aplicar a migration:
--
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('franqueadas_dados_pagamento', 'pagamentos_comissao');
--
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'vendas' 
--   AND column_name IN ('status_comissao', 'data_pagamento_comissao', 'pago_por');
