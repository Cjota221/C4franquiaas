# Cenários de Teste - Vinculação de Produtos às Revendedoras

**Data:** 10 de Janeiro de 2026  
**Versão:** 1.0

---

## Correções Implementadas

### 1. API `/api/admin/produtos/nao-vinculados`

**Arquivo:** `app/api/admin/produtos/nao-vinculados/route.ts`

**Antes (problema):**

- Considerava "vinculado" se existia QUALQUER registro em `reseller_products`
- Não verificava se a revendedora estava ativa/aprovada
- Produto vinculado a 1 de 5 revendedoras não aparecia como "não vinculado"

**Depois (corrigido):**

- Busca apenas revendedoras com `status = 'aprovada'` E `is_active = true`
- Produto só é considerado "totalmente vinculado" se tiver registro para TODAS as revendedoras ativas
- Retorna informações extras: `_vinculacoes_faltando` e `_vinculacoes_existentes`

### 2. API `/api/admin/produtos/vincular-revendedoras`

**Arquivo:** `app/api/admin/produtos/vincular-revendedoras/route.ts`

**Melhorias:**

- Agora filtra por `status = 'aprovada'` E `is_active = true`
- Retorna detalhes: `vinculacoes_novas` vs `vinculacoes_atualizadas`
- Processamento em lotes (500 por vez) para evitar timeout
- Produtos novos começam com `is_active = false` (revendedora precisa ativar)
- Preserva margem existente ou deixa `null` para nova

### 3. Página de Produtos

**Arquivo:** `app/admin/produtos/page.tsx`

**Melhorias:**

- Função `vincularRevendedoras()` agora aceita array de IDs específicos
- Após vincular, chama `carregarProdutosNaoVinculados()` automaticamente
- Se contador chega a 0, desativa filtro de "não vinculados"
- Mensagens de feedback mais detalhadas

---

## Cenários de Teste Manual

### Cenário 1: Produto sem nenhum registro em `reseller_products`

**Pré-condição:**

- Ter pelo menos 1 revendedora ativa/aprovada
- Criar/ativar um produto que não tenha registros em `reseller_products`

**Passos:**

1. Acesse "Gerenciar Produtos"
2. Verifique se aparece o alerta "X produtos não vinculados"
3. Clique em "Ver" para filtrar
4. Confirme que o produto aparece na lista
5. Clique em "Vincular Todos"
6. Aguarde a mensagem de sucesso

**Resultado esperado:**

- Alerta deve desaparecer (ou contador diminuir)
- Produto deve sumir da lista de "não vinculados"
- Mensagem: "X produto(s) vinculado(s) a Y revendedora(s) (N nova(s))"

**Verificação no banco:**

```sql
SELECT * FROM reseller_products WHERE product_id = 'UUID_DO_PRODUTO';
```

Deve haver um registro para cada revendedora ativa/aprovada.

---

### Cenário 2: Produto vinculado a TODAS as revendedoras

**Pré-condição:**

- Produto ativo com registros em `reseller_products` para TODAS as revendedoras ativas

**Passos:**

1. Acesse "Gerenciar Produtos"
2. Verifique o contador de "não vinculados"

**Resultado esperado:**

- Produto NÃO deve aparecer na lista de "não vinculados"
- Se não há nenhum produto sem vinculação, o alerta não aparece

**Verificação no banco:**

```sql
-- Contar revendedoras ativas
SELECT COUNT(*) FROM resellers WHERE status = 'aprovada' AND is_active = true;

-- Contar vinculações do produto
SELECT COUNT(*) FROM reseller_products WHERE product_id = 'UUID_DO_PRODUTO';

-- Ambos devem ser iguais
```

---

### Cenário 3: Clicar "Vincular Todos" zera o contador

**Pré-condição:**

- Ter alguns produtos não vinculados (contador > 0)

**Passos:**

1. Acesse "Gerenciar Produtos"
2. Anote o número no alerta "X produtos não vinculados"
3. Clique em "Vincular Todos"
4. Aguarde o processamento (loading spinner)
5. Observe a mensagem de sucesso

**Resultado esperado:**

- Loading spinner durante processamento
- Mensagem de sucesso com detalhes
- Contador atualiza para 0
- Alerta desaparece
- Se tinha filtro "Ver" ativo, volta para visualização normal

**Verificação no banco:**

```sql
-- Produtos ativos sem vinculação completa (deve retornar 0)
SELECT p.id, p.nome,
  (SELECT COUNT(*) FROM resellers WHERE status = 'aprovada' AND is_active = true) as total_revendedoras,
  (SELECT COUNT(*) FROM reseller_products rp WHERE rp.product_id = p.id) as vinculacoes
FROM produtos p
WHERE p.ativo = true
HAVING vinculacoes < total_revendedoras;
```

---

## Cenário Extra: Nova revendedora aprovada

**Situação:**
Quando uma nova revendedora é aprovada, os produtos existentes NÃO têm vinculação para ela.

**Comportamento esperado:**

- O contador de "não vinculados" deve aumentar
- Ao clicar "Vincular Todos", os produtos são vinculados à nova revendedora

**Passos para testar:**

1. Aprovar uma nova revendedora
2. Voltar para "Gerenciar Produtos"
3. Verificar se o contador aumentou
4. Clicar "Vincular Todos"
5. Verificar se contador zerou

---

## Queries de Debug

### Ver produtos não vinculados (mesmo cálculo da API)

```sql
WITH revendedoras_ativas AS (
  SELECT id FROM resellers
  WHERE status = 'aprovada' AND is_active = true
),
total_revendedoras AS (
  SELECT COUNT(*) as total FROM revendedoras_ativas
),
vinculacoes_por_produto AS (
  SELECT
    rp.product_id,
    COUNT(DISTINCT rp.reseller_id) as vinculacoes
  FROM reseller_products rp
  INNER JOIN revendedoras_ativas ra ON rp.reseller_id = ra.id
  GROUP BY rp.product_id
)
SELECT
  p.id,
  p.nome,
  p.ativo,
  COALESCE(v.vinculacoes, 0) as vinculacoes_existentes,
  (SELECT total FROM total_revendedoras) as total_revendedoras,
  (SELECT total FROM total_revendedoras) - COALESCE(v.vinculacoes, 0) as faltando
FROM produtos p
LEFT JOIN vinculacoes_por_produto v ON p.id = v.product_id
WHERE p.ativo = true
  AND COALESCE(v.vinculacoes, 0) < (SELECT total FROM total_revendedoras)
ORDER BY p.created_at DESC;
```

### Ver revendedoras que faltam para um produto específico

```sql
SELECT r.id, r.store_name, r.slug
FROM resellers r
WHERE r.status = 'aprovada'
  AND r.is_active = true
  AND r.id NOT IN (
    SELECT rp.reseller_id
    FROM reseller_products rp
    WHERE rp.product_id = 'UUID_DO_PRODUTO'
  );
```

---

## Localização do Código

| Funcionalidade                       | Arquivo                                                 |
| ------------------------------------ | ------------------------------------------------------- |
| Cálculo de "não vinculados"          | `app/api/admin/produtos/nao-vinculados/route.ts`        |
| Ação de vincular                     | `app/api/admin/produtos/vincular-revendedoras/route.ts` |
| UI do alerta                         | `app/admin/produtos/page.tsx` (linha ~960)              |
| Função vincularRevendedoras          | `app/admin/produtos/page.tsx` (linha ~615)              |
| State de não vinculados              | `app/admin/produtos/page.tsx` (linha ~80)               |
| Função carregarProdutosNaoVinculados | `app/admin/produtos/page.tsx` (linha ~107)              |
