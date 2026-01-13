# 🚨 PROBLEMA: Produtos Desativam Sozinhos no Painel Admin

## 🔍 Diagnóstico

Você ativa produtos no painel admin mas eles desativam automaticamente. Isso pode ter várias causas:

### Causa 1: Trigger de Ativação Bloqueada (REMOVIDO)

✅ **JÁ FOI REMOVIDO** pela migration 057

### Causa 2: Trigger de Estoque Zero

⚠️ **POSSÍVEL CULPADO** - Existe trigger que desativa produtos quando estoque = 0

### Causa 3: Auto-vinculação com Margem Zero

⚠️ **POSSÍVEL CULPADO** - Quando você ativa no admin, o produto é vinculado às revendedoras com margem 0%

---

## 🧪 PASSO 1: Executar Diagnóstico

Copie e cole este SQL no **Supabase SQL Editor**:

```sql
-- Verificar triggers ativos
SELECT
    tgname,
    pg_get_triggerdef(oid) AS definicao
FROM pg_trigger
WHERE tgrelid = 'produtos'::regclass
AND tgname NOT LIKE 'RI_%'
ORDER BY tgname;

-- Verificar produtos recém-ativados
SELECT
    p.id,
    p.nome,
    p.ativo,
    p.estoque,
    p.updated_at
FROM produtos p
WHERE p.updated_at > NOW() - INTERVAL '2 hours'
ORDER BY p.updated_at DESC;

-- Verificar se produtos estão sendo vinculados com margem zero
SELECT
    p.nome,
    p.ativo AS admin_ativo,
    rp.is_active AS revendedora_ativo,
    rp.margin_percent,
    r.store_name
FROM produtos p
JOIN reseller_products rp ON rp.product_id = p.id
JOIN resellers r ON r.id = rp.reseller_id
WHERE p.updated_at > NOW() - INTERVAL '2 hours'
ORDER BY p.updated_at DESC
LIMIT 20;
```

---

## 🔧 PASSO 2: Soluções Possíveis

### Solução A: Se produtos têm estoque = 0

Execute este SQL:

```sql
-- Desabilitar trigger de desativação por estoque
DROP TRIGGER IF EXISTS trigger_reativar_estoque ON produtos;
DROP TRIGGER IF EXISTS trigger_desativar_estoque_zero ON produtos;
```

### Solução B: Se produtos estão sendo vinculados com margem 0%

O problema está no trigger de auto-vinculação. Verifique se a migration 057 foi aplicada:

```sql
-- Verificar se função usa margem 100%
SELECT prosrc FROM pg_proc WHERE proname = 'auto_vincular_produto_revendedoras';
```

Se não mostra `margin_percent = 100`, aplique a migration 057 novamente.

---

## 🎯 SOLUÇÃO DEFINITIVA: Aplicar Migration 057

A migration 057 garante que:

- ✅ Produtos são vinculados com margem 100% por padrão
- ✅ Remove trigger bloqueador
- ✅ Ativa produtos automaticamente

**Execute:**

1. Abra **Supabase** → **SQL Editor**
2. Cole o conteúdo do arquivo `migrations/057_margem_padrao_100_porcento.sql`
3. Execute
4. Teste ativar um produto no painel admin

---

## 📊 Verificação Final

Após aplicar a solução, teste:

1. **Ativar um produto** no painel admin
2. **Executar esta query** para confirmar:

```sql
SELECT
    p.nome,
    p.ativo,
    COUNT(rp.id) AS vinculacoes,
    COUNT(rp.id) FILTER (WHERE rp.is_active = true) AS ativas,
    AVG(rp.margin_percent) AS margem_media
FROM produtos p
LEFT JOIN reseller_products rp ON rp.product_id = p.id
WHERE p.id = 'ID_DO_PRODUTO_TESTADO'
GROUP BY p.id, p.nome, p.ativo;
```

**Resultado esperado:**

- `ativo = true`
- `vinculacoes > 0`
- `ativas = vinculacoes` (todas ativas)
- `margem_media = 100`

---

## 🆘 Se o Problema Persistir

Execute o diagnóstico completo do arquivo `diagnostico-produtos-desativam-sozinhos.sql` e me envie os resultados dos triggers ativos.
