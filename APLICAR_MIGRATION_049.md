# 🚀 APLICAR MIGRATION 049: Margem Padrão Automática

## 📋 O que esta migration faz?

Adiciona o campo `margem_padrao` na tabela `lojas` para que produtos novos já venham automaticamente com a margem de lucro configurada pela revendedora.

## ⚡ Passos para aplicar

### 1️⃣ Abrir Supabase Dashboard

1. Acessar: https://supabase.com/dashboard
2. Selecionar o projeto **C4 Franquias**
3. Ir em **SQL Editor** (menu lateral esquerdo)

### 2️⃣ Executar o SQL

Copiar e colar o seguinte código:

```sql
-- ============================================================================
-- Migration 049: Adicionar Margem Padrão para Revendedora Pro
-- ============================================================================
-- Description: Adiciona campo margem_padrao na tabela lojas
--              Produtos novos já vêm com essa margem aplicada automaticamente
-- Date: 2025-01-09
-- ============================================================================

-- STEP 1: Adicionar coluna margem_padrao (SEM valor padrão - revendedora escolhe)
ALTER TABLE lojas
ADD COLUMN IF NOT EXISTS margem_padrao DECIMAL(5,2) DEFAULT NULL;

-- STEP 2: Comentário explicativo
COMMENT ON COLUMN lojas.margem_padrao IS 'Margem de lucro padrão (%) aplicada automaticamente em produtos novos. NULL = revendedora precisa configurar';
```

### 3️⃣ Clicar em **RUN**

### 4️⃣ Verificar sucesso

Se aparecer "Success. No rows returned", está tudo certo! ✅

## 🔍 Como verificar se funcionou

Execute este SQL para confirmar:

```sql
SELECT id, nome, margem_padrao
FROM lojas
LIMIT 5;
```

Deve mostrar o campo `margem_padrao` com valor NULL (revendedoras precisarão configurar)

## ⚠️ IMPORTANTE

Após aplicar esta migration, você precisa:

1. Atualizar a API de vinculação de produtos
2. Adicionar campo no painel da revendedora
3. Remover sistema de notificações de produtos novos

---

**Status:** ✅ Pronto para aplicar
