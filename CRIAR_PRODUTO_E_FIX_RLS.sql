-- ============================================
-- 🚨 CORREÇÃO RLS + CRIAR PRODUTO DE TESTE
-- ============================================

-- 1️⃣ VERIFICAR POLICIES EXISTENTES
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'produtos';

-- 2️⃣ GARANTIR POLICY SELECT (DROP + CREATE)
DROP POLICY IF EXISTS "Produtos visíveis para todos autenticados" ON produtos;
CREATE POLICY "Produtos visíveis para todos autenticados"
ON produtos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Produtos visíveis publicamente" ON produtos;
CREATE POLICY "Produtos visíveis publicamente"
ON produtos FOR SELECT TO anon USING (true);

-- 3️⃣ CRIAR PRODUTO DE TESTE
INSERT INTO produtos (
  nome,
  descricao,
  preco_base,
  estoque,
  ativo,
  admin_aprovado,
  eh_produto_novo,
  id_externo,
  sincronizado_facilzap
) VALUES (
  'Produto Teste Vídeo',
  'Produto criado para testar upload de vídeo',
  99.90,
  100,
  true,
  true,
  false,
  'TESTE-VIDEO-001',
  true
)
ON CONFLICT (id_externo) DO NOTHING
RETURNING id, nome, id_externo;

-- 4️⃣ VERIFICAR PRODUTO CRIADO
SELECT id, nome, id_externo, ativo FROM produtos LIMIT 5;

-- ============================================
-- ✅ Execute no Supabase SQL Editor
-- ============================================
