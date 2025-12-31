-- ============================================
-- 🚨 DIAGNÓSTICO RÁPIDO (3 MINUTOS)
-- ============================================
-- Execute estas 3 queries para descobrir o problema
-- ============================================

-- ❓ PERGUNTA 1: Quando foi a última sincronização?
-- ============================================
SELECT 
  MAX(ultima_sincronizacao) as ultima_sync,
  COUNT(*) as total_produtos,
  EXTRACT(EPOCH FROM (NOW() - MAX(ultima_sincronizacao)))/3600 as horas_atras
FROM produtos
WHERE ultima_sincronizacao IS NOT NULL;

-- 📝 RESULTADO ESPERADO:
-- Se "horas_atras" for > 2, significa que ninguém clicou no botão
-- ============================================


-- ❓ PERGUNTA 2: Produtos estão com dados do FácilZap?
-- ============================================
SELECT 
  COUNT(*) as total_produtos,
  COUNT(facilzap_id) as com_facilzap_id,
  COUNT(CASE WHEN sincronizado_facilzap = true THEN 1 END) as marcados_como_sincronizados
FROM produtos;

-- 📝 RESULTADO ESPERADO:
-- Os 3 números devem ser parecidos (ex: 100, 98, 100)
-- ============================================


-- ❓ PERGUNTA 3: Há produtos inconsistentes?
-- ============================================
SELECT 
  COUNT(*) as total_inconsistentes,
  'Produtos com estoque mas inativos' as tipo
FROM produtos
WHERE estoque > 0 AND ativo = false

UNION ALL

SELECT 
  COUNT(*) as total_inconsistentes,
  'Produtos sem estoque mas ativos' as tipo
FROM produtos
WHERE estoque = 0 AND ativo = true;

-- 📝 RESULTADO ESPERADO:
-- Ambos devem ser 0 ou número muito baixo
-- ============================================


-- 🎯 DIAGNÓSTICO EXTRA: Ver últimos produtos atualizados
-- ============================================
SELECT 
  id,
  nome,
  estoque,
  ativo,
  ultima_sincronizacao,
  updated_at,
  CASE 
    WHEN ultima_sincronizacao IS NULL THEN '❌ Nunca sincronizado'
    WHEN ultima_sincronizacao < NOW() - INTERVAL '24 hours' THEN '⚠️ Desatualizado (>24h)'
    WHEN ultima_sincronizacao < NOW() - INTERVAL '1 hour' THEN '⏰ Meio desatualizado (>1h)'
    ELSE '✅ Atualizado recentemente'
  END as status_sync
FROM produtos
ORDER BY ultima_sincronizacao DESC NULLS LAST
LIMIT 10;
