# 🚀 GUIA DE IMPLANTAÇÃO - Auto-Vinculação de Produtos

## ✅ O QUE FOI IMPLEMENTADO

### 1. **Auto-Vinculação Automática**

Quando você **ativa** um produto no admin, ele agora:

- ✅ Vai automaticamente para **TODAS as revendedoras aprovadas**
- ✅ Já fica **ATIVO** no catálogo delas (margem padrão: 30%)
- ✅ Funciona para produtos novos E produtos reativados

### 2. **Sistema de Notificações**

- ✅ **Sino de notificações** na sidebar da revendedora
- ✅ **Badge** com contador de notificações não lidas
- ✅ **Notificação em tempo real** quando produto novo é adicionado
- ✅ **Alerta visual** no dashboard quando há produtos novos (últimas 24h)

---

## 📋 COMO EXECUTAR (PASSO A PASSO)

### **PASSO 1: Executar a Migration no Supabase**

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Selecione seu projeto **C4 Franquias**
3. No menu lateral, clique em **SQL Editor**
4. Abra o arquivo: `migrations/048_auto_vincular_produtos_revendedoras.sql`
5. **Copie TODO o conteúdo** do arquivo
6. Cole no editor SQL do Supabase
7. Clique em **RUN** (▶️)

**⏱️ Tempo estimado:** 30 segundos

### **O que essa migration faz:**

✅ **Cria trigger** que vincula produtos automaticamente  
✅ **Cria tabela** `reseller_notifications` para notificações  
✅ **Vincula produtos existentes** às revendedoras ativas  
✅ **Configura RLS** (segurança)

---

### **PASSO 2: Verificar se funcionou**

Após executar a migration, teste:

#### **Teste 1: Verificar produtos vinculados**

```sql
-- Execute no SQL Editor do Supabase
SELECT
  r.store_name,
  COUNT(rp.product_id) as total_produtos
FROM resellers r
LEFT JOIN reseller_products rp ON rp.reseller_id = r.id
WHERE r.status = 'aprovada' AND r.is_active = true
GROUP BY r.id, r.store_name;
```

**Resultado esperado:** Todas as revendedoras devem ter produtos vinculados

#### **Teste 2: Verificar notificações**

```sql
-- Ver notificações criadas
SELECT * FROM reseller_notifications
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado esperado:** Deve ter notificações de "new_products"

---

### **PASSO 3: Testar no sistema**

#### **No Admin** (`/admin/produtos`):

1. Ative um produto (ou adicione um novo)
2. O produto deve ir automaticamente para todas revendedoras

#### **No Painel da Revendedora** (`/revendedora/dashboard`):

1. Faça login como revendedora
2. **Deve ver:**
   - 🔔 Sino de notificações na sidebar (com badge se tiver produtos novos)
   - 🎉 Banner azul "X Novos Produtos!" (se tiver produtos nas últimas 24h)
3. Clique no sino → Deve mostrar notificações
4. Vá em "Produtos" → Produtos novos devem estar lá

---

## 🎯 FLUXO COMPLETO (Como funciona agora)

```
Admin cadastra/ativa produto
         ↓
    [TRIGGER]
         ↓
Produto vai para reseller_products (TODAS as revendedoras)
         ↓
    [TRIGGER]
         ↓
Cria notificação para cada revendedora
         ↓
Revendedora vê:
  1. Sino com badge
  2. Banner no dashboard
  3. Produto na lista
```

---

## 🔧 CUSTOMIZAÇÕES POSSÍVEIS

### Mudar margem padrão

No arquivo `048_auto_vincular_produtos_revendedoras.sql`, linha 25:

```sql
30, -- Margem padrão de 30%
```

Troque `30` por outro valor (ex: `25` = 25%)

### Desativar notificações

Se quiser desativar notificações temporariamente:

```sql
DROP TRIGGER IF EXISTS trigger_notificar_produtos_novos ON reseller_products;
```

---

## ❓ PROBLEMAS COMUNS

### Problema 1: Erro "relation reseller_notifications does not exist"

**Solução:** Execute a migration novamente

### Problema 2: Produtos não aparecem para revendedoras

**Solução:** Execute manualmente:

```sql
INSERT INTO reseller_products (reseller_id, product_id, margin_percent, is_active)
SELECT r.id, p.id, 30, true
FROM resellers r
CROSS JOIN produtos p
WHERE r.status = 'aprovada' AND r.is_active = true AND p.ativo = true
ON CONFLICT DO NOTHING;
```

### Problema 3: Sino não aparece

**Solução:**

1. Limpe o cache do navegador (Ctrl+Shift+Del)
2. Faça hard refresh (Ctrl+F5)

---

## 🎉 PRONTO!

Agora seu sistema está com:

- ✅ Auto-vinculação de produtos
- ✅ Notificações em tempo real
- ✅ Alerta visual no dashboard

**Qualquer dúvida, me chame!** 🚀
