# ✅ Produtos Novos - Fluxo Corrigido!

## 🎯 O que foi alterado:

### 1️⃣ **Produtos novos agora vêm DESATIVADOS**

- ❌ Antes: Vinham com margem de 20% pré-definida
- ✅ Agora: Vêm com `margin_percent = 0` e `is_active = false`
- ✅ Revendedora **PRECISA** definir margem antes de ativar

### 2️⃣ **Menu "Produtos Novos" removido**

- ❌ Removido: Item separado no menu lateral
- ✅ Agora: Badge de contador no menu "Produtos" principal

### 3️⃣ **Card visual de Produtos Novos**

- ✅ Card roxo/rosa chamativo na página de produtos
- ✅ Mostra quantos produtos novos chegaram
- ✅ 2 botões de ação rápida:
  - "Ver Produtos Novos" - Filtra apenas os novos
  - "Definir Margem em Massa" - Abre modal para definir margem em todos

## 📝 Como funciona agora:

### Admin aprova produto no painel:

1. Admin vai em `/admin/produtos/pendentes`
2. Seleciona produtos e clica "Aprovar"
3. Produtos são vinculados às revendedoras

### Produto chega para revendedora:

```typescript
{
  product_id: "abc-123",
  margin_percent: 0,        // 🆕 SEM margem pré-definida
  custom_price: null,       // 🆕 SEM preço customizado
  is_active: false,         // 🆕 DESATIVADO
  vista_pela_franqueada: false
}
```

### Revendedora vê o card:

```
╔══════════════════════════════════════════════════╗
║  ✨ Produtos Novos Chegaram!                 5  ║
║                                                  ║
║  5 produtos novos precisam da sua atenção.      ║
║  Eles estão desativados e aguardando que        ║
║  você defina sua margem de lucro!               ║
║                                                  ║
║  [Ver Produtos Novos] [Definir Margem em Massa] ║
╚══════════════════════════════════════════════════╝
```

### Revendedora define margem:

1. Clica em "Definir Margem em Massa"
2. Define margem (ex: 35%)
3. Sistema calcula `custom_price = preco_base * 1.35`
4. Produto continua **desativado**

### Revendedora ativa produto:

1. Após definir margem, clica no botão de ativar
2. Produto muda para `is_active = true`
3. Agora aparece no catálogo público!

## 🎨 Visual do Card:

### Desktop:

```
┌──────────────────────────────────────────────────────────┐
│ ✨ Produtos Novos Chegaram!                          [5] │
│                                                            │
│ 5 produtos novos precisam da sua atenção. Eles estão     │
│ desativados e aguardando que você defina sua margem!     │
│                                                            │
│ [👁️  Ver Produtos Novos]  [💰 Definir Margem em Massa]  │
└──────────────────────────────────────────────────────────┘
```

### Mobile:

```
┌────────────────────────────────┐
│ ✨ Produtos Novos!        [5] │
│                                 │
│ 5 produtos novos precisam      │
│ da sua atenção!                 │
│                                 │
│ [Ver Produtos Novos]            │
│ [Definir Margem em Massa]       │
└────────────────────────────────┘
```

## 📊 Migration 051:

**Arquivo:** `migrations/051_produtos_novos_desativados.sql`

**Principais mudanças:**

```sql
-- Antes (Migration 049)
INSERT INTO reseller_products (...)
SELECT
  r.id,
  p.id,
  p.preco_base * 1.20,  -- ❌ Margem pré-definida
  20,                    -- ❌ 20% automático
  false,                 -- ✅ Desativado (OK)
  ...

-- Agora (Migration 051)
INSERT INTO reseller_products (...)
SELECT
  r.id,
  p.id,
  NULL,                  -- ✅ SEM preço pré-definido
  0,                     -- ✅ SEM margem pré-definida
  false,                 -- ✅ Desativado
  ...
```

**View atualizada:**

```sql
CREATE OR REPLACE VIEW produtos_novos_franqueada AS
SELECT ...
WHERE p.admin_aprovado = true
  AND p.ativo = true
  AND rp.is_active = false              -- Desativado
  AND (rp.margin_percent = 0 OR ...)    -- 🆕 Sem margem
```

## 🎯 Identificação de Produtos Novos:

```typescript
const produtosNovos = produtos.filter(
  (p) =>
    !p.is_active && // Está desativado
    (p.margin_percent === 0 || p.margin_percent === null), // Sem margem
);
```

## ✅ Checklist de Implementação:

- ✅ Migration 051 criada
- ✅ Função `aprovar_produtos()` atualizada
- ✅ View `produtos_novos_franqueada` atualizada
- ✅ Menu "Produtos Novos" removido do sidebar
- ✅ Badge de contador movido para menu "Produtos"
- ✅ Card visual criado na página de produtos
- ✅ Botões de ação rápida implementados
- ✅ Filtro automático para produtos novos
- ✅ Seleção em massa de produtos novos

## 🚀 Para Aplicar:

1. **Execute a migration no Supabase:**

   ```sql
   -- Copie o conteúdo de migrations/051_produtos_novos_desativados.sql
   -- Cole no SQL Editor do Supabase
   -- Execute!
   ```

2. **Reinicie o servidor Next.js:**

   ```bash
   npm run dev
   ```

3. **Teste o fluxo:**
   - Entre no painel admin
   - Aprove um produto novo
   - Entre no painel da revendedora
   - Veja o card de "Produtos Novos Chegaram!"
   - Clique em "Ver Produtos Novos"
   - Defina margem
   - Ative o produto

## 📌 Status:

- ✅ Código implementado
- ✅ Commit realizado (`606122b`)
- ⏳ **AGUARDANDO**: Aplicar migration 051 no Supabase
- ⏳ **AGUARDANDO**: Deploy no Netlify

---

**Criado em:** 01/01/2026  
**Implementado por:** GitHub Copilot  
**Commit:** `606122b`
