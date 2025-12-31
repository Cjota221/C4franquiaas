-- ============================================
-- 🔍 INVESTIGAR: O QUE QUEBROU APÓS REMOVER TRIGGERS
-- ============================================

-- 1️⃣ Verificar se há queries travadas
SELECT 
  pid,
  usename,
  state,
  query,
  now() - query_start as duration
FROM pg_stat_activity
WHERE state != 'idle'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;

-- Se aparecer queries com "duration" muito alto (mais de 1 minuto), podem estar travadas
-- ============================================

-- 2️⃣ Verificar se há locks na tabela produtos
SELECT 
  locktype,
  relation::regclass,
  mode,
  granted,
  pid
FROM pg_locks
WHERE relation = 'produtos'::regclass;

-- Se aparecer "granted = false", há um lock bloqueando
-- ============================================

-- 3️⃣ Verificar se produtos estão acessíveis
SELECT COUNT(*) FROM produtos LIMIT 1;

-- Se demorar muito, a tabela está com problema
-- ============================================

-- 4️⃣ Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'produtos';

-- Verificar se RLS não está bloqueando acesso
-- ============================================
