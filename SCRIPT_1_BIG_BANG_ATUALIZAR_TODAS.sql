-- ============================================
-- 🚀 SCRIPT 1: BIG BANG - ATUALIZAÇÃO GERAL
-- ============================================
-- Executa UMA VEZ para corrigir todas as 44 revendedoras
-- Regra: Aprovada = TODOS produtos ativos + margem 100%
-- ============================================

-- INÍCIO DA TRANSAÇÃO (tudo ou nada)
BEGIN;

-- ============================================
-- PASSO 1: Ver situação ANTES
-- ============================================
SELECT 'ANTES DA CORREÇÃO' as status;
SELECT 
  r.name as revendedora,
  COUNT(rp.id) as total_produtos,
  COUNT(CASE WHEN rp.is_active = true THEN 1 END) as ativos,
  COUNT(CASE WHEN rp.margin_percent = 100 THEN 1 END) as com_margem_100
FROM resellers r
LEFT JOIN reseller_products rp ON rp.reseller_id = r.id
WHERE r.status = 'aprovada'
GROUP BY r.id, r.name
ORDER BY total_produtos ASC
LIMIT 10;

-- ============================================
-- PASSO 2: UPSERT - Inserir produtos que faltam
-- ============================================
-- Insere TODOS os produtos ativos para TODAS as revendedoras aprovadas
-- Se já existir, não faz nada (será atualizado no passo 3)

INSERT INTO reseller_products (
  reseller_id,
  product_id,
  margin_percent,
  is_active,
  created_at,
  updated_at
)
SELECT 
  r.id AS reseller_id,
  p.id AS product_id,
  100 AS margin_percent,          -- 🎯 Margem 100%
  true AS is_active,              -- ✅ Ativo
  NOW() AS created_at,
  NOW() AS updated_at
FROM resellers r
CROSS JOIN produtos p
WHERE r.status = 'aprovada'       -- Todas as aprovadas
  AND p.ativo = true              -- Todos os produtos ativos
  AND p.admin_aprovado = true     -- Aprovados pelo admin
ON CONFLICT (reseller_id, product_id) 
DO NOTHING;                       -- Se já existe, pula (atualiza abaixo)

-- ============================================
-- PASSO 3: ATUALIZAR produtos existentes que estão "quebrados"
-- ============================================
-- Corrige: margem = 0, null, ou is_active = false

UPDATE reseller_products
SET 
  margin_percent = 100,
  is_active = true,
  updated_at = NOW()
WHERE reseller_id IN (SELECT id FROM resellers WHERE status = 'aprovada')
  AND product_id IN (SELECT id FROM produtos WHERE ativo = true AND admin_aprovado = true)
  AND (
    margin_percent IS NULL 
    OR margin_percent = 0 
    OR is_active = false
    OR is_active IS NULL
  );

-- ============================================
-- PASSO 4: DESATIVAR produtos que foram desativados globalmente
-- ============================================
-- Se o produto foi desativado no catálogo, desativa para todas

UPDATE reseller_products rp
SET 
  is_active = false,
  updated_at = NOW()
FROM produtos p
WHERE rp.product_id = p.id
  AND (p.ativo = false OR p.admin_aprovado = false);

-- ============================================
-- PASSO 5: Ver situação DEPOIS
-- ============================================
SELECT 'DEPOIS DA CORREÇÃO' as status;
SELECT 
  r.name as revendedora,
  COUNT(rp.id) as total_produtos,
  COUNT(CASE WHEN rp.is_active = true THEN 1 END) as ativos,
  COUNT(CASE WHEN rp.margin_percent = 100 THEN 1 END) as com_margem_100
FROM resellers r
LEFT JOIN reseller_products rp ON rp.reseller_id = r.id
WHERE r.status = 'aprovada'
GROUP BY r.id, r.name
ORDER BY r.name;

-- ============================================
-- RESUMO FINAL
-- ============================================
SELECT 
  'RESUMO GERAL' as info,
  (SELECT COUNT(*) FROM resellers WHERE status = 'aprovada') as total_revendedoras_aprovadas,
  (SELECT COUNT(*) FROM produtos WHERE ativo = true AND admin_aprovado = true) as total_produtos_ativos,
  (SELECT COUNT(*) FROM reseller_products WHERE is_active = true AND margin_percent = 100) as total_vinculos_corretos;

-- Se tudo estiver OK, confirme:
COMMIT;

-- Se algo deu errado, use: ROLLBACK;
