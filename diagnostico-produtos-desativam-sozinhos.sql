-- ============================================
-- 🔍 DIAGNÓSTICO: Produtos Desativam Sozinhos
-- ============================================

-- 1️⃣ Verificar TRIGGERS ativos na tabela produtos
SELECT 
    tgname AS trigger_name,
    tgtype,
    tgenabled,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'produtos'::regclass
AND tgname NOT LIKE 'RI_%'  -- Ignorar triggers internos de FK
ORDER BY tgname;

-- 2️⃣ Verificar TRIGGERS na tabela reseller_products
SELECT 
    tgname AS trigger_name,
    tgtype,
    tgenabled,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'reseller_products'::regclass
AND tgname NOT LIKE 'RI_%'
ORDER BY tgname;

-- 3️⃣ Verificar produtos que foram desativados recentemente
SELECT 
    p.id,
    p.nome,
    p.ativo,
    p.desativado_manual,
    p.admin_aprovado,
    p.estoque,
    p.updated_at,
    p.created_at
FROM produtos p
WHERE p.ativo = false
AND p.updated_at > NOW() - INTERVAL '24 hours'
ORDER BY p.updated_at DESC
LIMIT 20;

-- 4️⃣ Verificar logs de sincronização recentes (se houver)
SELECT 
    tipo,
    produto_id,
    descricao,
    sucesso,
    erro,
    created_at
FROM logs_sincronizacao
WHERE tipo LIKE '%desativ%'
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- 5️⃣ Verificar se há produtos ativos no admin mas desativados em reseller_products
SELECT 
    p.id,
    p.nome,
    p.ativo AS produto_ativo,
    p.admin_aprovado,
    p.estoque,
    COUNT(rp.id) AS total_vinculacoes,
    COUNT(rp.id) FILTER (WHERE rp.is_active = true) AS vinculacoes_ativas,
    COUNT(rp.id) FILTER (WHERE rp.is_active = false) AS vinculacoes_inativas
FROM produtos p
LEFT JOIN reseller_products rp ON rp.product_id = p.id
WHERE p.ativo = true
GROUP BY p.id, p.nome, p.ativo, p.admin_aprovado, p.estoque
HAVING COUNT(rp.id) FILTER (WHERE rp.is_active = false) > 0
ORDER BY p.updated_at DESC
LIMIT 20;

-- 6️⃣ Verificar FUNCTION que pode estar desativando produtos
SELECT 
    proname AS function_name,
    prosrc AS function_source
FROM pg_proc
WHERE proname LIKE '%desativ%'
   OR proname LIKE '%margem%'
   OR proname LIKE '%estoque%'
ORDER BY proname;

-- ============================================
-- 📋 INTERPRETAÇÃO DOS RESULTADOS
-- ============================================

-- Se encontrar triggers como:
-- - trigger_impedir_ativacao_sem_margem: Bloqueia ativação se não tem margem
-- - trigger_desativar_estoque_zero: Desativa automaticamente quando estoque = 0
-- - trigger_sincronizar_desativacao: Propaga desativação para outras tabelas

-- AÇÃO: Desabilitar ou remover triggers que causam desativação automática

-- ============================================
-- ⚠️ POSSÍVEIS CAUSAS
-- ============================================

-- CAUSA 1: Trigger de margem zero
-- Trigger impedir_ativacao_sem_margem() IMPEDE ativação se margem = 0
-- Solução: Garantir que produtos têm margin_percent > 0 antes de ativar

-- CAUSA 2: Trigger de estoque zero  
-- Pode estar desativando produtos quando estoque fica = 0
-- Solução: Remover trigger ou ajustar lógica

-- CAUSA 3: Sincronização com FacilZap
-- Webhook pode estar recebendo dados do ERP e desativando produtos
-- Solução: Verificar logs de webhook

-- CAUSA 4: Campo desativado_manual
-- Se desativado_manual = true, alguma lógica pode estar revertendo ativação
-- Solução: Limpar flag ao ativar manualmente
