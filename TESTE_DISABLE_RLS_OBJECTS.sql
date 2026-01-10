-- 🔧 TESTE: DESABILITAR RLS TEMPORARIAMENTE

-- ATENÇÃO: Isso é APENAS PARA TESTE! Não deixar assim em produção!

-- Desabilitar RLS na tabela storage.objects TEMPORARIAMENTE
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- IMPORTANTE: Depois de testar e funcionar, REABILITAR com:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
