-- ============================================
-- EXCLUSÃO FORÇADA: Deletar produtos inativos
-- ============================================
-- ATENÇÃO: Isso vai DELETAR PERMANENTEMENTE todos produtos inativos!
-- Execute APENAS se tiver certeza!

-- PASSO 1: Ver quantos produtos serão excluídos
SELECT COUNT(*) as total_serao_excluidos
FROM produtos
WHERE ativo = false;

-- PASSO 2: Ver os nomes dos produtos
SELECT id, nome, id_externo, ativo
FROM produtos
WHERE ativo = false
ORDER BY nome
LIMIT 50;

-- PASSO 3: EXECUTAR EXCLUSÃO (descomente para executar)
/*
BEGIN;

-- Marcar todos como excluídos
INSERT INTO produtos_excluidos (id_externo, excluido_por)
SELECT id_externo, 'admin_bulk_delete'
FROM produtos
WHERE ativo = false AND id_externo IS NOT NULL
ON CONFLICT (id_externo) DO UPDATE 
SET excluido_em = NOW(), excluido_por = 'admin_bulk_delete';

-- Deletar vinculações (mais rápido fazer em massa)
DELETE FROM reseller_products 
WHERE product_id IN (SELECT id FROM produtos WHERE ativo = false);

DELETE FROM produto_categorias 
WHERE produto_id IN (SELECT id FROM produtos WHERE ativo = false);

DELETE FROM produtos_franqueadas_precos 
WHERE produto_franqueada_id IN (
  SELECT pf.id FROM produtos_franqueadas pf
  INNER JOIN produtos p ON p.id = pf.produto_id
  WHERE p.ativo = false
);

DELETE FROM produtos_franqueadas 
WHERE produto_id IN (SELECT id FROM produtos WHERE ativo = false);

-- DELETAR OS PRODUTOS
DELETE FROM produtos WHERE ativo = false;

COMMIT;

-- Confirmar exclusão
SELECT 'Produtos inativos excluídos com sucesso!' as status;
SELECT COUNT(*) as total_restantes FROM produtos WHERE ativo = false;
*/

-- OU versão SEM BEGIN/COMMIT (mais segura):
-- Execute linha por linha e confirme cada passo

-- 1. Marcar como excluídos
/*
INSERT INTO produtos_excluidos (id_externo, excluido_por)
SELECT id_externo, 'admin_bulk_delete'
FROM produtos
WHERE ativo = false AND id_externo IS NOT NULL
ON CONFLICT (id_externo) DO UPDATE 
SET excluido_em = NOW(), excluido_por = 'admin_bulk_delete';
*/

-- 2. Deletar reseller_products
/*
DELETE FROM reseller_products 
WHERE product_id IN (SELECT id FROM produtos WHERE ativo = false);
*/

-- 3. Deletar produto_categorias
/*
DELETE FROM produto_categorias 
WHERE produto_id IN (SELECT id FROM produtos WHERE ativo = false);
*/

-- 4. Deletar preços
/*
DELETE FROM produtos_franqueadas_precos 
WHERE produto_franqueada_id IN (
  SELECT pf.id FROM produtos_franqueadas pf
  INNER JOIN produtos p ON p.id = pf.produto_id
  WHERE p.ativo = false
);
*/

-- 5. Deletar franqueadas
/*
DELETE FROM produtos_franqueadas 
WHERE produto_id IN (SELECT id FROM produtos WHERE ativo = false);
*/

-- 6. DELETAR PRODUTOS
/*
DELETE FROM produtos WHERE ativo = false;
*/

-- 7. Verificar
/*
SELECT COUNT(*) as total_restantes FROM produtos WHERE ativo = false;
*/
