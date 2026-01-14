-- ============================================
-- DIAGNÓSTICO: Erro 500 ao Carregar Produtos
-- ============================================

-- 1️⃣ Verificar se a função existe
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('calcular_estoque_total_variacoes', 'sincronizar_estoque_variacoes');

-- 2️⃣ Verificar se o trigger existe
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sincronizar_estoque_variacoes';

-- 3️⃣ Testar query básica de produtos (igual ao que o frontend faz)
SELECT 
    id,
    id_externo,
    nome,
    estoque,
    preco_base,
    ativo,
    imagem,
    created_at
FROM produtos
WHERE ativo = true
ORDER BY created_at DESC
LIMIT 5;

-- 4️⃣ Verificar se há produtos com estoque NULL ou inválido
SELECT 
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN estoque IS NULL THEN 1 END) as estoque_null,
    COUNT(CASE WHEN estoque < 0 THEN 1 END) as estoque_negativo
FROM produtos;

-- 5️⃣ Testar função calcular_estoque_total_variacoes
SELECT 
    id,
    nome,
    estoque AS estoque_campo,
    calcular_estoque_total_variacoes(variacoes_meta) AS estoque_calculado,
    variacoes_meta IS NOT NULL AS tem_variacoes
FROM produtos
WHERE variacoes_meta IS NOT NULL
LIMIT 5;

-- 6️⃣ Verificar se migration 062 (RLS) foi aplicada
SELECT policyname, tablename, cmd
FROM pg_policies
WHERE tablename IN ('produtos', 'reseller_products')
ORDER BY tablename, policyname;

-- 7️⃣ Verificar se há erro ao fazer SELECT simples
DO $$
DECLARE
    produto_record RECORD;
BEGIN
    FOR produto_record IN 
        SELECT id, nome, estoque 
        FROM produtos 
        LIMIT 5
    LOOP
        RAISE NOTICE 'Produto: % - Estoque: %', produto_record.nome, produto_record.estoque;
    END LOOP;
    
    RAISE NOTICE '✅ SELECT simples funcionando';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO: %', SQLERRM;
END $$;
