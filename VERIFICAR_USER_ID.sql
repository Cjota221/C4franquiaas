-- Execute esta query no Supabase para verificar o problema

-- 1. Ver qual user_id está vinculado ao email teste@hotmail.com
SELECT id, email 
FROM auth.users 
WHERE email = 'teste@hotmail.com';

-- 2. Verificar se esse user_id está na tabela franqueadas
SELECT 'franqueadas' as tabela, id, nome, user_id
FROM franqueadas 
WHERE user_id = '7703ac76-2e82-4ee6-a55d-11be67e72779';

-- 3. Verificar se esse user_id está na tabela resellers
SELECT 'resellers' as tabela, id, store_name, user_id, status
FROM resellers 
WHERE user_id = '7703ac76-2e82-4ee6-a55d-11be67e72779';

-- SOLUÇÃO:
-- Se o user_id está nas duas tabelas, precisamos:
-- OPÇÃO 1: Remover da tabela franqueadas se for revendedora:
-- UPDATE franqueadas SET user_id = NULL WHERE user_id = '7703ac76-2e82-4ee6-a55d-11be67e72779';

-- OPÇÃO 2: Remover da tabela resellers se for franqueada:
-- UPDATE resellers SET user_id = NULL WHERE user_id = '7703ac76-2e82-4ee6-a55d-11be67e72779';

-- OPÇÃO 3: Criar um novo user_id para a revendedora (recomendado)
-- Você precisa criar uma nova conta de email para a revendedora
