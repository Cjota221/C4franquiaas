-- ============================================
-- 🔍 DESCOBRIR ESTRUTURA DA TABELA logs_sincronizacao
-- ============================================

-- Ver todas as colunas da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'logs_sincronizacao'
ORDER BY ordinal_position;

-- Depois de rodar a query acima, você saberá os nomes corretos das colunas
-- Use esses nomes para ajustar as queries do MONITORAMENTO_ALTERNATIVO.sql
