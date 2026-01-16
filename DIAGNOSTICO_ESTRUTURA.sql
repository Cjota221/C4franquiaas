-- ============================================
-- 🔍 DIAGNÓSTICO: Descobrir estrutura real das tabelas
-- ============================================

-- 1. Ver estrutura da tabela produtos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'produtos'
ORDER BY ordinal_position;

-- 2. Ver alguns produtos de exemplo
SELECT * FROM produtos LIMIT 5;

-- 3. Contar produtos por status/ativo
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN ativo = true THEN 1 END) as ativo_true,
  COUNT(CASE WHEN ativo = false THEN 1 END) as ativo_false,
  COUNT(CASE WHEN admin_aprovado = true THEN 1 END) as aprovado_true,
  COUNT(CASE WHEN admin_aprovado = false THEN 1 END) as aprovado_false
FROM produtos;

-- 4. Ver estrutura da tabela reseller_products
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reseller_products'
ORDER BY ordinal_position;

-- 5. Ver estrutura da tabela resellers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'resellers'
ORDER BY ordinal_position;
