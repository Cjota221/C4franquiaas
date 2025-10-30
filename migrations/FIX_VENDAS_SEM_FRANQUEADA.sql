-- ============================================================================
-- SCRIPT DE CORREÇÃO: Atualizar vendas antigas com franqueada_id correto
-- ============================================================================
-- Execute DEPOIS de rodar DEBUG_VENDAS.sql e confirmar o problema
-- ============================================================================

-- 🔧 CORREÇÃO AUTOMÁTICA:
-- Atualizar vendas que não têm franqueada_id
-- Buscar o user_id correto da franqueada através da loja

UPDATE vendas v
SET franqueada_id = f.user_id
FROM lojas l
JOIN franqueadas f ON l.franqueada_id = f.id
WHERE v.loja_id = l.id
AND v.franqueada_id IS NULL
AND f.user_id IS NOT NULL;

-- Verificar quantas vendas foram atualizadas
SELECT 
  COUNT(*) as vendas_corrigidas
FROM vendas
WHERE franqueada_id IS NOT NULL;

-- Mostrar vendas corrigidas
SELECT 
  v.id,
  v.created_at,
  v.cliente_nome,
  v.valor_total,
  v.franqueada_id,
  f.nome as franqueada_nome,
  l.nome as loja_nome
FROM vendas v
LEFT JOIN lojas l ON v.loja_id = l.id
LEFT JOIN franqueadas f ON v.franqueada_id = f.user_id
ORDER BY v.created_at DESC
LIMIT 20;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Todas as vendas devem ter franqueada_id preenchido
-- Vendas devem aparecer no painel da franqueada
-- Nome da franqueada deve aparecer no admin
