-- ============================================
-- 🔍 VERIFICAR ESTRUTURA DA TABELA PRODUTOS
-- ============================================
-- Para descobrir quais campos existem realmente
-- ============================================

-- 1️⃣ Ver colunas da tabela produtos
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'produtos'
ORDER BY ordinal_position;

-- ============================================

-- 2️⃣ Ver triggers ativos na tabela produtos
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'produtos';

-- ============================================

-- 3️⃣ Ver alguns produtos de exemplo (estrutura real)
SELECT *
FROM produtos
LIMIT 1;
