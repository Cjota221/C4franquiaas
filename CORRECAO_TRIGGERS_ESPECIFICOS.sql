-- ============================================
-- 🔧 CORREÇÃO: DESABILITAR APENAS TRIGGERS DE USUÁRIO
-- ============================================
-- PROBLEMA: DISABLE TRIGGER ALL tenta desabilitar triggers do sistema
-- SOLUÇÃO: Desabilitar apenas triggers customizados
-- ============================================

-- 1️⃣ VER QUAIS TRIGGERS EXISTEM
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'produtos'
ORDER BY trigger_name;

-- Copie os nomes dos triggers que aparecerem
-- ============================================


-- 2️⃣ DESABILITAR TRIGGERS ESPECÍFICOS (ajuste os nomes conforme resultado acima)
-- Exemplo: Se aparecer triggers como "auto_vincular_trigger", "notificar_trigger", etc.

-- ALTER TABLE produtos DISABLE TRIGGER nome_do_trigger_1;
-- ALTER TABLE produtos DISABLE TRIGGER nome_do_trigger_2;
-- ALTER TABLE produtos DISABLE TRIGGER nome_do_trigger_3;

-- ⚠️ NÃO desabilite triggers que comecem com "RI_ConstraintTrigger" (são do sistema!)
-- ============================================


-- 3️⃣ FAZER A CORREÇÃO
UPDATE produtos
SET 
  ativo = true,
  ultima_sincronizacao = NOW()
WHERE 
  estoque > 0 
  AND ativo = false;

-- Deve retornar: UPDATE XXX
-- ============================================


-- 4️⃣ REABILITAR TRIGGERS (use os mesmos nomes do passo 2)
-- ALTER TABLE produtos ENABLE TRIGGER nome_do_trigger_1;
-- ALTER TABLE produtos ENABLE TRIGGER nome_do_trigger_2;
-- ALTER TABLE produtos ENABLE TRIGGER nome_do_trigger_3;

-- ============================================


-- 5️⃣ VERIFICAR RESULTADO
SELECT 
  COUNT(*) FILTER (WHERE ativo = true AND estoque > 0) as ativos_com_estoque,
  COUNT(*) FILTER (WHERE ativo = false AND estoque > 0) as ainda_desativados,
  COUNT(*) FILTER (WHERE ativo = false AND estoque = 0) as corretos_sem_estoque
FROM produtos;

-- ESPERADO:
-- ativos_com_estoque: 200+
-- ainda_desativados: 0
-- ============================================
