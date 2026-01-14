-- ============================================
-- TESTE: Exclusão DIRETA sem usar função
-- ============================================
-- Execute PASSO A PASSO

-- PASSO 1: Escolher um produto inativo para teste
SELECT id, nome, id_externo, ativo
FROM produtos
WHERE ativo = false
LIMIT 1;

-- ⚠️ COPIE O ID e ID_EXTERNO acima

-- PASSO 2: Deletar manualmente (SUBSTITUA os valores)
/*
BEGIN;

-- Marcar como excluído
INSERT INTO produtos_excluidos (id_externo, excluido_por)
VALUES ('ID_EXTERNO_AQUI', 'teste_manual')
ON CONFLICT (id_externo) DO UPDATE 
SET excluido_em = NOW(), excluido_por = 'teste_manual';

-- Deletar registros filhos
DELETE FROM reseller_products WHERE product_id = 'UUID_AQUI';
DELETE FROM produto_categorias WHERE produto_id = 'UUID_AQUI';
DELETE FROM produtos_franqueadas_precos 
WHERE produto_franqueada_id IN (
  SELECT id FROM produtos_franqueadas WHERE produto_id = 'UUID_AQUI'
);
DELETE FROM produtos_franqueadas WHERE produto_id = 'UUID_AQUI';

-- Deletar produto
DELETE FROM produtos WHERE id = 'UUID_AQUI';

COMMIT;
*/

-- PASSO 3: Verificar se foi deletado
-- SELECT * FROM produtos WHERE id = 'UUID_AQUI';
-- Deve retornar 0 linhas

-- PASSO 4: Aguardar 2 minutos e verificar se voltou
-- SELECT * FROM produtos WHERE id_externo = 'ID_EXTERNO_AQUI';
