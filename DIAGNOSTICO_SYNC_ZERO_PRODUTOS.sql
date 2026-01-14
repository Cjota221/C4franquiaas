-- ============================================
-- DIAGNÓSTICO: Por que sincronização retornou 0 produtos?
-- ============================================

-- 1️⃣ Verificar se tem produtos no banco ANTES da sync
SELECT 
    COUNT(*) as total_produtos_no_banco,
    COUNT(CASE WHEN ativo = true THEN 1 END) as ativos,
    COUNT(CASE WHEN ativo = false THEN 1 END) as inativos,
    COUNT(CASE WHEN id_externo IS NOT NULL THEN 1 END) as com_id_externo
FROM produtos;

-- 2️⃣ Verificar logs de sincronização recentes
SELECT 
    tipo,
    descricao,
    payload,
    sucesso,
    erro,
    created_at
FROM logs_sincronizacao
ORDER BY created_at DESC
LIMIT 10;

-- 3️⃣ Verificar se tabela produtos_excluidos existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'produtos_excluidos'
) as tabela_existe;

-- 4️⃣ Se existe, ver quantos produtos estão excluídos
SELECT COUNT(*) as total_excluidos
FROM produtos_excluidos;

-- 5️⃣ Ver últimos produtos sincronizados
SELECT 
    id,
    nome,
    id_externo,
    ativo,
    estoque,
    ultima_sincronizacao,
    sincronizado_facilzap
FROM produtos
WHERE ultima_sincronizacao IS NOT NULL
ORDER BY ultima_sincronizacao DESC
LIMIT 10;
