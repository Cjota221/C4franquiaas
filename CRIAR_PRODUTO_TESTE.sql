-- ============================================
-- LIMPAR PRODUTOS DE TESTE ANTERIORES
-- ============================================

-- Deletar de TODAS as tabelas relacionadas na ordem correta
DELETE FROM produtos_franqueadas 
WHERE produto_id IN (
  SELECT id FROM produtos WHERE id_externo LIKE 'TESTE-%'
);

DELETE FROM reseller_products 
WHERE product_id IN (
  SELECT id FROM produtos WHERE id_externo LIKE 'TESTE-%'
);

DELETE FROM produtos 
WHERE id_externo LIKE 'TESTE-%';

-- ============================================
-- CRIAR NOVO PRODUTO DE TESTE
-- ============================================

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
  '🧪 TESTE FLUXO APROVAÇÃO - ' || NOW()::TEXT,
  'Produto de teste criado automaticamente para validar fluxo',
  99.90,
  50,
  false,  -- Inativo até admin aprovar
  false,  -- Aguardando aprovação
  false,  -- Não rejeitado
  true,   -- É produto novo
  'TESTE-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'TESTE-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  true,
  NOW()
)
RETURNING 
  id, 
  nome, 
  id_externo,
  ativo, 
  admin_aprovado,
  '✅ Produto criado! Copie o ID acima para os próximos testes' as proximo_passo;

-- ============================================
-- VERIFICAR SE APARECE NA VIEW
-- ============================================
SELECT 
  id,
  nome,
  preco_base,
  estoque,
  admin_aprovado,
  admin_rejeitado,
  eh_produto_novo,
  created_at
FROM produtos_pendentes_aprovacao
WHERE nome LIKE '%TESTE%'
ORDER BY created_at DESC;
