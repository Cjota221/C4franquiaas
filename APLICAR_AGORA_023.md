# 📋 GUIA RÁPIDO - Aplicar Migration 023

## 🎯 O QUE VOCÊ PRECISA FAZER AGORA

### 1️⃣ Abra o Supabase SQL Editor

- Vá para: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
- Clique em **"New Query"**

### 2️⃣ Copie o arquivo da migration

- Abra o arquivo: `migrations/023_modulo_financeiro.sql`
- Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)

### 3️⃣ Cole e Execute

- Cole no SQL Editor do Supabase
- Clique em **RUN** (botão verde)

### 4️⃣ Resultado Esperado

Você deve ver:

```
Success. No rows returned
```

---

## ✅ VERIFICAÇÃO RÁPIDA

Depois de executar, rode esta query para confirmar:

```sql
-- Ver tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('franqueadas_dados_pagamento', 'pagamentos_comissao');

-- Ver colunas novas em vendas
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'vendas'
  AND column_name IN ('status_comissao', 'data_pagamento_comissao', 'pago_por');
```

**Esperado**:

- Primeira query: 2 tabelas
- Segunda query: 3 colunas

---

## 🎉 APÓS APLICAR

Quando terminar, me avise e eu continuo com:

1. ✅ Página "Minhas Comissões" (franqueada)
2. ✅ Refatorar tabela de vendas (admin)
3. ✅ Página "Controle de Comissões" com PIX (admin)

---

## ⚠️ PROBLEMAS?

Se der erro, me envie:

- Print da mensagem de erro
- Linha onde parou

**Dica**: Se já tiver alguma tabela criada, a migration vai pular (usa `IF NOT EXISTS`)
