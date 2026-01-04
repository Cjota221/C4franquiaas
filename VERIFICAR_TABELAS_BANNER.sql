-- Verificar se existem banners em outras tabelas

-- 1. Ver todas as tabelas que têm "banner" no nome
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%banner%';

-- 2. Se existir alguma tabela antiga de banners aprovados, mostrar dados:
-- SELECT * FROM banner_personalizacoes LIMIT 10;
-- OU
-- SELECT * FROM banners LIMIT 10;
-- OU
-- SELECT * FROM banner_aprovacoes LIMIT 10;
