-- ============================================
-- Migration 049: Fluxo de Aprovação de Produtos
-- ============================================
-- Descrição: Adiciona sistema de aprovação em 2 níveis:
--   1. Admin aprova produtos vindos do FácilZap
--   2. Franqueada ativa produtos no site dela
-- Data: 2025-12-31
-- ============================================

-- PASSO 1: Adicionar campos de aprovação na tabela produtos
-- ============================================
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS admin_aprovado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_rejeitado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_data_aprovacao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_aprovado_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS admin_notas TEXT,
ADD COLUMN IF NOT EXISTS eh_produto_novo BOOLEAN DEFAULT true;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_produtos_admin_aprovado ON produtos(admin_aprovado);
CREATE INDEX IF NOT EXISTS idx_produtos_admin_rejeitado ON produtos(admin_rejeitado);
CREATE INDEX IF NOT EXISTS idx_produtos_eh_novo ON produtos(eh_produto_novo);
CREATE INDEX IF NOT EXISTS idx_produtos_pendente_aprovacao ON produtos(admin_aprovado, admin_rejeitado) WHERE admin_aprovado = false AND admin_rejeitado = false;

-- PASSO 2: Marcar produtos EXISTENTES como aprovados
-- ============================================
-- Produtos que já existem devem ser considerados aprovados
-- para não quebrar o sistema atual
UPDATE produtos
SET 
  admin_aprovado = true,
  admin_data_aprovacao = NOW(),
  eh_produto_novo = false
WHERE admin_aprovado = false;

-- PASSO 3: Adicionar campo para rastrear produtos novos nas franqueadas
-- ============================================
ALTER TABLE reseller_products
ADD COLUMN IF NOT EXISTS vista_pela_franqueada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_ativacao TIMESTAMPTZ;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_reseller_products_novos ON reseller_products(is_active, vista_pela_franqueada);

-- PASSO 4: Marcar produtos EXISTENTES como vistos
-- ============================================
UPDATE reseller_products
SET vista_pela_franqueada = true
WHERE is_active = true;

-- PASSO 5: Criar view para produtos pendentes de aprovação
-- ============================================
CREATE OR REPLACE VIEW produtos_pendentes_aprovacao AS
SELECT 
  p.id,
  p.nome,
  p.codigo_barras,
  p.preco_base,
  p.estoque,
  p.imagem,
  p.categorias,
  p.descricao,
  p.ultima_sincronizacao,
  p.created_at
FROM produtos p
WHERE p.admin_aprovado = false 
  AND p.admin_rejeitado = false
ORDER BY p.ultima_sincronizacao DESC NULLS LAST, p.created_at DESC;

-- PASSO 6: Criar view para produtos novos por franqueada
-- ============================================
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
  AND rp.is_active = false
  AND rp.vista_pela_franqueada = false
ORDER BY rp.created_at DESC;

-- PASSO 7: Função para aprovar produtos (Admin)
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
    AND admin_aprovado = false; -- Só aprovar se ainda não foi aprovado

  -- Vincular produtos aprovados às franqueadas aprovadas
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
    p.preco_base * 1.20, -- Margem padrão 20%
    20, -- Margem percentual
    false, -- Franqueada precisa ativar
    false, -- Franqueada ainda não viu
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

  -- Criar notificação para franqueadas
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
    'Produtos foram aprovados e estão aguardando sua ativação',
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

-- PASSO 8: Função para rejeitar produtos (Admin)
-- ============================================
CREATE OR REPLACE FUNCTION rejeitar_produtos(
  produto_ids UUID[],
  admin_id UUID,
  motivo TEXT
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
    admin_aprovado = false,
    admin_rejeitado = true,
    admin_data_aprovacao = NOW(),
    admin_aprovado_por = admin_id,
    admin_notas = motivo,
    ativo = false
  WHERE id = ANY(produto_ids);

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

-- PASSO 9: Função para franqueada ativar produto
-- ============================================
CREATE OR REPLACE FUNCTION ativar_produto_franqueada(
  p_reseller_id UUID,
  p_product_id UUID,
  p_margem_percent DECIMAL DEFAULT NULL,
  p_custom_price DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_preco_base DECIMAL;
BEGIN
  -- Buscar preço base do produto
  SELECT preco_base INTO v_preco_base
  FROM produtos
  WHERE id = p_product_id;

  -- Atualizar vinculo
  UPDATE reseller_products
  SET 
    is_active = true,
    vista_pela_franqueada = true,
    data_ativacao = NOW(),
    margin_percent = COALESCE(p_margem_percent, margin_percent),
    custom_price = COALESCE(
      p_custom_price, 
      v_preco_base * (1 + COALESCE(p_margem_percent, margin_percent) / 100.0)
    ),
    updated_at = NOW()
  WHERE reseller_id = p_reseller_id
    AND product_id = p_product_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- PASSO 10: Comentários
-- ============================================
COMMENT ON COLUMN produtos.admin_aprovado IS 'Se admin aprovou produto para ir às franqueadas';
COMMENT ON COLUMN produtos.admin_rejeitado IS 'Se admin rejeitou produto (ex: Kit Empreendedora)';
COMMENT ON COLUMN produtos.admin_notas IS 'Observações do admin (motivo de rejeição, etc)';
COMMENT ON COLUMN produtos.eh_produto_novo IS 'Se é um produto recém-aprovado (badge NOVO)';
COMMENT ON COLUMN reseller_products.vista_pela_franqueada IS 'Se franqueada já viu o produto na lista de novos';
COMMENT ON COLUMN reseller_products.data_ativacao IS 'Quando franqueada ativou o produto no site dela';

-- PASSO 11: RLS Policies
-- ============================================

-- Admin pode ver todos os produtos
DROP POLICY IF EXISTS "Admin vê todos produtos" ON produtos;
CREATE POLICY "Admin vê todos produtos"
ON produtos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Admin pode atualizar produtos
DROP POLICY IF EXISTS "Admin atualiza produtos" ON produtos;
CREATE POLICY "Admin atualiza produtos"
ON produtos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- PASSO 12: Verificação final
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 049 aplicada com sucesso!';
  RAISE NOTICE '📊 Campos adicionados: admin_aprovado, admin_rejeitado, eh_produto_novo';
  RAISE NOTICE '🔧 Funções criadas: aprovar_produtos(), rejeitar_produtos(), ativar_produto_franqueada()';
  RAISE NOTICE '📋 Views criadas: produtos_pendentes_aprovacao, produtos_novos_franqueada';
END $$;

-- ============================================
-- 🚀 EXECUTE ESTE SQL NO SUPABASE
-- ============================================
