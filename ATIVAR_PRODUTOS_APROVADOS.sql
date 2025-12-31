-- ============================================
-- CORREÇÃO: Ativar produtos aprovados com estoque
-- ============================================
-- Execute este SQL para ativar os 303 produtos
-- que estão aprovados mas inativos
-- ============================================

-- Ativar produtos aprovados que têm estoque
UPDATE produtos
SET ativo = true
WHERE admin_aprovado = true
  AND estoque > 0
  AND (desativado_manual IS NULL OR desativado_manual = false)
  AND ativo = false;

-- Verificar resultado
SELECT 
  COUNT(*) FILTER (WHERE ativo = true) as ativos,
  COUNT(*) FILTER (WHERE admin_aprovado = true) as aprovados,
  COUNT(*) FILTER (WHERE ativo = false AND admin_aprovado = true AND estoque > 0) as ainda_inativos,
  COUNT(*) as total
FROM produtos;

-- Ver detalhes dos produtos que continuam inativos (se houver)
SELECT 
  id,
  nome,
  estoque,
  ativo,
  admin_aprovado,
  desativado_manual,
  CASE 
    WHEN estoque = 0 THEN '❌ Sem estoque'
    WHEN desativado_manual = true THEN '🚫 Desativado manualmente'
    ELSE '❓ Outro motivo'
  END as motivo_inativo
FROM produtos
WHERE admin_aprovado = true
  AND ativo = false
ORDER BY estoque DESC, nome
LIMIT 20;
