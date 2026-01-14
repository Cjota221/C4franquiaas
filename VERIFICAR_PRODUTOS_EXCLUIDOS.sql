-- ============================================
-- VERIFICAÇÃO URGENTE: Produtos foram excluídos?
-- ============================================

-- 1. Quantos produtos excluídos estão registrados?
SELECT COUNT(*) as total_registros_excluidos 
FROM produtos_excluidos;

-- 2. Últimos 10 produtos marcados como excluídos
SELECT 
  id_externo,
  excluido_por,
  excluido_em,
  NOW() - excluido_em as tempo_desde_exclusao
FROM produtos_excluidos
ORDER BY excluido_em DESC
LIMIT 10;

-- 3. Esses produtos excluídos ainda existem na tabela produtos?
SELECT 
  pe.id_externo,
  pe.excluido_em,
  p.id as produto_existe,
  p.nome,
  p.ativo
FROM produtos_excluidos pe
LEFT JOIN produtos p ON p.id_externo = pe.id_externo
WHERE pe.excluido_em > NOW() - INTERVAL '10 minutes'
ORDER BY pe.excluido_em DESC;

-- 4. Se produtos existem = foram RECRIADOS!
-- Procure por produtos que:
-- - Estão em produtos_excluidos
-- - MAS também estão na tabela produtos
-- Isso prova que foram recriados

SELECT 
  'RECRIADOS!' as status,
  COUNT(*) as total_produtos_recriados
FROM produtos_excluidos pe
INNER JOIN produtos p ON p.id_externo = pe.id_externo
WHERE pe.excluido_em > NOW() - INTERVAL '10 minutes';
