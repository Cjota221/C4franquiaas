-- ============================================
-- 🔍 DIAGNÓSTICO: Produtos sem vínculo com Franqueadas
-- ============================================

-- 1️⃣ Quantos produtos ATIVOS não estão vinculados a NENHUMA franqueada?
SELECT 
  COUNT(DISTINCT p.id) as produtos_ativos_sem_vinculo
FROM produtos p
WHERE p.ativo = true
  AND p.estoque > 0
  AND NOT EXISTS (
    SELECT 1 FROM reseller_products rp 
    WHERE rp.product_id = p.id
  );

-- 2️⃣ Ver exemplos desses produtos
SELECT 
  p.id,
  p.nome,
  p.estoque,
  p.ativo,
  p.preco_base,
  p.ultima_sincronizacao
FROM produtos p
WHERE p.ativo = true
  AND p.estoque > 0
  AND NOT EXISTS (
    SELECT 1 FROM reseller_products rp 
    WHERE rp.product_id = p.id
  )
ORDER BY p.ultima_sincronizacao DESC
LIMIT 10;

-- 3️⃣ Quantas franqueadas APROVADAS existem?
SELECT 
  COUNT(*) as total_franqueadas_aprovadas
FROM resellers
WHERE status = 'aprovada';

-- 4️⃣ Ver essas franqueadas
SELECT 
  id,
  name,
  email,
  status,
  created_at
FROM resellers
WHERE status = 'aprovada'
ORDER BY created_at;

-- ============================================
-- 📊 EXECUTE ESTE SQL PARA VER O PROBLEMA
-- ============================================
