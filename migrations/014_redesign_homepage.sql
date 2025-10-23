-- ============================================================================
-- 🚀 MIGRATION 014: Redesign Completo da Homepage (E-commerce Alta Conversão)
-- ============================================================================
BEGIN;

-- PASSO 1: Adicionar campos de personalização na tabela `lojas`
ALTER TABLE lojas
ADD COLUMN IF NOT EXISTS banner_secundario TEXT,
ADD COLUMN IF NOT EXISTS mensagens_regua JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS icones_confianca JSONB DEFAULT '[]'::jsonb;

-- PASSO 2: Criar tabela de produtos em destaque
CREATE TABLE IF NOT EXISTS produtos_destaque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(loja_id, produto_id)
);
ALTER TABLE produtos_destaque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público pode ver produtos destaque" ON produtos_destaque FOR SELECT USING (ativo = true);
CREATE POLICY "Franqueada pode gerenciar produtos destaque" ON produtos_destaque FOR ALL USING ((SELECT franqueada_id FROM lojas WHERE id = loja_id) = auth.uid());

-- PASSO 3: Criar tabela de categorias em destaque
CREATE TABLE IF NOT EXISTS categorias_destaque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  nome VARCHAR(100) NOT NULL,
  imagem TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE categorias_destaque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público pode ver categorias destaque" ON categorias_destaque FOR SELECT USING (ativo = true);
CREATE POLICY "Franqueada pode gerenciar categorias destaque" ON categorias_destaque FOR ALL USING ((SELECT franqueada_id FROM lojas WHERE id = loja_id) = auth.uid());

-- PASSO 4: Criar tabela de navegação por tamanhos
CREATE TABLE IF NOT EXISTS tamanhos_navegacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  tamanho VARCHAR(20) NOT NULL,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(loja_id, tamanho)
);
ALTER TABLE tamanhos_navegacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Público pode ver tamanhos de navegação" ON tamanhos_navegacao FOR SELECT USING (ativo = true);
CREATE POLICY "Franqueada pode gerenciar tamanhos" ON tamanhos_navegacao FOR ALL USING ((SELECT franqueada_id FROM lojas WHERE id = loja_id) = auth.uid());

COMMIT;
