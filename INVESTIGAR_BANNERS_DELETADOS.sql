-- ============================================================================
-- INVESTIGAR BANNERS DELETADOS
-- ============================================================================

-- 1. Ver TODOS os banners (aprovados, pendentes, rejeitados)
SELECT 
  status,
  COUNT(*) as quantidade
FROM banner_submissions
GROUP BY status;

-- 2. Ver todos os banners que existem (qualquer status)
SELECT 
  bs.id,
  bs.created_at,
  bs.approved_at,
  bs.titulo,
  bs.status,
  bt.nome as template_nome,
  r.store_name as loja
FROM banner_submissions bs
LEFT JOIN banner_templates bt ON bs.template_id = bt.id
LEFT JOIN resellers r ON r.user_id = bs.user_id
ORDER BY bs.created_at DESC;

-- 3. Ver se existe uma tabela "banners" antiga
SELECT 
  *
FROM banners
LIMIT 20;

-- 4. Verificar se há banners órfãos (sem template_id válido)
SELECT 
  bs.*
FROM banner_submissions bs
LEFT JOIN banner_templates bt ON bs.template_id = bt.id
WHERE bt.id IS NULL;
