-- ============================================
-- Migration 051: Corrigir Produtos Novos - Vir Desativados
-- ============================================
-- Descrição: Produtos novos devem vir DESATIVADOS e SEM margem pré-definida
-- Data: 2026-01-01
-- ============================================

-- PASSO 1: Recriar função aprovar_produtos com produtos desativados
-- ============================================
CREATE OR REPLACE FUNCTION aprovar_produtos(
  produto_ids UUID[],
  admin_id UUID,
  notas_texto TEXT DEFAULT NULL
)
RETURNS TABLE(
  produto_id UUID,
  nome TEXT,
  sucesso BOOLEAN
) AS $$
BEGIN
  -- Atualizar produtos
  UPDATE produtos
  SET 
    admin_aprovado = true,
    admin_rejeitado = false,
    admin_data_aprovacao = NOW(),
    admin_aprovado_por = admin_id,
    admin_notas = notas_texto,
    ativo = true, -- Ativar produto quando admin aprovar
    eh_produto_novo = true
  WHERE id = ANY(produto_ids)
    AND admin_aprovado = false;

  -- Vincular produtos aprovados às revendedoras aprovadas
  -- 🆕 MUDANÇA: Produtos vêm DESATIVADOS e SEM margem pré-definida
  INSERT INTO reseller_products (
    reseller_id,
    product_id,
    custom_price,
    margin_percent,
    is_active,
    vista_pela_franqueada,
    created_at,
    updated_at
  )
  SELECT 
    r.id,
    p.id,
    NULL, -- 🆕 SEM preço customizado inicial
    0, -- 🆕 SEM margem pré-definida (revendedora precisa definir)
    false, -- 🆕 DESATIVADO (revendedora precisa ativar após definir margem)
    false, -- Revendedora ainda não viu
    NOW(),
    NOW()
  FROM produtos p
  CROSS JOIN resellers r
  WHERE p.id = ANY(produto_ids)
    AND r.status = 'aprovada'
    AND NOT EXISTS (
      SELECT 1 FROM reseller_products rp2
      WHERE rp2.product_id = p.id AND rp2.reseller_id = r.id
    );

  -- Criar notificação para revendedoras
  INSERT INTO reseller_notifications (
    reseller_id,
    type,
    title,
    message,
    metadata,
    created_at
  )
  SELECT 
    r.id,
    'new_products',
    '🆕 Novos produtos disponíveis!',
    'Produtos foram aprovados e estão aguardando sua ativação. Defina sua margem de lucro!',
    jsonb_build_object('product_ids', produto_ids),
    NOW()
  FROM resellers r
  WHERE r.status = 'aprovada';

  -- Retornar resultado
  RETURN QUERY
  SELECT 
    p.id,
    p.nome,
    true as sucesso
  FROM produtos p
  WHERE p.id = ANY(produto_ids);
END;
$$ LANGUAGE plpgsql;

-- PASSO 2: Atualizar view produtos_novos_franqueada
-- ============================================
-- Produtos novos são aqueles DESATIVADOS e com margem ZERO
CREATE OR REPLACE VIEW produtos_novos_franqueada AS
SELECT 
  rp.reseller_id,
  r.name as franqueada_nome,
  p.id as produto_id,
  p.nome as produto_nome,
  p.preco_base,
  p.estoque,
  p.imagem,
  p.categorias,
  rp.custom_price,
  rp.margin_percent,
  rp.is_active,
  rp.vista_pela_franqueada,
  rp.created_at as data_vinculo
FROM reseller_products rp
JOIN produtos p ON p.id = rp.product_id
JOIN resellers r ON r.id = rp.reseller_id
WHERE p.admin_aprovado = true
  AND p.ativo = true
  AND rp.is_active = false -- Produto está desativado
  AND (rp.margin_percent = 0 OR rp.margin_percent IS NULL) -- Sem margem definida
ORDER BY rp.created_at DESC;

-- PASSO 3: Comentários
-- ============================================
COMMENT ON FUNCTION aprovar_produtos IS 'Aprova produtos e vincula às revendedoras com margin_percent=0 e is_active=false';
COMMENT ON VIEW produtos_novos_franqueada IS 'View de produtos novos que precisam de margem definida pela revendedora';

-- PASSO 4: Verificação final
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 051 aplicada com sucesso!';
  RAISE NOTICE '🆕 Produtos novos agora vêm DESATIVADOS e SEM margem pré-definida';
  RAISE NOTICE '📊 Revendedora precisa definir margem ANTES de ativar';
END $$;

-- ============================================
-- 🚀 EXECUTE ESTE SQL NO SUPABASE
-- ============================================
