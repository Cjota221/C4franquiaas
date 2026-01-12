-- ============================================
-- Script de Pré-Visualização: Produtos Excluídos do FácilZap
-- ============================================
-- Execute este script NO SUPABASE (SQL Editor) antes de rodar a sincronização
-- para ver quais produtos serão afetados
-- ============================================

-- ============================================
-- SEÇÃO 1: VISÃO GERAL DO SISTEMA
-- ============================================

-- 1.1 Contar total de produtos por status
SELECT 
  'Total de Produtos' as metrica,
  COUNT(*) as quantidade
FROM produtos
UNION ALL
SELECT 
  'Produtos ATIVOS' as metrica,
  COUNT(*) as quantidade
FROM produtos WHERE ativo = true
UNION ALL
SELECT 
  'Produtos INATIVOS' as metrica,
  COUNT(*) as quantidade
FROM produtos WHERE ativo = false
UNION ALL
SELECT 
  'Produtos do FácilZap (com id_externo)' as metrica,
  COUNT(*) as quantidade
FROM produtos WHERE id_externo IS NOT NULL OR facilzap_id IS NOT NULL;

-- ============================================
-- SEÇÃO 2: PRODUTOS DESATIVADOS RECENTEMENTE
-- (Podem ter sido excluídos do FácilZap)
-- ============================================

-- 2.1 Produtos desativados nos últimos 7 dias
SELECT 
  id,
  nome,
  id_externo,
  facilzap_id,
  estoque,
  ativo,
  ultima_sincronizacao,
  created_at
FROM produtos
WHERE ativo = false
  AND (id_externo IS NOT NULL OR facilzap_id IS NOT NULL)
  AND ultima_sincronizacao > NOW() - INTERVAL '7 days'
ORDER BY ultima_sincronizacao DESC
LIMIT 50;

-- ============================================
-- SEÇÃO 3: HISTÓRICO DE EXCLUSÕES
-- ============================================

-- 3.1 Logs de exclusão via SYNC
SELECT 
  created_at,
  tipo,
  descricao,
  payload->'total_excluidos' as total_excluidos,
  payload->'produtos' as produtos_afetados
FROM logs_sincronizacao
WHERE tipo = 'produtos_excluidos_facilzap'
ORDER BY created_at DESC
LIMIT 10;

-- 3.2 Logs de exclusão via WEBHOOK
SELECT 
  created_at,
  tipo,
  descricao,
  produto_id,
  facilzap_id
FROM logs_sincronizacao
WHERE tipo = 'webhook_produto_excluido'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- SEÇÃO 4: VERIFICAR VINCULAÇÕES AFETADAS
-- ============================================

-- 4.1 Produtos inativos que ainda têm vinculação com franqueadas
SELECT 
  p.id,
  p.nome,
  p.id_externo,
  p.ativo as produto_ativo,
  pf.franqueada_id,
  pfp.ativo_no_site
FROM produtos p
JOIN produtos_franqueadas pf ON p.id = pf.produto_id
JOIN produtos_franqueadas_precos pfp ON pf.id = pfp.produto_franqueada_id
WHERE p.ativo = false
  AND pfp.ativo_no_site = true  -- PROBLEMA: produto inativo mas ativo na franqueada
ORDER BY p.nome
LIMIT 20;

-- 4.2 Produtos inativos que ainda estão ativos para revendedoras
SELECT 
  p.id,
  p.nome,
  p.id_externo,
  p.ativo as produto_ativo,
  rp.reseller_id,
  rp.is_active as ativo_revendedora
FROM produtos p
JOIN reseller_products rp ON p.id = rp.product_id
WHERE p.ativo = false
  AND rp.is_active = true  -- PROBLEMA: produto inativo mas ativo na revendedora
ORDER BY p.nome
LIMIT 20;

-- ============================================
-- SEÇÃO 5: QUERIES PARA CORREÇÃO MANUAL
-- (Use com cuidado!)
-- ============================================

-- 5.1 PREVIEW: Desativar nas franqueadas produtos que estão inativos
-- (Execute apenas o SELECT primeiro para verificar)
/*
SELECT 
  pfp.id,
  p.nome,
  pf.franqueada_id,
  pfp.ativo_no_site
FROM produtos_franqueadas_precos pfp
JOIN produtos_franqueadas pf ON pfp.produto_franqueada_id = pf.id
JOIN produtos p ON pf.produto_id = p.id
WHERE p.ativo = false AND pfp.ativo_no_site = true;

-- Se estiver OK, rode o UPDATE:
UPDATE produtos_franqueadas_precos pfp
SET ativo_no_site = false
FROM produtos_franqueadas pf
JOIN produtos p ON pf.produto_id = p.id
WHERE pfp.produto_franqueada_id = pf.id
  AND p.ativo = false
  AND pfp.ativo_no_site = true;
*/

-- 5.2 PREVIEW: Desativar nas revendedoras produtos que estão inativos
/*
SELECT 
  rp.id,
  p.nome,
  rp.reseller_id,
  rp.is_active
FROM reseller_products rp
JOIN produtos p ON rp.product_id = p.id
WHERE p.ativo = false AND rp.is_active = true;

-- Se estiver OK, rode o UPDATE:
UPDATE reseller_products rp
SET is_active = false
FROM produtos p
WHERE rp.product_id = p.id
  AND p.ativo = false
  AND rp.is_active = true;
*/

-- ============================================
-- SEÇÃO 6: ESTATÍSTICAS DA ÚLTIMA SINCRONIZAÇÃO
-- ============================================

SELECT 
  created_at,
  tipo,
  descricao,
  payload
FROM logs_sincronizacao
WHERE tipo IN ('produto_atualizado', 'produtos_excluidos_facilzap', 'estoque_zerado')
ORDER BY created_at DESC
LIMIT 20;
