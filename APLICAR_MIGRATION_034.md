# 🚀 Aplicar Migration 034 - Campo created_at em Produtos

## 📋 O que faz:

- Adiciona coluna `created_at` na tabela `produtos`
- Define timestamp padrão como data/hora atual
- Cria 3 índices para melhorar performance de consultas por data
- Permite identificar produtos **realmente novos** por data de criação

---

## 🎯 Passos para Aplicar:

### 1️⃣ Abrir Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/editor/sql
2. Ou vá em: **SQL Editor** no menu lateral

### 2️⃣ Copiar e Colar o SQL

Copie todo o conteúdo abaixo:

```sql
-- Migration 034: Adicionar campo created_at aos produtos
-- Objetivo: Identificar produtos novos por data real de criação

-- 1. Adicionar coluna created_at com timestamp padrão agora
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Para produtos existentes sem data, usar a data atual como base
UPDATE produtos
SET created_at = NOW()
WHERE created_at IS NULL;

-- 3. Criar índice para melhorar performance de consultas por data
CREATE INDEX IF NOT EXISTS idx_produtos_created_at ON produtos(created_at DESC);

-- 4. Criar índice composto para filtros combinados (ativo + data)
CREATE INDEX IF NOT EXISTS idx_produtos_ativo_created_at ON produtos(ativo, created_at DESC) WHERE ativo = true;

-- 5. Criar índice para produtos com estoque disponível + data
CREATE INDEX IF NOT EXISTS idx_produtos_estoque_created_at ON produtos(estoque, created_at DESC) WHERE estoque > 0;

-- Pronto! Agora podemos ordenar por data de criacao real e filtrar novos dos ultimos 7 dias
```

### 3️⃣ Executar

- Cole o SQL no editor
- Clique em **Run** (ou Ctrl+Enter)
- Aguarde a mensagem de sucesso ✅

---

## ✅ Como Verificar se Funcionou:

Execute esta query para ver os produtos com as novas datas:

```sql
SELECT
  id,
  nome,
  created_at,
  ativo
FROM produtos
ORDER BY created_at DESC
LIMIT 10;
```

Você deve ver a coluna `created_at` preenchida em todos os produtos!

---

## 📊 Uso Futuro:

### Filtrar produtos dos últimos 7 dias:

```sql
SELECT * FROM produtos
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Filtrar produtos ativos e novos:

```sql
SELECT * FROM produtos
WHERE ativo = true
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## 🔄 Próximo Passo:

Após aplicar, atualizar a página de produtos para usar `created_at` no filtro "Produtos Novos" em vez de verificar `produtos_franqueadas`.

---

**Migration criada em:** 17/11/2025
