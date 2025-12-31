-- ============================================
-- DIAGNÓSTICO: Por que 106 produtos estão inativos?
-- ============================================

-- Ver detalhes dos 106 produtos inativos
SELECT 
  id,
  nome,
  estoque,
  ativo,
  admin_aprovado,
  desativado_manual,
  ultima_sincronizacao,
  CASE 
    WHEN estoque = 0 THEN '❌ Sem estoque'
    WHEN desativado_manual = true THEN '🚫 Desativado manualmente'
    WHEN estoque IS NULL THEN '❓ Estoque NULL'
    ELSE '✅ Com estoque mas inativo (BUG)'
  END as motivo_inativo
FROM produtos
WHERE admin_aprovado = true
  AND ativo = false
ORDER BY 
  CASE 
    WHEN estoque > 0 THEN 1  -- Produtos com estoque primeiro (URGENTE)
    WHEN estoque = 0 THEN 2  -- Sem estoque
    ELSE 3                    -- NULL
  END,
  estoque DESC,
  nome
LIMIT 50;

-- ============================================
-- Resumo por motivo
-- ============================================
SELECT 
  CASE 
    WHEN estoque = 0 THEN '❌ Sem estoque'
    WHEN desativado_manual = true THEN '🚫 Desativado manual'
    WHEN estoque IS NULL THEN '❓ Estoque NULL'
    ELSE '✅ Com estoque (BUG)'
  END as motivo,
  COUNT(*) as quantidade,
  SUM(CASE WHEN estoque > 0 THEN estoque ELSE 0 END) as estoque_total
FROM produtos
WHERE admin_aprovado = true
  AND ativo = false
GROUP BY 
  CASE 
    WHEN estoque = 0 THEN '❌ Sem estoque'
    WHEN desativado_manual = true THEN '🚫 Desativado manual'
    WHEN estoque IS NULL THEN '❓ Estoque NULL'
    ELSE '✅ Com estoque (BUG)'
  END
ORDER BY quantidade DESC;

-- ============================================
-- SE HOUVER PRODUTOS COM ESTOQUE MAS INATIVOS:
-- FORÇAR ATIVAÇÃO (ignorar desativado_manual)
-- ============================================
-- DESCOMENTE ABAIXO APENAS SE O RESUMO MOSTRAR PRODUTOS COM ESTOQUE:

/*
UPDATE produtos
SET 
  ativo = true,
  desativado_manual = false  -- Resetar flag manual
WHERE admin_aprovado = true
  AND ativo = false
  AND estoque > 0;

SELECT 'Produtos reativados: ' || COUNT(*) as resultado
FROM produtos
WHERE admin_aprovado = true
  AND ativo = true
  AND estoque > 0;
*/
