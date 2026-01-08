-- DEBUG: Verificar usuário e franqueada
-- Execute no Supabase SQL Editor

-- 1. Buscar o user_id do email cjotarasteirinhas@gmail.com
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'cjotarasteirinhas@gmail.com';

-- 2. Ver todas as franqueadas e seus user_ids
SELECT 
    id,
    nome,
    email,
    status,
    user_id,
    criado_em
FROM franqueadas
ORDER BY criado_em DESC;

-- 3. Verificar se existe franqueada com o email específico
SELECT * FROM franqueadas WHERE email = 'cjotarasteirinhas@gmail.com';

-- 4. Se precisar vincular manualmente o user_id:
-- Primeiro pegue o user_id da query 1, depois execute:
/*
UPDATE franqueadas 
SET user_id = 'COLE_O_USER_ID_AQUI'
WHERE email = 'cjotarasteirinhas@gmail.com';
*/

-- 5. Se o status não for 'aprovada', aprovar:
/*
UPDATE franqueadas 
SET status = 'aprovada', aprovado_em = NOW()
WHERE email = 'cjotarasteirinhas@gmail.com';
*/
