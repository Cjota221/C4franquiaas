# 📋 Documentação: Exclusão de Produtos do FácilZap

## 1. Análise da Integração Atual

### 1.1 Arquivos Envolvidos

| Arquivo                             | Função                                                               |
| ----------------------------------- | -------------------------------------------------------------------- |
| `lib/facilzapClient.ts`             | Cliente para API do FácilZap - busca produtos, normaliza dados       |
| `app/api/sync-produtos/route.ts`    | Sincronização manual/cron - busca TODOS produtos e compara com banco |
| `app/api/webhook/facilzap/route.ts` | Webhook para eventos em tempo real (estoque, pedidos, exclusão)      |

### 1.2 Endpoint da FácilZap

```typescript
const FACILZAP_API = 'https://api.facilzap.app.br';
// Busca paginada: GET /produtos?page=X&length=50
// Token: via header Authorization
```

### 1.3 Campo de Ligação Local ↔ FácilZap

O sistema usa **dois campos** para vincular o produto local ao produto da FácilZap:

| Campo         | Tabela     | Descrição                           |
| ------------- | ---------- | ----------------------------------- |
| `id_externo`  | `produtos` | ID principal do produto no FácilZap |
| `facilzap_id` | `produtos` | Redundância para compatibilidade    |

✅ **Confirmado**: Ambos são preenchidos durante a sincronização com o mesmo valor.

---

## 2. Estratégia de Exclusão Implementada

### 🎯 Estratégia Escolhida: **ARQUIVAR/DESATIVAR (Soft Delete)**

**Por quê?**

1. **Histórico de vendas**: Produtos podem ter vendas passadas vinculadas. Deletar fisicamente quebraria FKs ou perderia histórico.

2. **Auditoria**: Podemos rastrear quando e quais produtos foram removidos da FácilZap.

3. **Reversibilidade**: Se um produto for excluído por engano na FácilZap e recriado, podemos reativar.

4. **Segurança**: Evita perda acidental de dados.

### Campos Atualizados na Exclusão

```typescript
// Tabela: produtos
{
  ativo: false,                                    // Desativa o produto
  ultima_sincronizacao: new Date().toISOString()  // Marca quando foi detectado
}

// Tabela: produtos_franqueadas_precos
{
  ativo_no_site: false  // Remove das lojas das franqueadas
}

// Tabela: reseller_products
{
  is_active: false  // Remove das lojas das revendedoras
}
```

---

## 3. Implementação Existente

### 3.1 Detecção via Sync (Pull)

A função `detectarProdutosExcluidos()` em `/api/sync-produtos/route.ts`:

```typescript
async function detectarProdutosExcluidos(supabase, produtosFacilzap) {
  // 1. Criar Set de IDs que existem no FácilZap
  const idsFacilzap = new Set(produtosFacilzap.map((p) => String(p.id_externo)));

  // 2. Buscar produtos ATIVOS no nosso banco que vieram do FácilZap
  const { data: produtosNoBanco } = await supabase
    .from('produtos')
    .select('id, nome, id_externo, facilzap_id, ativo')
    .eq('ativo', true)
    .or('id_externo.not.is.null,facilzap_id.not.is.null');

  // 3. Encontrar produtos que NÃO existem mais no FácilZap
  const produtosExcluidos = produtosNoBanco.filter((p) => {
    const idExterno = p.id_externo || p.facilzap_id;
    return idExterno && !idsFacilzap.has(String(idExterno));
  });

  // 4. Desativar os produtos órfãos
  // ...
}
```

**Fluxo:**

1. Sync busca TODOS produtos do FácilZap
2. Compara com produtos ATIVOS no banco local que têm `id_externo`
3. Produtos locais que não existem mais no FácilZap são desativados

### 3.2 Detecção via Webhook (Push)

A função `handleProdutoExcluido()` em `/api/webhook/facilzap/route.ts`:

```typescript
async function handleProdutoExcluido(data, eventType) {
  const facilzapId = extractFacilZapId(data);

  // 1. Buscar produto existente
  const { data: produto } = await supabaseAdmin
    .from('produtos')
    .select('id, nome, facilzap_id, id_externo')
    .or(`facilzap_id.eq.${facilzapId},id_externo.eq.${facilzapId}`)
    .single();

  if (!produto) {
    return { produto_id: null, acao: 'ignorado' };
  }

  // 2. Desativar na tabela produtos
  await supabaseAdmin
    .from('produtos')
    .update({ ativo: false, ultima_sincronizacao: new Date().toISOString() })
    .eq('id', produto.id);

  // 3. Desativar em franqueadas e revendedoras
  // ...

  // 4. Registrar log
  await supabaseAdmin.from('logs_sincronizacao').insert({
    tipo: 'webhook_produto_excluido',
    // ...
  });
}
```

**Eventos Suportados:**

- `produto.excluido`
- `produto.deletado`
- `produto.deleted`
- `produto.removed`
- `produto.desativado`
- `produto.inativado`

---

## 4. Eventos de Webhook Suportados

```typescript
// No POST handler do webhook:
if (
  event.includes('excluido') ||
  event.includes('deletado') ||
  event.includes('deleted') ||
  event.includes('removed') ||
  event.includes('desativado') ||
  event.includes('inativado')
) {
  const result = await handleProdutoExcluido(data, event);
}
```

**Nota**: A FácilZap precisa enviar webhooks para:

```
POST https://c4franquiaas.netlify.app/api/webhook/facilzap
```

Com payload:

```json
{
  "event": "produto.excluido",
  "data": {
    "id": "12345",
    "nome": "Produto Teste"
  }
}
```

---

## 5. Comportamento no Painel Admin

### 5.1 Listagem de Produtos

Produtos com `ativo = false` **NÃO aparecem por padrão** na listagem.

Para ver produtos desativados, use o filtro "Inativos" ou "Todos".

### 5.2 Logs de Sincronização

Tabela `logs_sincronizacao` registra todas exclusões:

```sql
SELECT * FROM logs_sincronizacao
WHERE tipo IN ('webhook_produto_excluido', 'produtos_excluidos_facilzap')
ORDER BY created_at DESC;
```

---

## 6. Queries de Pré-Visualização

### 6.1 Ver produtos que seriam afetados (simulação)

Execute esta query NO SUPABASE para ver quais produtos seriam desativados:

```sql
-- ============================================
-- QUERY DE PRÉ-VISUALIZAÇÃO
-- Lista produtos que existem localmente mas
-- NÃO existem mais no FácilZap
-- ============================================

-- Primeiro, execute o sync para ter dados atualizados
-- Depois use esta query para verificar logs:

SELECT
  l.created_at,
  l.tipo,
  l.descricao,
  l.payload->'produtos' as produtos_afetados,
  l.payload->'total_excluidos' as total_excluidos
FROM logs_sincronizacao l
WHERE l.tipo = 'produtos_excluidos_facilzap'
ORDER BY l.created_at DESC
LIMIT 10;
```

### 6.2 Ver produtos atualmente desativados que vieram do FácilZap

```sql
SELECT
  id,
  nome,
  id_externo,
  facilzap_id,
  estoque,
  ativo,
  ultima_sincronizacao
FROM produtos
WHERE ativo = false
  AND (id_externo IS NOT NULL OR facilzap_id IS NOT NULL)
ORDER BY ultima_sincronizacao DESC
LIMIT 50;
```

### 6.3 Ver histórico de exclusões via webhook

```sql
SELECT
  created_at,
  tipo,
  descricao,
  produto_id,
  facilzap_id,
  payload
FROM logs_sincronizacao
WHERE tipo = 'webhook_produto_excluido'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 7. Passo-a-Passo de Teste

### 7.1 Teste Manual

1. **Na FácilZap**: Exclua 1 produto de teste
2. **No C4**: Execute a sincronização

   ```
   POST https://c4franquiaas.netlify.app/api/sync-produtos
   ```

   Ou pelo painel admin: botão "Sincronizar Produtos"

3. **Verificar no Supabase**:

   ```sql
   -- Ver se o produto foi desativado
   SELECT id, nome, ativo, ultima_sincronizacao
   FROM produtos
   WHERE id_externo = 'ID_DO_PRODUTO_EXCLUIDO';

   -- Ver log da exclusão
   SELECT * FROM logs_sincronizacao
   WHERE tipo = 'produtos_excluidos_facilzap'
   ORDER BY created_at DESC LIMIT 1;
   ```

4. **Verificar na listagem do admin**:

   - O produto NÃO deve aparecer na lista padrão
   - Deve aparecer se filtrar por "Inativos"

5. **Verificar em franqueadas/revendedoras**:

   ```sql
   SELECT pfp.ativo_no_site
   FROM produtos_franqueadas pf
   JOIN produtos_franqueadas_precos pfp ON pf.id = pfp.produto_franqueada_id
   WHERE pf.produto_id = 'ID_DO_PRODUTO';

   SELECT is_active
   FROM reseller_products
   WHERE product_id = 'ID_DO_PRODUTO';
   ```

6. **Verificar na loja pública**:
   - O produto NÃO deve aparecer no catálogo

### 7.2 Teste via Webhook (se configurado)

1. **Simular webhook**:

   ```powershell
   curl -X POST https://c4franquiaas.netlify.app/api/webhook/facilzap `
     -H "Content-Type: application/json" `
     -H "X-Facilzap-Signature: SEU_SECRET" `
     -d '{"event":"produto.excluido","data":{"id":"ID_TESTE","nome":"Produto Teste"}}'
   ```

2. **Verificar resposta**: Deve retornar `200 OK` com detalhes da exclusão

---

## 8. Resumo da Implementação

| Funcionalidade            | Status          | Localização                     |
| ------------------------- | --------------- | ------------------------------- |
| Detecção via Sync         | ✅ Implementado | `api/sync-produtos/route.ts`    |
| Detecção via Webhook      | ✅ Implementado | `api/webhook/facilzap/route.ts` |
| Soft Delete (desativação) | ✅ Implementado | Ambos arquivos                  |
| Desativa em franqueadas   | ✅ Implementado | Ambos arquivos                  |
| Desativa em revendedoras  | ✅ Implementado | Ambos arquivos                  |
| Logs de auditoria         | ✅ Implementado | `logs_sincronizacao`            |
| Filtro no admin           | ✅ Existente    | Filtro "Inativos"               |

---

## 9. Melhorias Futuras (Opcional)

### 9.1 Campo específico `removido_facilzap`

Se quiser diferenciar produtos desativados manualmente vs excluídos do FácilZap:

```sql
ALTER TABLE produtos ADD COLUMN removido_facilzap BOOLEAN DEFAULT FALSE;
ALTER TABLE produtos ADD COLUMN removido_facilzap_at TIMESTAMPTZ;
```

### 9.2 Filtro específico no admin

Adicionar filtro "Excluídos do FácilZap" para auditoria.

### 9.3 Notificação para admin

Enviar email/notificação quando produtos são excluídos automaticamente.

---

## 10. Configuração do Webhook na FácilZap

Se a FácilZap suporta webhooks, configure:

**URL**: `https://c4franquiaas.netlify.app/api/webhook/facilzap`
**Método**: POST
**Headers**:

- `Content-Type: application/json`
- `X-Facilzap-Signature: {seu_secret}` (ou via query param `?secret=`)

**Eventos a escutar**:

- `produto.criado`
- `produto.atualizado`
- `produto.excluido` ← Importante!
- `produto.estoque`
- `pedido.criado`
- `pedido.cancelado`

---

**Data**: 12 de Janeiro de 2026
**Última atualização**: Documentação criada após implementação
