# 🚀 APLICAR ATUALIZAÇÃO: Margem Padrão Automática

## 📝 O que esta atualização faz?

✅ **ANTES:** Produtos novos chegavam sem margem, revendedora precisava configurar um por um  
✅ **DEPOIS:** Produtos novos já vêm com a margem configurada pela revendedora aplicada automaticamente!

---

## ⚡ PASSO A PASSO COMPLETO

### 1️⃣ Aplicar Migration 049 (Adicionar campo margem_padrao)

1. Acessar: https://supabase.com/dashboard
2. Selecionar projeto **C4 Franquias**
3. Ir em **SQL Editor**
4. Copiar e executar este SQL:

```sql
-- Adicionar coluna margem_padrao
ALTER TABLE lojas 
ADD COLUMN IF NOT EXISTS margem_padrao DECIMAL(5,2) DEFAULT 70.00;

-- Comentário explicativo
COMMENT ON COLUMN lojas.margem_padrao IS 'Margem de lucro padrão (%) aplicada automaticamente em produtos novos';

-- Atualizar lojas existentes para margem padrão de 70%
UPDATE lojas 
SET margem_padrao = 70.00 
WHERE margem_padrao IS NULL;
```

✅ **Resultado esperado:** "Success. No rows returned"

---

### 2️⃣ Remover Sistema de Notificações de Produtos Novos

No mesmo **SQL Editor**, executar:

```sql
-- Dropar trigger de notificação
DROP TRIGGER IF EXISTS trigger_notificar_produtos_novos ON reseller_products;

-- Dropar função de notificação
DROP FUNCTION IF EXISTS notificar_revendedoras_produtos_novos();

-- Limpar notificações antigas (opcional)
DELETE FROM reseller_notifications 
WHERE type = 'new_products';
```

✅ **Resultado esperado:** "Success. 3 rows affected" (ou similar)

---

### 3️⃣ Fazer Deploy do Código

O código já foi atualizado nos seguintes arquivos:

**Backend (APIs):**
- ✅ `app/api/admin/produtos/vincular-todas-revendedoras/route.ts`
- ✅ `app/api/franqueada/loja/route.ts` (POST - criar loja)
- ✅ `app/api/franqueada/loja/update/route.ts` (PUT - atualizar loja)

**Frontend:**
- ✅ `app/revendedora-pro/loja/page.tsx` (campo margem_padrao adicionado)

**Migration:**
- ✅ `migrations/049_add_margem_padrao_lojas.sql`

**Fazer commit e push:**

```powershell
git add -A
git commit -m "feat: aplicar margem padrão automaticamente em produtos novos"
git push
```

---

## 🎯 Como funciona agora?

### Para a Revendedora:

1. Acessa **Minha Loja** → aba **Configurações**
2. Define sua **Margem de Lucro Padrão** (ex: 70%)
3. Clica em **Salvar**

### Quando produtos novos chegam:

1. ✅ Admin ativa produto no painel
2. ✅ Produto é vinculado às revendedoras
3. ✅ **Margem é aplicada AUTOMATICAMENTE** (70% no exemplo)
4. ✅ Produto JÁ FICA ATIVO no catálogo
5. ✅ **NÃO HÁ NOTIFICAÇÃO** (produto já está pronto para vender)

---

## 🔍 Como testar?

### Teste 1: Configurar Margem Padrão

1. Fazer login como revendedora Pro
2. Ir em **Minha Loja** → **Configurações**
3. Verificar campo "Margem de Lucro Padrão" (deve estar com 70%)
4. Alterar para outro valor (ex: 80%)
5. Salvar
6. Recarregar página e verificar que o valor foi salvo

### Teste 2: Vincular Produto Novo

1. Fazer login como **Admin**
2. Ir em **Produtos**
3. Ativar um produto que estava desativado
4. Fazer login como **Revendedora Pro**
5. Ir em **Produtos**
6. ✅ Verificar que o produto aparece **JÁ COM MARGEM APLICADA**
7. ✅ Verificar que produto está **ATIVO**
8. ✅ Verificar que **NÃO HÁ NOTIFICAÇÃO** de "produtos novos"

---

## ⚠️ IMPORTANTE

### Revendedoras existentes:

- Todas as lojas receberão margem_padrao = 70% automaticamente
- Elas podem alterar para o valor que quiserem
- Produtos já vinculados **NÃO SERÃO ALTERADOS** (apenas novos produtos usarão essa margem)

### Produtos novos:

- **Se revendedora tem margem_padrao configurada:** Produto vem com essa margem
- **Se revendedora NÃO configurou:** Produto vem com margem_padrao padrão da loja (70%)
- Revendedora ainda pode alterar a margem individualmente depois

---

## 📊 Impacto da mudança:

| Antes | Depois |
|-------|--------|
| ❌ Produtos novos sem margem | ✅ Produtos com margem automática |
| ❌ Revendedora precisa configurar um por um | ✅ Produtos prontos para vender |
| ❌ Notificações "X produtos novos" | ✅ Sem notificações (não precisa) |
| ❌ Produtos desativados por padrão | ✅ Produtos ativos por padrão |

---

## 🐛 Troubleshooting

### Erro ao aplicar migration:

```
ERROR: column "margem_padrao" already exists
```

**Solução:** Coluna já existe! Pule para o passo 2.

### Revendedora não vê o campo:

1. Verificar se migration foi aplicada: `SELECT margem_padrao FROM lojas LIMIT 1;`
2. Fazer hard reload no navegador (Ctrl+Shift+R)
3. Verificar console do navegador por erros

### Produtos novos ainda vêm sem margem:

1. Verificar que a API foi atualizada (deploy feito)
2. Verificar no banco: `SELECT margem_padrao FROM lojas WHERE id = 'XXX';`
3. Testar criar novo vínculo manualmente

---

## ✅ Checklist de Aplicação

- [ ] Migration 049 aplicada
- [ ] Triggers removidos  
- [ ] Código commitado e deployed
- [ ] Teste 1 (configurar margem) OK
- [ ] Teste 2 (vincular produto) OK
- [ ] Revendedoras notificadas da mudança (opcional)

---

**Data:** 09/01/2026  
**Autor:** GitHub Copilot  
**Status:** ✅ Pronto para produção
