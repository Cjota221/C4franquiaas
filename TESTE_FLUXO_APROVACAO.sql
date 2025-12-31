-- ============================================
-- TESTE COMPLETO DO FLUXO DE APROVAÇÃO
-- ============================================
-- Execute estas queries no Supabase para testar
-- ============================================

-- 1️⃣ Criar produto de teste pendente de aprovação
INSERT INTO produtos (
  nome,
  descricao,
  preco_base,
  estoque,
  ativo,
  admin_aprovado,
  admin_rejeitado,
  eh_produto_novo,
  facilzap_id,
  id_externo,
  sincronizado_facilzap,
  ultima_sincronizacao
) VALUES (
  '🧪 TESTE - Produto Novo Para Aprovação',
  'Este é um produto de teste para validar o fluxo de aprovação',
  99.90,
  50,
  false,  -- Inativo até admin aprovar
  false,  -- Aguardando aprovação
  false,  -- Não rejeitado
  true,   -- É produto novo
  'TESTE-001',
  'TESTE-001',
  true,
  NOW()
)
RETURNING id, nome, ativo, admin_aprovado;

-- ============================================
-- 2️⃣ Verificar se produto aparece na view de pendentes
-- ============================================
SELECT 
  id,
  nome,
  preco_base,
  estoque,
  admin_aprovado,
  admin_rejeitado,
  eh_produto_novo
FROM produtos_pendentes_aprovacao
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 3️⃣ Verificar produtos no painel admin
-- ============================================
-- Acesse: https://seu-site.com/admin/produtos/pendentes
-- Deve aparecer o produto "🧪 TESTE - Produto Novo Para Aprovação"

-- ============================================
-- 4️⃣ Aprovar o produto de teste (via SQL ou pelo painel)
-- ============================================
-- Obtenha o user_id do admin:
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin'
LIMIT 1;

-- Copie o ID do admin e execute:
/*
SELECT * FROM aprovar_produtos(
  ARRAY['COLE_AQUI_O_ID_DO_PRODUTO_TESTE']::UUID[],
  'COLE_AQUI_O_ID_DO_ADMIN'::UUID,
  'Teste de aprovação via SQL'
);
*/

-- ============================================
-- 5️⃣ Verificar se produto foi aprovado e vinculado
-- ============================================
SELECT 
  p.nome,
  p.ativo,
  p.admin_aprovado,
  p.admin_data_aprovacao,
  COUNT(rp.id) as franqueadas_vinculadas
FROM produtos p
LEFT JOIN reseller_products rp ON rp.product_id = p.id
WHERE p.nome LIKE '%TESTE%'
GROUP BY p.id, p.nome, p.ativo, p.admin_aprovado, p.admin_data_aprovacao;

-- ============================================
-- 6️⃣ Verificar produtos novos disponíveis para franqueadas
-- ============================================
SELECT 
  franqueada_nome,
  produto_nome,
  preco_base,
  margin_percent,
  is_active,
  vista_pela_franqueada
FROM produtos_novos_franqueada
ORDER BY data_vinculo DESC
LIMIT 10;

-- ============================================
-- 7️⃣ Limpar teste (EXECUTAR DEPOIS)
-- ============================================
/*
-- Deletar produto de teste
DELETE FROM reseller_products 
WHERE product_id IN (
  SELECT id FROM produtos WHERE nome LIKE '%TESTE%'
);

DELETE FROM produtos 
WHERE nome LIKE '%TESTE%';
*/

-- ============================================
-- 🎯 CHECKLIST DE TESTES
-- ============================================
-- [ ] 1. Produto criado com admin_aprovado = false
-- [ ] 2. Produto aparece em produtos_pendentes_aprovacao
-- [ ] 3. Produto aparece em /admin/produtos/pendentes
-- [ ] 4. Aprovar produto (pelo painel ou SQL)
-- [ ] 5. Produto fica ativo = true, admin_aprovado = true
-- [ ] 6. Produto vinculado a todas franqueadas aprovadas
-- [ ] 7. Produto aparece em produtos_novos_franqueada
-- [ ] 8. Produto aparece em /revendedora/produtos/novos
-- [ ] 9. Franqueada ativa com margem customizada
-- [ ] 10. Produto aparece no catálogo público
