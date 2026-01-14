-- ============================================
-- DIAGNÓSTICO: Por que cron atualiza apenas 1 produto?
-- ============================================

-- 1️⃣ Verificar qual produto foi atualizado recentemente
SELECT 
    id,
    nome,
    id_externo,
    estoque,
    ativo,
    updated_at,
    ultima_sincronizacao
FROM produtos
WHERE updated_at > NOW() - INTERVAL '10 minutes'
ORDER BY updated_at DESC
LIMIT 5;

-- 2️⃣ Ver produtos com id_externo (200 produtos que o cron verifica)
SELECT 
    COUNT(*) as total_com_id_externo,
    COUNT(CASE WHEN ativo = true THEN 1 END) as ativos,
    COUNT(CASE WHEN ativo = false THEN 1 END) as inativos
FROM produtos
WHERE id_externo IS NOT NULL;

-- 3️⃣ Ver exemplos de id_externo (para verificar formato)
SELECT 
    id,
    nome,
    id_externo,
    estoque,
    ativo
FROM produtos
WHERE id_externo IS NOT NULL
LIMIT 10;

-- 4️⃣ Verificar logs do cron de estoque
SELECT 
    tipo,
    descricao,
    payload,
    sucesso,
    created_at
FROM logs_sincronizacao
WHERE tipo = 'cron_estoque'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- PRÓXIMO PASSO: Execute este SQL no Supabase
-- e me envie os resultados para diagnosticar
-- ============================================
