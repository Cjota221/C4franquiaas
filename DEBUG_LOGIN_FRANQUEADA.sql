-- ======================================
-- DEBUG LOGIN FRANQUEADA
-- Execute estes comandos no Supabase SQL Editor
-- ======================================

-- 1️⃣ LISTAR TODAS AS FRANQUEADAS
SELECT 
  f.id,
  f.nome,
  f.email,
  f.status,
  f.user_id,
  f.criado_em,
  f.aprovado_em,
  l.nome as loja_nome,
  l.dominio as loja_dominio,
  l.ativo as loja_ativa
FROM franqueadas f
LEFT JOIN lojas l ON l.franqueada_id = f.id
ORDER BY f.criado_em DESC;

-- 2️⃣ VERIFICAR SE O USER_ID EXISTE NO AUTH.USERS
-- (Se user_id for NULL, o cadastro não criou usuário no Supabase Auth)
SELECT 
  f.email as franqueada_email,
  f.user_id,
  au.email as auth_email,
  au.created_at as auth_criado
FROM franqueadas f
LEFT JOIN auth.users au ON au.id = f.user_id;

-- 3️⃣ APROVAR FRANQUEADA MANUALMENTE (substitua o email)
-- UPDATE franqueadas
-- SET status = 'aprovada', aprovado_em = NOW()
-- WHERE email = 'email@exemplo.com';

-- 4️⃣ CRIAR LOJA PARA FRANQUEADA (se não existir)
-- Primeiro pegue o ID da franqueada:
-- SELECT id, nome FROM franqueadas WHERE email = 'email@exemplo.com';

-- Depois crie a loja:
-- INSERT INTO lojas (franqueada_id, nome, dominio, ativo)
-- VALUES ('id-da-franqueada', 'Nome da Loja', 'dominio-unico', true);

-- ======================================
-- 🔧 PROBLEMA COMUM: Usuário não tem user_id
-- ======================================
-- Se user_id for NULL, a franqueada não consegue logar
-- porque o sistema verifica: franqueadas.user_id = auth.user.id

-- SOLUÇÃO: Criar o usuário no Supabase Auth Dashboard:
-- 1. Vá em Authentication > Users
-- 2. Clique em "Add User" > "Create New User"
-- 3. Coloque o mesmo email da franqueada
-- 4. Defina uma senha (ex: Senha123!)
-- 5. Pegue o UUID do usuário criado
-- 6. Atualize a franqueada com o user_id:

-- UPDATE franqueadas
-- SET user_id = 'uuid-do-usuario-criado'
-- WHERE email = 'email@exemplo.com';

-- ======================================
-- 🚀 SCRIPT COMPLETO: Criar usuário + Aprovar + Vincular
-- ======================================
-- No Supabase você precisará:
-- 1. Criar usuário no Auth Dashboard (email + senha)
-- 2. Copiar o UUID gerado
-- 3. Executar:

/*
UPDATE franqueadas
SET 
  user_id = 'cole-o-uuid-aqui',
  status = 'aprovada',
  aprovado_em = NOW()
WHERE email = 'email-da-franqueada@exemplo.com';
*/

-- ======================================
-- ✅ VERIFICAR SE DEU CERTO
-- ======================================
SELECT 
  nome,
  email,
  status,
  user_id IS NOT NULL as tem_usuario,
  aprovado_em
FROM franqueadas
WHERE status = 'aprovada';
