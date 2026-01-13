-- ============================================
-- Migration 059: Controle de Exclusão pelo Admin
-- ============================================
-- Problema: Quando admin exclui produtos, eles voltam na sincronização
-- Solução: Tabela para guardar IDs excluídos e ignorar na sync

-- 1️⃣ Criar tabela para guardar produtos excluídos
CREATE TABLE IF NOT EXISTS produtos_excluidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_externo TEXT NOT NULL UNIQUE,
  excluido_em TIMESTAMPTZ DEFAULT NOW(),
  excluido_por TEXT DEFAULT 'admin'
);

-- 2️⃣ Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_produtos_excluidos_id_externo ON produtos_excluidos(id_externo);

-- 3️⃣ Atualizar função de exclusão para também registrar na tabela
CREATE OR REPLACE FUNCTION excluir_produtos_completo(produto_ids UUID[])
RETURNS JSON AS $$
DECLARE
  total_excluidos INTEGER := 0;
  pid UUID;
  ext_id TEXT;
BEGIN
  FOREACH pid IN ARRAY produto_ids
  LOOP
    -- Buscar id_externo antes de deletar
    SELECT id_externo INTO ext_id FROM produtos WHERE id = pid;
    
    -- Se tem id_externo, guardar na tabela de excluídos
    IF ext_id IS NOT NULL THEN
      INSERT INTO produtos_excluidos (id_externo) 
      VALUES (ext_id) 
      ON CONFLICT (id_externo) DO NOTHING;
    END IF;
    
    -- 1. Deletar vinculações com revendedoras
    DELETE FROM reseller_products WHERE product_id = pid;
    
    -- 2. Deletar categorias
    DELETE FROM produto_categorias WHERE produto_id = pid;
    
    -- 3. Deletar franqueadas e preços
    DELETE FROM produtos_franqueadas_precos 
    WHERE produto_franqueada_id IN (
      SELECT id FROM produtos_franqueadas WHERE produto_id = pid
    );
    DELETE FROM produtos_franqueadas WHERE produto_id = pid;
    
    -- 4. Deletar o produto
    DELETE FROM produtos WHERE id = pid;
    
    total_excluidos := total_excluidos + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'total_excluidos', total_excluidos
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4️⃣ Dar permissões
GRANT SELECT, INSERT ON produtos_excluidos TO authenticated;
GRANT SELECT, INSERT ON produtos_excluidos TO service_role;
GRANT EXECUTE ON FUNCTION excluir_produtos_completo(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION excluir_produtos_completo(UUID[]) TO service_role;

-- 5️⃣ Comentário
COMMENT ON TABLE produtos_excluidos IS 
  'Tabela para guardar IDs de produtos excluídos pelo admin.
   A sincronização deve ignorar produtos com id_externo nesta tabela.';
