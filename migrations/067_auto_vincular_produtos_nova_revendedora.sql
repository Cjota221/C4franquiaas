-- ============================================
-- MIGRATION: Vincular produtos automaticamente quando revendedora for APROVADA
-- Data: 15/01/2026
-- ============================================
-- PROBLEMA: Quando nova revendedora é aprovada, ela não recebe os produtos
-- SOLUÇÃO: Trigger que vincula todos os produtos ativos quando status muda para 'aprovada'
-- ============================================

-- Função que vincula TODOS os produtos à revendedora recém aprovada
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

    -- Criar notificação de boas-vindas
    INSERT INTO reseller_notifications (
      reseller_id,
      type,
      title,
      message,
      metadata,
      action_url,
      action_label
    ) VALUES (
      NEW.id,
      'welcome',
      '🎉 Bem-vinda à C4 Franquias!',
      'Seu cadastro foi aprovado! Você já tem acesso a todos os ' || v_count || ' produtos com margem de 100%. Comece a vender agora!',
      jsonb_build_object('produtos_vinculados', v_count),
      '/revendedora/produtos',
      'Ver Produtos'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa quando revendedora é aprovada
DROP TRIGGER IF EXISTS trigger_vincular_produtos_revendedora_aprovada ON resellers;
CREATE TRIGGER trigger_vincular_produtos_revendedora_aprovada
  AFTER UPDATE OF status ON resellers
  FOR EACH ROW
  WHEN (NEW.status = 'aprovada' AND OLD.status != 'aprovada')
  EXECUTE FUNCTION auto_vincular_produtos_nova_revendedora();

-- Também criar trigger para INSERT (caso seja inserida já como aprovada)
DROP TRIGGER IF EXISTS trigger_vincular_produtos_revendedora_aprovada_insert ON resellers;
CREATE TRIGGER trigger_vincular_produtos_revendedora_aprovada_insert
  AFTER INSERT ON resellers
  FOR EACH ROW
  WHEN (NEW.status = 'aprovada')
  EXECUTE FUNCTION auto_vincular_produtos_nova_revendedora();

-- ============================================
-- SCRIPT DE CORREÇÃO: Vincular produtos às revendedoras que já foram aprovadas
-- (para corrigir revendedoras que já existem sem produtos)
-- ============================================

-- Inserir produtos para revendedoras aprovadas que não têm produtos
INSERT INTO reseller_products (
  reseller_id,
  product_id,
  margin_percent,
  is_active,
  created_at,
  updated_at
)
SELECT 
  r.id as reseller_id,
  p.id as product_id,
  100 as margin_percent,     -- 🎯 Margem padrão de 100%
  true as is_active,         -- ✅ Produto ATIVO
  NOW() as created_at,
  NOW() as updated_at
FROM produtos p
CROSS JOIN resellers r
WHERE p.admin_aprovado = true      -- Só produtos aprovados pelo admin
  AND p.ativo = true               -- Só produtos ativos
  AND r.status = 'aprovada'        -- Só revendedoras aprovadas
  AND r.is_active = true           -- Só revendedoras ativas
  AND NOT EXISTS (                 -- Só se ainda não estiver vinculado
    SELECT 1 
    FROM reseller_products rp2 
    WHERE rp2.product_id = p.id 
      AND rp2.reseller_id = r.id
  );

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Ver quantos produtos cada revendedora tem agora
SELECT 
  r.name as revendedora,
  r.slug,
  r.status,
  COUNT(rp.product_id) as total_produtos,
  COUNT(CASE WHEN rp.is_active = true THEN 1 END) as produtos_ativos
FROM resellers r
LEFT JOIN reseller_products rp ON rp.reseller_id = r.id
WHERE r.status = 'aprovada'
GROUP BY r.id, r.name, r.slug, r.status
ORDER BY r.name;
