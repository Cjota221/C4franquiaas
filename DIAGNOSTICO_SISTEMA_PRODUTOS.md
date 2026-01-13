# 🔍 DIAGNÓSTICO COMPLETO - Sistema de Vinculação de Produtos

## 📋 Sumário Executivo

Este documento analisa o fluxo completo de vinculação e desvinculação de produtos entre FácilZap, C4 Admin e Revendedoras/Franqueadas.

---

## 🏗️ ARQUITETURA DO SISTEMA

### Tabelas Principais

```
┌─────────────────────┐
│      produtos       │  ← Tabela master de produtos
│  - id (UUID)        │
│  - id_externo       │  ← ID do FácilZap (chave de reconciliação)
│  - ativo            │  ← Ativo no painel admin
│  - estoque          │
│  - admin_aprovado   │
└─────────┬───────────┘
          │
          │ produto_id
          ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   reseller_products     │     │   produtos_franqueadas  │
│  - reseller_id (FK)     │     │  - franqueada_id (FK)   │
│  - product_id (FK)      │     │  - produto_id (FK)      │
│  - is_active            │     └───────────┬─────────────┘
│  - margin_percent       │                 │
└─────────────────────────┘                 │ produto_franqueada_id
                                            ▼
                          ┌────────────────────────────────┐
                          │  produtos_franqueadas_precos   │
                          │  - ativo_no_site               │
                          │  - margem                      │
                          └────────────────────────────────┘
```

### Fluxos de Sincronização

```
┌──────────────┐
│   FácilZap   │
│    (API)     │
└──────┬───────┘
       │
       ├──────────────────────────────────────┐
       │                                      │
       ▼ (Pull - /api/sync-produtos)          ▼ (Push - /api/webhook/facilzap)
┌──────────────────────┐              ┌─────────────────────────┐
│ Sincronização Manual │              │ Webhook Events          │
│ ou Agendada          │              │ - produto_alterado      │
│                      │              │ - produto_excluido      │
│ Busca TODOS produtos │              │ - estoque_baixo         │
│ do FácilZap          │              └─────────────────────────┘
└──────────────────────┘
```

---

## 🔄 FLUXO DETALHADO DE VINCULAÇÃO

### 1. Produto Novo do FácilZap

```
FácilZap → sync-produtos → INSERT em "produtos"
                              ↓
                        admin_aprovado = false
                        ativo = true
                              ↓
                        [TRIGGER NÃO DISPARA]
                        (porque admin_aprovado = false)
```

### 2. Admin Aprova Produto

```
Admin aprova → função aprovar_produtos()
                    ↓
              admin_aprovado = true
              ativo = true
                    ↓
              INSERT INTO reseller_products
              - is_active = FALSE  ← Produto inativo para revendedora
              - margin_percent = 0 ← Sem margem definida
                    ↓
              INSERT INTO reseller_notifications
              "🆕 Novos produtos disponíveis!"
```

### 3. Revendedora Define Margem

```
Revendedora define margem → UPDATE reseller_products
                                 ↓
                           margin_percent = X%
                           is_active = TRUE
                                 ↓
                           [TRIGGER] update_reseller_total_products()
                           Atualiza total_products na resellers
```

---

## ⚠️ PONTOS DE DESATIVAÇÃO AUTOMÁTICA

### Ponto 1: Estoque Zero (sync-produtos)

**Localização:** `app/api/sync-produtos/route.ts` - função `desativarProdutosEstoqueZero()`

```typescript
// Produtos com estoque = 0 são DESATIVADOS em:
// - produtos_franqueadas_precos.ativo_no_site = false
// - reseller_products.is_active = false
```

**Impacto:** Produtos desaparecem da loja mas NÃO são deletados.

### Ponto 2: Estoque Zero via Webhook

**Localização:** `app/api/webhook/facilzap/route.ts` - função `handleProdutoEstoque()`

```typescript
// Evento: produto_alterado com estoque = 0
// Ação: Desativa em revendedoras e franqueadas
```

### Ponto 3: Produto Excluído do FácilZap

**Localização:** `app/api/sync-produtos/route.ts` - função `detectarProdutosExcluidos()`

```typescript
// Compara produtos do FácilZap com banco local
// Se produto NÃO EXISTE mais no FácilZap → DELETE cascata
```

**IMPORTANTE:** Esta função DELETA apenas produtos que NÃO EXISTEM no FácilZap.
Produtos com estoque zero que EXISTEM no FácilZap NÃO são deletados.

---

## 🐛 POSSÍVEIS CAUSAS DE PROBLEMAS

### Problema 1: "Produtos aparecem como não vinculados"

**Causa Provável:** O endpoint `/api/admin/produtos/nao-vinculados` verifica:

```sql
-- Conta quantas revendedoras ativas existem
SELECT COUNT(*) FROM resellers WHERE status = 'aprovada' AND is_active = true

-- Conta quantas vinculações o produto tem
SELECT COUNT(*) FROM reseller_products WHERE product_id = X

-- Se vinculações < total_revendedoras → "não vinculado"
```

**Cenário:**

- Nova revendedora é aprovada
- Produtos antigos não são auto-vinculados a ela
- Produtos aparecem como "não vinculados"

**Solução:** Executar "Vincular a Revendedoras" manualmente ou verificar trigger.

### Problema 2: "Produtos desativados incorretamente"

**Causa 1:** Sync detectou estoque = 0

- Verificar se `estoque` está chegando como 0 do FácilZap
- Logs: `logs_sincronizacao WHERE tipo = 'estoque_zerado'`

**Causa 2:** Webhook de estoque baixo

- FácilZap enviou evento de estoque
- Logs: `logs_sincronizacao WHERE tipo = 'webhook_estoque'`

**Causa 3:** Erro na API do FácilZap

- Timeout ou erro retornou lista vazia
- Sistema interpretou como "todos produtos deletados"
- **PROTEÇÃO:** A função `detectarProdutosExcluidos` só roda se recebeu produtos válidos

### Problema 3: "Reativação não funciona"

**Verificar:**

1. Produto tem `admin_aprovado = true`?
2. Produto tem `ativo = true` na tabela `produtos`?
3. Revendedora definiu margem > 0?

**Lógica de reativação (linha 391-472 do sync-produtos):**

```typescript
// Só reativa se:
// - Produto tem estoque > 0
// - Produto está ativo no admin (ativo = true)
// - Reseller_product.is_active = false (estava desativado)
```

---

## 📊 QUERIES DE DIAGNÓSTICO

### Ver produtos "não vinculados" e por quê

```sql
-- Produtos aprovados mas sem vinculação completa
WITH stats AS (
  SELECT COUNT(*) as total_revendedoras
  FROM resellers
  WHERE status = 'aprovada' AND is_active = true
)
SELECT
  p.id,
  p.nome,
  p.estoque,
  p.ativo,
  p.admin_aprovado,
  COUNT(rp.id) as vinculacoes,
  s.total_revendedoras,
  CASE
    WHEN COUNT(rp.id) = 0 THEN '❌ ZERO vinculações'
    WHEN COUNT(rp.id) < s.total_revendedoras THEN '⚠️ Vinculação parcial'
    ELSE '✅ OK'
  END as status
FROM produtos p
CROSS JOIN stats s
LEFT JOIN reseller_products rp ON rp.product_id = p.id
WHERE p.admin_aprovado = true
GROUP BY p.id, p.nome, p.estoque, p.ativo, p.admin_aprovado, s.total_revendedoras
HAVING COUNT(rp.id) < s.total_revendedoras
ORDER BY COUNT(rp.id) ASC;
```

### Ver logs de desativação recentes

```sql
SELECT
  created_at,
  tipo,
  descricao,
  payload->>'nome' as produto_nome,
  payload->>'produto_id' as produto_id
FROM logs_sincronizacao
WHERE tipo IN ('estoque_zerado', 'produto_desativado', 'webhook_estoque')
ORDER BY created_at DESC
LIMIT 50;
```

### Ver produtos desativados que deveriam estar ativos

```sql
-- Produtos com estoque > 0 mas desativados
SELECT
  p.id,
  p.nome,
  p.estoque,
  p.ativo as ativo_admin,
  rp.is_active as ativo_revendedora,
  rp.margin_percent
FROM produtos p
JOIN reseller_products rp ON rp.product_id = p.id
WHERE p.estoque > 0
  AND p.ativo = true
  AND p.admin_aprovado = true
  AND rp.is_active = false
ORDER BY p.nome;
```

### Ver timeline de um produto específico

```sql
SELECT
  created_at,
  tipo,
  descricao,
  sucesso
FROM logs_sincronizacao
WHERE produto_id = 'UUID_DO_PRODUTO'
   OR payload::text LIKE '%UUID_DO_PRODUTO%'
ORDER BY created_at DESC;
```

---

## ✅ FLUXO CORRETO DE EXCLUSÃO (IMPLEMENTADO)

### O que acontece quando produto é DELETADO do FácilZap:

1. **Sync Manual:** `/api/sync-produtos`

   - Busca TODOS os produtos do FácilZap
   - Compara com banco local
   - Produtos que NÃO existem mais → DELETADOS em cascata

2. **Webhook:** `/api/webhook/facilzap` evento `produto_excluido`
   - FácilZap envia ID do produto excluído
   - Sistema DELETA produto + vinculações

### O que NÃO deve acontecer:

❌ Produto com estoque = 0 ser DELETADO (apenas desativado)
❌ Produto desativado manualmente ser DELETADO
❌ Produto sem aprovação ser DELETADO

---

## 🛠️ TRIGGERS ATIVOS NO BANCO

### trigger_auto_vincular_revendedoras (produtos)

```sql
-- Dispara APÓS INSERT ou UPDATE de "ativo" em produtos
-- Quando produto.ativo muda para TRUE:
--   → Insere em reseller_products para todas revendedoras aprovadas
--   → is_active = TRUE (PROBLEMA: deveria ser FALSE por migration 051)
```

⚠️ **ATENÇÃO:** A migration 048 define `is_active = true`, mas a migration 051
alterou a função `aprovar_produtos` para usar `is_active = false`.
O TRIGGER pode estar desatualizado!

### trigger_update_reseller_total_products (reseller_products)

```sql
-- Dispara APÓS INSERT/UPDATE/DELETE em reseller_products
-- Atualiza resellers.total_products com COUNT de produtos ativos
```

---

## 🔧 AÇÕES RECOMENDADAS

### 1. Verificar se trigger está atualizado

```sql
-- Ver definição atual do trigger
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'auto_vincular_produto_revendedoras';
```

### 2. Corrigir trigger para usar is_active = false

```sql
CREATE OR REPLACE FUNCTION auto_vincular_produto_revendedoras()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ativo = true AND (TG_OP = 'INSERT' OR OLD.ativo = false) THEN
    INSERT INTO reseller_products (
      reseller_id, product_id, margin_percent, is_active, created_at
    )
    SELECT r.id, NEW.id, 0, FALSE, NOW()  -- ← is_active = FALSE
    FROM resellers r
    WHERE r.status = 'aprovada' AND r.is_active = true
    ON CONFLICT (reseller_id, product_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. Vincular produtos faltantes

```sql
-- Vincular TODOS os produtos aprovados a TODAS as revendedoras
INSERT INTO reseller_products (reseller_id, product_id, margin_percent, is_active)
SELECT r.id, p.id, 0, FALSE
FROM resellers r
CROSS JOIN produtos p
WHERE r.status = 'aprovada'
  AND r.is_active = true
  AND p.admin_aprovado = true
  AND p.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM reseller_products rp
    WHERE rp.reseller_id = r.id AND rp.product_id = p.id
  );
```

---

## 📝 RESUMO

| Situação                     | Ação do Sistema                |
| ---------------------------- | ------------------------------ |
| Produto com estoque = 0      | DESATIVA (is_active = false)   |
| Produto deletado do FácilZap | DELETA do banco                |
| Produto desativado no admin  | NÃO muda vinculações           |
| Nova revendedora aprovada    | Trigger deve vincular produtos |
| Estoque volta > 0            | REATIVA automaticamente        |

---

_Documento gerado em: $(date)_
_Versão: 1.0_
