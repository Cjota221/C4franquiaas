-- ======================================
-- APROVAR REVENDEDORA PARA TESTE
-- ======================================

-- 1️⃣ Listar todas as revendedoras e seus status
SELECT 
  id,
  name,
  email,
  store_name,
  status,
  is_active,
  created_at
FROM resellers
ORDER BY created_at DESC;

-- 2️⃣ Aprovar uma revendedora específica (substitua o email)
UPDATE resellers
SET 
  status = 'aprovada',
  is_active = true
WHERE email = 'email_da_revendedora@exemplo.com';

-- OU aprovar por ID
-- UPDATE resellers
-- SET status = 'aprovada', is_active = true
-- WHERE id = 'uuid-da-revendedora';

-- 3️⃣ Aprovar TODAS as revendedoras pendentes (USE COM CUIDADO!)
-- UPDATE resellers
-- SET status = 'aprovada', is_active = true
-- WHERE status = 'pendente';

-- 4️⃣ Verificar resultado
SELECT id, name, email, status, is_active 
FROM resellers 
WHERE status = 'aprovada';
