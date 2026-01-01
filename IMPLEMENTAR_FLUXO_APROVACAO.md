# 🚀 IMPLEMENTAR FLUXO DE APROVAÇÃO DE PRODUTOS

## 📋 PROBLEMA ATUAL

- ❌ Produtos vão **automaticamente** para revendedoras
- ❌ Admin não tem controle do que vai ou não
- ❌ Revendedora não sabe quais produtos são novos
- ❌ "Kit Empreendedora" vai para revendedoras (não deveria)
- ❌ Margem antiga é aplicada automaticamente

---

## ✅ SOLUÇÃO: FLUXO DE APROVAÇÃO EM 3 NÍVEIS

### **NÍVEL 1: ADMIN APROVA PRIMEIRO**

```
FácilZap → Admin Panel (AGUARDANDO APROVAÇÃO)
                ↓
         Admin revisa
                ↓
    ┌──────────┴──────────┐
    ✅ APROVAR         🚫 REJEITAR
    (vai pra franqueadas)  (nunca vai)
```

**Novo campo na tabela `produtos`:**

```sql
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS admin_aprovado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_rejeitado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_data_aprovacao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_notas TEXT;
```

---

### **NÍVEL 2: FRANQUEADA ATIVA NO SITE DELA**

```
Admin aprovou → Franqueada vê "PRODUTOS NOVOS"
                       ↓
              Franqueada revisa
                       ↓
        ┌──────────────┴────────────┐
        ✅ ATIVAR              ⏸️ IGNORAR
    (define margem)         (não vende)
```

**Campo `is_active` em `reseller_products`:**

- `false` por padrão quando Admin aprova
- Franqueada decide depois

---

### **NÍVEL 3: SITE PÚBLICO**

Só aparece se:

- ✅ `produtos.admin_aprovado = true`
- ✅ `produtos.ativo = true`
- ✅ `produtos.estoque > 0`
- ✅ `reseller_products.is_active = true`

---

## 🛠️ MUDANÇAS NECESSÁRIAS

### 1️⃣ **Alterar sincronização FácilZap**

```typescript
// app/api/sync-produtos/route.ts
// ANTES: Produto ficava ativo automaticamente
// DEPOIS: Produto fica AGUARDANDO APROVAÇÃO DO ADMIN

const produtoData = {
  ativo: false, // ❌ NÃO ativar automaticamente
  admin_aprovado: false, // ⏸️ Aguardando aprovação
  estoque: estoque,
  // ... resto dos campos
};
```

### 2️⃣ **Criar painel "Produtos Aguardando Aprovação"**

```
/admin/produtos/aguardando-aprovacao

┌─────────────────────────────────────────┐
│ 📦 PRODUTOS AGUARDANDO APROVAÇÃO (15)  │
├─────────────────────────────────────────┤
│ 🆕 [Imagem] Batom Matte Rosa           │
│    Estoque: 50 | Preço: R$ 25,00      │
│    [✅ APROVAR] [🚫 REJEITAR]          │
├─────────────────────────────────────────┤
│ 🆕 [Imagem] Kit Empreendedora          │
│    Estoque: 10 | Preço: R$ 150,00     │
│    [✅ APROVAR] [🚫 REJEITAR]          │
└─────────────────────────────────────────┘
```

### 3️⃣ **API de Aprovação/Rejeição**

```typescript
// POST /api/admin/produtos/aprovar
{
  produto_ids: [123, 456],
  acao: "aprovar" | "rejeitar",
  notas: "Produto específico para revenda"
}
```

### 4️⃣ **Vincular SOMENTE produtos aprovados**

```sql
-- Modificar VINCULAR_PRODUTOS_AUTOMATICO.sql
INSERT INTO reseller_products (...)
WHERE
  p.admin_aprovado = true  -- ✅ SÓ SE ADMIN APROVOU
  AND p.ativo = true
  AND r.status = 'aprovada'
```

### 5️⃣ **Painel Franqueada: "Produtos Novos"**

```
/revendedora/produtos/novos

┌─────────────────────────────────────────┐
│ 🆕 VOCÊ TEM 10 PRODUTOS NOVOS!         │
├─────────────────────────────────────────┤
│ [Imagem] Batom Matte Rosa              │
│ Preço Base: R$ 25,00                   │
│ Sua Margem: [__20%__] = R$ 30,00      │
│ [✅ ATIVAR NO MEU SITE]                │
├─────────────────────────────────────────┤
│ [Imagem] Gloss Hidratante              │
│ Preço Base: R$ 18,00                   │
│ Sua Margem: [__25%__] = R$ 22,50      │
│ [✅ ATIVAR NO MEU SITE]                │
└─────────────────────────────────────────┘
```

### 6️⃣ **Notificações**

```typescript
// Quando Admin aprova 10 produtos:
INSERT INTO reseller_notifications (
  reseller_id,
  type: 'new_products',
  title: '🆕 10 novos produtos disponíveis!',
  message: 'Revise e ative no seu site',
  metadata: { product_ids: [...] }
)
```

---

## 📊 TABELA DE ESTADOS

| Situação          | admin_aprovado | ativo   | is_active (reseller) | Aparece no Site? |
| ----------------- | -------------- | ------- | -------------------- | ---------------- |
| Chegou FácilZap   | `false`        | `false` | -                    | ❌ NÃO           |
| Admin aprovou     | `true`         | `true`  | `false`              | ❌ NÃO           |
| Franqueada ativou | `true`         | `true`  | `true`               | ✅ SIM           |
| Admin rejeitou    | `false`        | `false` | -                    | ❌ NUNCA         |
| Sem estoque       | `true`         | `false` | `true`               | ❌ NÃO           |

---

## 🎯 BENEFÍCIOS

1. ✅ **Admin controla** o que vai para revendedoras
2. ✅ **Evita produtos indesejados** (Kit Empreendedora)
3. ✅ **Franqueada sabe** quais produtos são novos
4. ✅ **Franqueada define margem** antes de ativar
5. ✅ **Rastreabilidade total** (quem aprovou, quando)
6. ✅ **Notificações** para franqueadas

---

## 🚀 PRIORIDADE DE IMPLEMENTAÇÃO

### **FASE 1: Urgente (hoje)**

- [ ] Adicionar campos `admin_aprovado` na tabela `produtos`
- [ ] Modificar sync FácilZap para `admin_aprovado = false`
- [ ] Criar página `/admin/produtos/pendentes`
- [ ] Criar API `/api/admin/produtos/aprovar`

### **FASE 2: Importante (amanhã)**

- [ ] Modificar vinculação para só vincular produtos aprovados
- [ ] Adicionar badge "NOVO" nos produtos `is_active = false`
- [ ] Criar página `/revendedora/produtos/novos`

### **FASE 3: Melhorias (depois)**

- [ ] Sistema de notificações push
- [ ] Histórico de aprovações
- [ ] Aprovação em massa

---

## 🔍 QUERIES ÚTEIS

### Ver produtos aguardando aprovação:

```sql
SELECT id, nome, estoque, preco_base, ultima_sincronizacao
FROM produtos
WHERE admin_aprovado = false
  AND admin_rejeitado = false
ORDER BY ultima_sincronizacao DESC;
```

### Ver produtos novos para uma franqueada:

```sql
SELECT p.id, p.nome, p.preco_base, rp.is_active
FROM produtos p
JOIN reseller_products rp ON rp.product_id = p.id
WHERE rp.reseller_id = 'UUID_FRANQUEADA'
  AND p.admin_aprovado = true
  AND rp.is_active = false
ORDER BY rp.created_at DESC;
```

---

## ❓ QUER QUE EU IMPLEMENTE?

Posso começar pela **FASE 1** agora:

1. Criar migration com novos campos
2. Modificar sync FácilZap
3. Criar página de aprovação do Admin

**Me confirma se é isso que você precisa!** 🚀
