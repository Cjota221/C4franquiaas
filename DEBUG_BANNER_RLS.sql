-- 🔍 DEBUG: Verificar estrutura e dados para RLS de banners

-- 1. Verificar se a tabela resellers tem a coluna user_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'resellers' 
  AND column_name IN ('id', 'user_id', 'status', 'is_active');

-- 2. Verificar se seu usuário está na tabela resellers
SELECT 
  r.id as reseller_id,
  r.user_id,
  r.store_name,
  r.status,
  r.is_active,
  r.email
FROM resellers r
WHERE r.user_id = '690aaf5c-57ab-46a9-a70e-a8d1efe8f20f';

-- 3. Verificar políticas atuais da tabela banner_templates
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'banner_templates';

-- 4. Verificar se existem banners ativos
SELECT id, nome, ativo, ordem
FROM banner_templates
ORDER BY ordem;

-- 5. TESTE MANUAL: Simular a query que o frontend faz
-- (Execute como revendedora logada)
SELECT *
FROM banner_templates
WHERE ativo = true
ORDER BY ordem ASC;
