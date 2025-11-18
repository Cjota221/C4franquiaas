-- Queries para verificar se a migration do webhook foi aplicada com sucesso

-- 1️⃣ Verificar se as colunas foram adicionadas na tabela produtos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'produtos'
  AND column_name IN ('facilzap_id', 'sincronizado_facilzap', 'ultima_sincronizacao')
ORDER BY column_name;

-- 2️⃣ Verificar se a tabela logs_sincronizacao foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'logs_sincronizacao';

-- 3️⃣ Verificar estrutura da tabela logs_sincronizacao
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'logs_sincronizacao'
ORDER BY ordinal_position;

-- 4️⃣ Verificar se os índices foram criados
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname IN (
  'idx_produtos_facilzap_id',
  'idx_logs_tipo',
  'idx_logs_produto_id',
  'idx_logs_timestamp'
);

-- 5️⃣ Verificar se as views foram criadas
SELECT table_name
FROM information_schema.views
WHERE table_name IN ('vw_estatisticas_sincronizacao', 'vw_produtos_estoque_zero');

-- 6️⃣ Verificar se o trigger foi criado
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_atualizar_sincronizacao';

-- 7️⃣ Testar a view de estatísticas
SELECT * FROM vw_estatisticas_sincronizacao;

-- 8️⃣ Verificar se existem produtos com estoque zero ativos
SELECT * FROM vw_produtos_estoque_zero LIMIT 5;
