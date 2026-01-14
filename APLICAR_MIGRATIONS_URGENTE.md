# 🚨 APLICAR MIGRATIONS URGENTE

## ⚠️ PROBLEMA

Produtos aparecem excluídos mas voltam porque as migrations NÃO estão aplicadas no banco!

## 📋 ORDEM DE APLICAÇÃO

### 1️⃣ Migration 060 - Índices (CRÍTICA)

**Arquivo**: `migrations/060_fix_delete_timeout_indices.sql`

**O que faz**: Adiciona índices que evitam timeout e otimizam exclusão

**Como aplicar**:

1. Abra Supabase → SQL Editor
2. Copie TUDO do arquivo `060_fix_delete_timeout_indices.sql`
3. Cole e clique em "Run"
4. Aguarde mensagem: "✅ MIGRATION 060 APLICADA COM SUCESSO"

---

### 2️⃣ Migration 061 - Estoque das Variações (IMPORTANTE)

**Arquivo**: `migrations/061_corrigir_desativacao_automatica_estoque.sql`

**O que faz**: Corrige cálculo de estoque das variações (evita desativação automática)

**Como aplicar**:

1. No mesmo SQL Editor
2. Copie TUDO do arquivo `061_corrigir_desativacao_automatica_estoque.sql`
3. Cole e clique em "Run"
4. Aguarde validação mostrando quantos produtos foram corrigidos

---

### 3️⃣ Migration 062 - RLS Exclusão (CRÍTICA) ⚠️

**Arquivo**: `migrations/062_fix_rls_exclusao_produtos.sql`

**O que faz**: **Permite que a função DELETE realmente funcione** (sem isso, produtos NÃO são excluídos!)

**Como aplicar**:

1. No mesmo SQL Editor
2. Copie TUDO do arquivo `062_fix_rls_exclusao_produtos.sql`
3. Cole e clique em "Run"
4. Aguarde mensagem: "✅ MIGRATION 062 APLICADA COM SUCESSO"

---

## ✅ APÓS APLICAR AS 3 MIGRATIONS

1. Recarregue a página do admin de produtos
2. Tente excluir produtos novamente
3. Os produtos devem ser REALMENTE excluídos agora
4. Verifique no console se ainda aparecem os logs de debug

---

## 🔍 VERIFICAR SE FUNCIONOU

Execute no SQL Editor após aplicar:

```sql
-- Verificar se índices foram criados
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE indexname LIKE 'idx_reseller_products%'
   OR indexname LIKE 'idx_produtos_franqueadas_precos%';

-- Verificar se função de estoque existe
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'calcular_estoque_total_variacoes';

-- Verificar se policies RLS foram criadas
SELECT policyname, tablename
FROM pg_policies
WHERE policyname LIKE '%Service role%'
   OR policyname LIKE '%Funções do banco%';
```

---

## 🎯 RESULTADO ESPERADO

Após aplicar as 3 migrations:

- ✅ Exclusões não dão timeout (índices otimizados)
- ✅ Produtos são REALMENTE excluídos (RLS corrigido)
- ✅ Produtos não desativam sozinhos (estoque calculado corretamente)
