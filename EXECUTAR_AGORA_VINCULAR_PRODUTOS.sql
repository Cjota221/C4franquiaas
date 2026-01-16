-- ============================================
-- 🚨 EXECUTAR AGORA NO SUPABASE (SQL Editor)
-- ============================================
-- Este script:
-- 1. Cria o trigger para vincular produtos automaticamente quando revendedora é aprovada
-- 2. Corrige revendedoras existentes que não têm produtos
-- ============================================

-- PASSO 1: Criar a função de vinculação automática
CREATE OR REPLACE FUNCTION auto_vincular_produtos_nova_revendedora()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Só executa quando status MUDA para 'aprovada'
  IF NEW.status = 'aprovada' AND (OLD.status IS NULL OR OLD.status != 'aprovada') THEN
    
    -- Inserir TODOS os produtos ativos e aprovados para esta revendedora
    INSERT INTO reseller_products (
      reseller_id,
      product_id,
      margin_percent,
      is_active,
      created_at,
      updated_at
    )
    SELECT 
      NEW.id,                        -- ID da nova revendedora
      p.id,                          -- ID do produto
      100,                           -- 🎯 Margem padrão de 100%
      true,                          -- ✅ Produto já vem ATIVO
      NOW(),
      NOW()
    FROM produtos p
    WHERE p.ativo = true             -- Só produtos ativos
      AND p.admin_aprovado = true    -- Só produtos aprovados pelo admin
    ON CONFLICT (reseller_id, product_id) 
    DO NOTHING;                      -- Se já existir, não faz nada

    -- Contar quantos produtos foram vinculados
    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Log da operação
    RAISE NOTICE '✅ Revendedora % aprovada! % produtos vinculados automaticamente com margem 100%%', 
      NEW.name, v_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 2: Criar trigger para UPDATE (quando muda de pendente para aprovada)
DROP TRIGGER IF EXISTS trigger_vincular_produtos_revendedora_aprovada ON resellers;
CREATE TRIGGER trigger_vincular_produtos_revendedora_aprovada
  AFTER UPDATE OF status ON resellers
  FOR EACH ROW
  WHEN (NEW.status = 'aprovada' AND OLD.status IS DISTINCT FROM 'aprovada')
  EXECUTE FUNCTION auto_vincular_produtos_nova_revendedora();

-- PASSO 3: Criar trigger para INSERT (caso seja inserida já como aprovada)
DROP TRIGGER IF EXISTS trigger_vincular_produtos_revendedora_aprovada_insert ON resellers;
CREATE TRIGGER trigger_vincular_produtos_revendedora_aprovada_insert
  AFTER INSERT ON resellers
  FOR EACH ROW
  WHEN (NEW.status = 'aprovada')
  EXECUTE FUNCTION auto_vincular_produtos_nova_revendedora();

-- ============================================
-- PASSO 4: CORRIGIR REVENDEDORAS EXISTENTES QUE NÃO TÊM PRODUTOS
-- ============================================

-- Inserir produtos para revendedoras aprovadas que não têm nenhum produto
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
  100 AS margin_percent,          -- Margem 100%
  true AS is_active,              -- Ativo
  NOW() AS created_at,
  NOW() AS updated_at
FROM resellers r
CROSS JOIN produtos p
WHERE r.status = 'aprovada'       -- Só revendedoras aprovadas
  AND r.is_active = true          -- Só revendedoras ativas
  AND p.ativo = true              -- Só produtos ativos
  AND p.admin_aprovado = true     -- Só produtos aprovados
  AND NOT EXISTS (                -- Só se não existir vínculo
    SELECT 1 FROM reseller_products rp 
    WHERE rp.reseller_id = r.id 
    AND rp.product_id = p.id
  )
ON CONFLICT (reseller_id, product_id) DO NOTHING;

-- ============================================
-- VERIFICAR SE FUNCIONOU
-- ============================================
SELECT 
  r.name as revendedora,
  r.status,
  COUNT(rp.id) as total_produtos
FROM resellers r
LEFT JOIN reseller_products rp ON rp.reseller_id = r.id
WHERE r.status = 'aprovada'
GROUP BY r.id, r.name, r.status
ORDER BY r.name;
