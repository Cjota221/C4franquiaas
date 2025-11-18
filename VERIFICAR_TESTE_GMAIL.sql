-- Verificar o problema com teste@gmail.com

-- 1. Ver qual user_id está vinculado ao email teste@gmail.com
SELECT id, email 
FROM auth.users 
WHERE email = 'teste@gmail.com';

-- 2. Verificar se esse user_id está na tabela franqueadas
SELECT 'franqueadas' as tabela, id, nome, user_id
FROM franqueadas 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'teste@gmail.com');

-- 3. Verificar se esse user_id está na tabela resellers
SELECT 'resellers' as tabela, id, store_name, user_id, status
FROM resellers 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'teste@gmail.com');

-- 4. Verificar todas as franqueadas
SELECT id, nome, email, user_id
FROM franqueadas
LIMIT 10;

-- 5. Verificar todas as revendedoras
SELECT id, store_name, email, user_id, status
FROM resellers
LIMIT 10;
