-- Verificar se a tabela produtos tem RLS ativo bloqueando SELECT
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'produtos'
AND cmd = 'SELECT';
