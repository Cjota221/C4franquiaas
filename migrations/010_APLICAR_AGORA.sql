-- ============================================================================
-- 🚨 MIGRATION 010 - APLICAR URGENTEMENTE
-- ============================================================================
-- Esta migration cria a tabela 'lojas' necessária para o sistema funcionar
-- ============================================================================

-- 1️⃣ Criar tabela lojas
CREATE TABLE IF NOT EXISTS lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franqueada_id UUID NOT NULL REFERENCES franqueadas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  dominio TEXT UNIQUE,
  logo TEXT,
  cor_primaria TEXT DEFAULT '#DB1472',
  cor_secundaria TEXT DEFAULT '#333333',
  ativo BOOLEAN DEFAULT false,
  produtos_ativos INTEGER DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- 2️⃣ Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_lojas_franqueada_id ON lojas(franqueada_id);
CREATE INDEX IF NOT EXISTS idx_lojas_dominio ON lojas(dominio);
CREATE INDEX IF NOT EXISTS idx_lojas_ativo ON lojas(ativo);

-- 3️⃣ Adicionar colunas financeiras à tabela franqueadas (se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franqueadas' AND column_name = 'vendas_total'
    ) THEN
        ALTER TABLE franqueadas 
        ADD COLUMN vendas_total DECIMAL(10, 2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'franqueadas' AND column_name = 'comissao_acumulada'
    ) THEN
        ALTER TABLE franqueadas 
        ADD COLUMN comissao_acumulada DECIMAL(10, 2) DEFAULT 0.00;
    END IF;
END $$;

-- 4️⃣ Habilitar RLS (Row Level Security)
ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;

-- 5️⃣ Criar políticas de acesso
CREATE POLICY "Admin pode ver todas as lojas"
  ON lojas FOR SELECT
  USING (true);

CREATE POLICY "Admin pode criar lojas"
  ON lojas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin pode atualizar lojas"
  ON lojas FOR UPDATE
  USING (true);

CREATE POLICY "Admin pode deletar lojas"
  ON lojas FOR DELETE
  USING (true);

-- ============================================================================
-- ✅ VERIFICAÇÃO
-- ============================================================================
-- Execute esta query para verificar se tudo foi criado:
--
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name = 'lojas' AND table_schema = 'public';
--
-- Resultado esperado: lojas
-- ============================================================================

-- ============================================================================
-- 🎯 PRÓXIMOS PASSOS
-- ============================================================================
-- 1. Atualizar o esquema do Supabase: Settings > API > Refresh Schema
-- 2. Acessar: http://localhost:3001/admin/franqueadas-unificado
-- 3. Testar filtros e ações
-- ============================================================================
