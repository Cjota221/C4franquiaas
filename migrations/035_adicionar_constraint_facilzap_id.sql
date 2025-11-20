-- ============================================
-- 🔧 MIGRATION 035: Adicionar Constraint Única em facilzap_id
-- ============================================
-- Data: 2025-11-19
-- Objetivo: Garantir que facilzap_id seja único na tabela produtos
--           para evitar conflitos entre webhook e sync manual

-- ============================================
-- 1️⃣ LIMPAR DUPLICATAS (se existirem)
-- ============================================

-- Identificar produtos duplicados por facilzap_id (manter o mais recente)
WITH duplicatas AS (
  SELECT 
    facilzap_id,
    id,
    ROW_NUMBER() OVER (PARTITION BY facilzap_id ORDER BY ultima_sincronizacao DESC NULLS LAST, created_at DESC) as rn
  FROM produtos
  WHERE facilzap_id IS NOT NULL
    AND facilzap_id != ''
)
SELECT 
  'Produtos duplicados encontrados:' as status,
  COUNT(*) as total
FROM duplicatas
WHERE rn > 1;

-- Se existirem duplicatas, mesclar dados antes de deletar
-- (Este script NÃO deleta automaticamente, apenas mostra as duplicatas)

-- ============================================
-- 2️⃣ PREENCHER facilzap_id onde está NULL
-- ============================================

-- Atualizar facilzap_id = id_externo onde facilzap_id está vazio
UPDATE produtos
SET facilzap_id = id_externo
WHERE facilzap_id IS NULL 
   OR facilzap_id = ''
   AND id_externo IS NOT NULL 
   AND id_externo != '';

-- ============================================
-- 3️⃣ ADICIONAR CONSTRAINT ÚNICA
-- ============================================

-- Criar constraint única em facilzap_id (se não existir)
DO $$ 
BEGIN
    -- Verificar se constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'produtos_facilzap_id_key'
    ) THEN
        -- Adicionar constraint
        ALTER TABLE produtos 
        ADD CONSTRAINT produtos_facilzap_id_key 
        UNIQUE (facilzap_id);
        
        RAISE NOTICE '✅ Constraint produtos_facilzap_id_key criada com sucesso';
    ELSE
        RAISE NOTICE '⚠️ Constraint produtos_facilzap_id_key já existe';
    END IF;
END $$;

-- ============================================
-- 4️⃣ CRIAR ÍNDICE (se não existir)
-- ============================================

-- Índice para melhorar performance de buscas por facilzap_id
CREATE INDEX IF NOT EXISTS idx_produtos_facilzap_id 
ON produtos(facilzap_id) 
WHERE facilzap_id IS NOT NULL;

-- ============================================
-- 5️⃣ VERIFICAR RESULTADO
-- ============================================

-- Verificar constraints criadas
SELECT 
  conname as constraint_name,
  contype as type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'produtos'::regclass
  AND conname LIKE '%facilzap%';

-- Verificar se há produtos sem facilzap_id
SELECT 
  COUNT(*) as total_produtos,
  COUNT(facilzap_id) as com_facilzap_id,
  COUNT(*) - COUNT(facilzap_id) as sem_facilzap_id
FROM produtos;

-- Verificar duplicatas por facilzap_id (deve retornar 0)
SELECT 
  facilzap_id,
  COUNT(*) as ocorrencias
FROM produtos
WHERE facilzap_id IS NOT NULL
GROUP BY facilzap_id
HAVING COUNT(*) > 1
ORDER BY ocorrencias DESC;

-- ============================================
-- 📊 RESULTADO ESPERADO:
-- ============================================
-- ✅ Constraint produtos_facilzap_id_key criada
-- ✅ Índice idx_produtos_facilzap_id criado
-- ✅ 0 duplicatas por facilzap_id
-- ✅ Todos os produtos com facilzap_id preenchido

RAISE NOTICE '🎉 Migration 035 concluída! facilzap_id agora é único.';
