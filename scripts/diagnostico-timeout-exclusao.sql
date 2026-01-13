-- ============================================
-- DIAGNÓSTICO RÁPIDO: Verificar Timeout em Exclusão
-- ============================================
-- Execute este script ANTES da correção para confirmar o problema

-- 1️⃣ VERIFICAR ÍNDICES ATUAIS
-- ============================================
SELECT 
  '🔍 ÍNDICES EM reseller_products' as status,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'reseller_products'
ORDER BY indexname;

-- ❌ SE NÃO APARECER 'idx_reseller_products_product_id' → PROBLEMA CONFIRMADO!

-- 2️⃣ CONTAR REGISTROS (pode demorar)
-- ============================================
SELECT 
  '📊 VOLUME DE DADOS' as status,
  (SELECT COUNT(*) FROM reseller_products) as total_reseller_products,
  (SELECT COUNT(*) FROM produtos) as total_produtos,
  (SELECT COUNT(*) FROM produto_categorias) as total_categorias,
  (SELECT COUNT(*) FROM produtos_franqueadas) as total_franqueadas;

-- ⚠️ Se reseller_products > 10.000 registros → Alta prioridade para índice

-- 3️⃣ VERIFICAR STATEMENT TIMEOUT ATUAL
-- ============================================
SELECT 
  '⏱️ TIMEOUT ATUAL' as status,
  name,
  setting || ' ' || unit as valor
FROM pg_settings 
WHERE name = 'statement_timeout';

-- Default: 30000ms (30 segundos)

-- 4️⃣ VERIFICAR ÚLTIMOS ERROS DE EXCLUSÃO
-- ============================================
SELECT 
  '❌ ÚLTIMOS ERROS' as status,
  tipo,
  descricao,
  erro,
  created_at
FROM logs_sincronizacao
WHERE tipo = 'produtos_excluidos_admin'
  AND sucesso = false
ORDER BY created_at DESC
LIMIT 10;

-- 5️⃣ SIMULAR QUERY DE EXCLUSÃO (SEM EXECUTAR)
-- ============================================
EXPLAIN ANALYZE
SELECT * FROM reseller_products 
WHERE product_id IN (
  SELECT id FROM produtos LIMIT 10
);

-- 🔍 PROCURE POR:
-- - "Seq Scan" → Problema! (deveria ser "Index Scan")
-- - "Execution Time" > 100ms → Lento sem índice

-- ============================================
-- RESUMO DO DIAGNÓSTICO
-- ============================================
-- ✅ Se aparecer índice 'idx_reseller_products_product_id' → OK, problema já resolvido
-- ❌ Se NÃO aparecer → APLICAR MIGRATION 060 URGENTE
-- ⚠️ Se Seq Scan → Índice ausente ou não está sendo usado
-- 🔥 Se Execution Time > 1000ms → Performance crítica

-- PRÓXIMO PASSO: Aplicar migrations/060_fix_delete_timeout_indices.sql
