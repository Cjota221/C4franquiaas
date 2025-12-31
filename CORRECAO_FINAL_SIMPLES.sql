-- ============================================
-- 🔧 CORREÇÃO INTELIGENTE: UPDATE SEM QUEBRAR TRIGGERS
-- ============================================
-- SOLUÇÃO: Fazer UPDATE linha por linha para evitar erros em triggers
-- ============================================

-- OPÇÃO 1: UPDATE SIMPLES (tente primeiro)
-- Se der erro, vá para OPÇÃO 2
-- ============================================

UPDATE produtos
SET 
  ativo = true,
  ultima_sincronizacao = NOW()
WHERE 
  estoque > 0 
  AND ativo = false
  AND id IN (
    -- Pegar apenas IDs que temos certeza que existem
    SELECT id FROM produtos 
    WHERE estoque > 0 AND ativo = false
    LIMIT 500  -- Fazer em lotes de 500
  );

-- Se funcionar, execute novamente até retornar "UPDATE 0"
-- ============================================


-- OPÇÃO 2: SE OPÇÃO 1 DER ERRO, USE ESTA
-- Atualiza campo por campo para isolar o problema
-- ============================================

-- Primeiro, só atualizar o campo "ativo"
UPDATE produtos
SET ativo = true
WHERE estoque > 0 AND ativo = false;

-- Depois, atualizar timestamp separadamente
UPDATE produtos
SET ultima_sincronizacao = NOW()
WHERE estoque > 0 AND ativo = true AND ultima_sincronizacao IS NULL;

-- ============================================


-- VERIFICAR RESULTADO
SELECT 
  COUNT(*) FILTER (WHERE ativo = true AND estoque > 0) as ativos_com_estoque,
  COUNT(*) FILTER (WHERE ativo = false AND estoque > 0) as ainda_desativados
FROM produtos;

-- ESPERADO: ainda_desativados = 0
-- ============================================


-- VER EXEMPLOS
SELECT id, nome, estoque, ativo, ultima_sincronizacao
FROM produtos
WHERE estoque > 0
ORDER BY ultima_sincronizacao DESC NULLS LAST
LIMIT 10;
