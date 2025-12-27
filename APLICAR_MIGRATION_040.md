# 🔄 Aplicar Migration 040 - Sincronização de Produtos para Revendedoras

## O que essa migration faz:

### 1. **Desativação em Cascata**
Quando o ADMIN desativa um produto (ativo = false) ou o estoque zera:
- ✅ Desativa automaticamente em TODAS as franqueadas
- ✅ Desativa automaticamente em TODAS as revendedoras

### 2. **Regras de Negócio**
- Quando produto é **DESATIVADO** pelo admin → desativa em todos os lugares automaticamente
- Quando produto fica **SEM ESTOQUE** → desativa em todos os lugares automaticamente
- Quando produto é **REATIVADO** → NÃO reativa automaticamente (franqueada/revendedora decide)
- Quando **ESTOQUE REPÕE** → NÃO reativa automaticamente (franqueada/revendedora decide)

## Como aplicar:

### Opção 1: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `migrations/040_sync_products_to_resellers.sql`
4. Clique em **Run**

### Opção 2: Via CLI (se tiver configurado)
```bash
supabase db push
```

## Verificação:

Após aplicar, rode essas queries para verificar:

```sql
-- Verificar se o trigger foi criado
SELECT * FROM pg_trigger WHERE tgname = 'trg_sync_product_availability_to_all';

-- Verificar se a função existe
SELECT proname FROM pg_proc WHERE proname = 'sync_product_availability_to_all';
```

## Teste Manual:

1. Desative um produto no painel admin
2. Verifique se foi desativado para as revendedoras:
```sql
SELECT is_active FROM reseller_products WHERE product_id = 'ID_DO_PRODUTO';
```

## Resumo das Correções:

1. **Margem de lucro** - APIs corrigidas para NÃO sobrescrever margem quando revincula produtos
2. **Desativação em cascata** - Trigger criado para sincronizar automaticamente

🚀 Após aplicar, tudo funcionará automaticamente!
