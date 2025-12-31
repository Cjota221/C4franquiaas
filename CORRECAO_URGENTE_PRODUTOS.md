# ⚠️ CORREÇÃO URGENTE - PRODUTOS DESATIVADOS

## 🔴 PROBLEMA IDENTIFICADO

A Migration 049 desativou **TODOS os produtos** ao definir `ativo = false` por padrão no sync.

**Sintoma:**
- Erro 504 na sincronização (timeout)
- Produtos que estavam ativos ficaram inativos
- Sites públicos podem estar sem produtos

---

## ✅ SOLUÇÃO RÁPIDA (EXECUTAR AGORA)

### 1️⃣ Aplicar Migration 050 no Supabase

**Copie e cole este SQL no SQL Editor do Supabase:**

```sql
-- Restaurar produtos ativos que foram aprovados e têm estoque
UPDATE produtos
SET ativo = true
WHERE admin_aprovado = true
  AND estoque > 0
  AND (desativado_manual IS NULL OR desativado_manual = false)
  AND ativo = false;

-- Verificação
SELECT 
  COUNT(*) FILTER (WHERE ativo = true) as ativos,
  COUNT(*) FILTER (WHERE admin_aprovado = true) as aprovados,
  COUNT(*) as total
FROM produtos;
```

**Resultado esperado:**
```
ativos: 219 (ou mais)
aprovados: 219 (ou mais)
total: 219+ produtos
```

---

### 2️⃣ Deploy do Código Corrigido

```powershell
git pull
npm run build
# Deploy automático via Netlify
```

**Mudanças aplicadas:**
- ✅ Timeout de 4 minutos na API FácilZap
- ✅ Export `maxDuration = 300` para Vercel/Netlify
- ✅ Sync preserva status `ativo` de produtos existentes
- ✅ Logs mais detalhados com emojis

---

## 🔍 VERIFICAÇÃO

### Testar Sincronização:
```bash
# No navegador ou Postman
GET https://seu-site.com/api/sync-produtos

# Deve retornar (sem erro 504):
{
  "ok": true,
  "processed": 219,
  "new": 0,
  "updated": 5,
  "unchanged": 214
}
```

### Verificar Produtos no Painel:
1. Acessar `/admin/produtos`
2. ✅ Ver produtos ativos
3. ✅ Filtrar "Somente Ativos" deve mostrar produtos

### Verificar Site Público:
1. Acessar `https://slug-franqueada.sualoja.com.br/catalogo`
2. ✅ Produtos devem estar visíveis

---

## 📊 QUERY DE DIAGNÓSTICO

Execute no Supabase para diagnosticar:

```sql
-- Ver resumo dos produtos
SELECT 
  ativo,
  admin_aprovado,
  admin_rejeitado,
  COUNT(*) as quantidade,
  SUM(estoque) as estoque_total
FROM produtos
GROUP BY ativo, admin_aprovado, admin_rejeitado
ORDER BY ativo DESC, admin_aprovado DESC;
```

**Resultado esperado:**

| ativo | admin_aprovado | admin_rejeitado | quantidade | estoque_total |
|-------|----------------|-----------------|------------|---------------|
| true  | true          | false           | 219        | 1500+         |
| false | true          | false           | 0          | 0             |
| false | false         | false           | 5          | 0             |

---

## 🛠️ O QUE FOI CORRIGIDO

### Arquivo: `migrations/050_corrigir_produtos_ativos.sql`
- Restaura `ativo = true` para produtos aprovados com estoque

### Arquivo: `app/api/sync-produtos/route.ts`
- **Timeout:** 4 minutos para evitar 504
- **Export config:** `maxDuration = 300` e `dynamic = 'force-dynamic'`
- **Preservação:** Mantém `ativo = true` de produtos existentes
- **Logs:** Emojis para facilitar leitura
- **Reativação inteligente:** Produtos que voltam a ter estoque são reativados automaticamente

### Lógica Corrigida:

```typescript
// ANTES (BUGADO):
const ativo = false; // ❌ Desativava TUDO

// DEPOIS (CORRETO):
if (!existing) {
  // Produto NOVO → fica pendente
  ativo = false;
} else {
  // Produto EXISTENTE → MANTÉM status atual
  ativo = existing.ativo; // ✅ Preserva
  
  // Se reestocado e aprovado → reativa
  if (estoque > 0 && existing.estoque === 0 && admin_aprovado) {
    ativo = true; // ✅ Reativa
  }
}
```

---

## 📝 CHECKLIST DE VERIFICAÇÃO

- [ ] Migration 050 executada no Supabase
- [ ] Produtos ativos contados (deve ser 219+)
- [ ] Código commitado e deployed
- [ ] Sincronização testada (sem 504)
- [ ] Painel admin mostra produtos ativos
- [ ] Site público mostra catálogo
- [ ] Logs de sync estão limpos (sem erros)

---

## 🆘 SE CONTINUAR COM PROBLEMAS

### Problema: Ainda dá 504

**Solução:** Sincronizar por páginas:

```bash
# Sincronizar página 1
POST /api/sync-produtos
{ "page": 1, "length": 50 }

# Sincronizar página 2
POST /api/sync-produtos
{ "page": 2, "length": 50 }

# ... continuar até última página
```

### Problema: Produtos não aparecem no site

**Verificar RLS:**
```sql
-- No Supabase SQL Editor
SELECT * FROM reseller_products 
WHERE reseller_id = 'UUID_DA_FRANQUEADA' 
AND is_active = true;
```

Se retornar vazio:
```sql
-- Reativar produtos na franqueada
UPDATE reseller_products rp
SET is_active = true
FROM produtos p
WHERE rp.product_id = p.id
  AND p.ativo = true
  AND p.admin_aprovado = true
  AND rp.reseller_id = 'UUID_DA_FRANQUEADA';
```

---

## 📞 ARQUIVOS IMPORTANTES

- ✅ `migrations/050_corrigir_produtos_ativos.sql` - Correção urgente
- ✅ `app/api/sync-produtos/route.ts` - Sync corrigido
- 📖 `FLUXO_APROVACAO_IMPLEMENTADO.md` - Documentação completa

---

**🚨 EXECUTE A MIGRATION 050 IMEDIATAMENTE! 🚨**
