# 🔍 PONTOS CEGOS CRÍTICOS - SINCRONIZAÇÃO E EXCLUSÃO

## 🎯 PROBLEMA PRINCIPAL: Produtos excluídos voltam "do além"

### 📊 DIAGNÓSTICO COMPLETO

Foram identificados **7 pontos cegos** que explicam porque produtos excluídos reaparecem:

---

## 🚨 **PONTO CEGO #1: UPSERT re-cria produtos excluídos**

**Arquivo:** `app/api/sync-produtos/route.ts` linha 233

**Código atual:**

```typescript
const { error } = await supabase.from('produtos').upsert(productsToUpsert, {
  onConflict: 'id_externo', // ⚠️ RE-CRIA produto se ele existir no FácilZap!
});
```

**O que acontece:**

1. Admin exclui produto X do painel
2. Produto é deletado do banco
3. `id_externo` vai para tabela `produtos_excluidos`
4. **MAS produto ainda existe no FácilZap**
5. Sync roda (a cada 1-2 min)
6. UPSERT vê que id_externo não existe no banco
7. **CRIA novo registro** porque produto existe no FácilZap
8. Produto "ressuscita"

**Causa raiz:** UPSERT não verifica `produtos_excluidos` antes de inserir.

---

## 🚨 **PONTO CEGO #2: Webhook TAMBÉM re-cria produtos**

**Arquivo:** `app/api/webhook/facilzap/route.ts` linha 96-102

**Código atual:**

```typescript
const { data: produto, error } = await supabaseAdmin.from('produtos').upsert(updateData, {
  onConflict: 'id_externo',
  ignoreDuplicates: false, // ⚠️ Cria se não existir!
});
```

**Cenário:**

1. Admin exclui produto às 10:00
2. Produto deletado do banco
3. FácilZap envia webhook de estoque às 10:01
4. **Webhook faz UPSERT e RE-CRIA o produto**
5. Produto volta

**Causa raiz:** Webhook não verifica `produtos_excluidos`.

---

## 🚨 **PONTO CEGO #3: Cron-estoque "reanima" produtos**

**Arquivo:** `app/api/cron-estoque/route.ts` linha 138-142

**Código atual:**

```typescript
await supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', prod.id); // ⚠️ Não verifica se foi excluído
```

**Problema:**

- Busca produtos do banco: `SELECT * FROM produtos`
- Atualiza estoque de TODOS incluindo excluídos manualmente
- Se produto foi "ressuscitado" por sync/webhook, cron mantém vivo

**Causa raiz:** Não filtra produtos em `produtos_excluidos`.

---

## 🚨 **PONTO CEGO #4: Ordem de execução errada**

**Arquivo:** `app/api/sync-produtos/route.ts`

**Ordem ATUAL (ERRADA):**

```
Linha 233: UPSERT todos os produtos
Linha 275: Detectar produtos excluídos
```

**Ordem CORRETA deveria ser:**

```
1. Buscar lista de produtos_excluidos ANTES
2. Filtrar produtos que NÃO devem ser sincronizados
3. UPSERT apenas produtos permitidos
4. Detectar novos produtos excluídos do FácilZap
```

**Causa raiz:** Verificação acontece DEPOIS do UPSERT.

---

## 🚨 **PONTO CEGO #5: Verificação existe MAS é ineficaz**

**Arquivo:** `app/api/sync-produtos/route.ts` linha 138-151

**Código atual:**

```typescript
// 🚫 VERIFICAR PRODUTOS EXCLUÍDOS (dentro do loop de batches!)
const { data: produtosExcluidos } = await supabase
  .from('produtos_excluidos')
  .select('id_externo')
  .in('id_externo', idsExternos); // ⚠️ Verifica apenas este batch!

const batchFiltrado = batch.filter((p) => !idsExcluidos.has(p.id_externo || ''));
```

**Problema:**

- Verificação acontece **dentro do loop de batches** (50 produtos por vez)
- Se sync tem 200 produtos = 4 batches
- Cada batch verifica sua própria lista
- **MAS** se produto foi excluído DURANTE a execução do sync?
- Batches seguintes não detectam

**Causa raiz:** Verificação é granular demais (por batch).

---

## 🚨 **PONTO CEGO #6: Webhook NÃO verifica produtos_excluidos**

**Arquivo:** `app/api/webhook/facilzap/route.ts` linha 50-130

**Código NÃO TEM:**

```typescript
// ❌ MISSING: Verificar se produto está em produtos_excluidos
// const { data: excluido } = await supabase
//   .from('produtos_excluidos')
//   .select('id_externo')
//   .eq('id_externo', facilzapId)
//   .maybeSingle();
//
// if (excluido) {
//   console.log('Produto foi excluído pelo admin - ignorando webhook');
//   return;
// }
```

**Impacto:**

- Webhook recebe evento do FácilZap
- Cria/atualiza produto sem verificar
- Ignora vontade do admin

---

## 🚨 **PONTO CEGO #7: Cron-estoque NÃO verifica produtos_excluidos**

**Arquivo:** `app/api/cron-estoque/route.ts` linha 30-50

**Código atual:**

```typescript
const { data: produtos } = await supabase.from('produtos').select('id, id_externo, estoque');
// ❌ MISSING: .not('id_externo', 'in', produtos_excluidos)
```

**Impacto:**

- Busca TODOS os produtos do banco
- Inclui produtos que foram "ressuscitados"
- Atualiza estoque mantendo-os vivos

---

## ✅ SOLUÇÃO DEFINITIVA

### 1. **Criar helper function reutilizável**

```typescript
// lib/produtos-excluidos.ts
export async function isProdutoExcluido(
  supabase: SupabaseClient,
  id_externo: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('produtos_excluidos')
    .select('id_externo')
    .eq('id_externo', id_externo)
    .maybeSingle();

  return !!data;
}

export async function filtrarProdutosExcluidos<T extends { id_externo?: string | null }>(
  supabase: SupabaseClient,
  produtos: T[],
): Promise<T[]> {
  const idsExternos = produtos.map((p) => p.id_externo).filter((id): id is string => !!id);

  if (idsExternos.length === 0) return produtos;

  const { data: excluidos } = await supabase
    .from('produtos_excluidos')
    .select('id_externo')
    .in('id_externo', idsExternos);

  const idsExcluidos = new Set((excluidos || []).map((e: { id_externo: string }) => e.id_externo));

  const filtrados = produtos.filter((p) => !p.id_externo || !idsExcluidos.has(p.id_externo));

  const totalIgnorados = produtos.length - filtrados.length;
  if (totalIgnorados > 0) {
    console.log(`🚫 Ignorando ${totalIgnorados} produtos excluídos pelo admin`);
  }

  return filtrados;
}
```

### 2. **Usar em TODOS os lugares**

**sync-produtos:**

```typescript
// ANTES do loop de batches:
produtos = await filtrarProdutosExcluidos(supabase, produtos);
```

**webhook/facilzap:**

```typescript
// ANTES do upsert:
if (await isProdutoExcluido(supabaseAdmin, facilzapId)) {
  console.log(`🚫 Produto ${facilzapId} foi excluído pelo admin - ignorando webhook`);
  return { message: 'Produto excluído - webhook ignorado' };
}
```

**cron-estoque:**

```typescript
// DEPOIS de buscar produtos:
produtos = await filtrarProdutosExcluidos(supabase, produtos);
```

---

## 🔄 FLUXO CORRETO

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin exclui produto X do painel                         │
│    ├─ DELETE FROM produtos WHERE id = 'X'                   │
│    └─ INSERT INTO produtos_excluidos (id_externo='123')     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Sync roda (a cada 1-2 min)                               │
│    ├─ Busca produtos do FácilZap                            │
│    ├─ ✅ FILTRA produtos em produtos_excluidos ANTES        │
│    ├─ Remove produto X da lista                             │
│    └─ UPSERT apenas produtos NÃO excluídos                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Webhook chega do FácilZap                                │
│    ├─ FácilZap envia evento de produto X                    │
│    ├─ ✅ VERIFICA se X está em produtos_excluidos          │
│    ├─ SIM? IGNORA webhook                                   │
│    └─ Log: "Produto excluído - webhook ignorado"            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Cron-estoque roda (a cada 2 min)                         │
│    ├─ Busca produtos do banco                               │
│    ├─ ✅ FILTRA produtos em produtos_excluidos             │
│    ├─ Produto X não está na lista                           │
│    └─ Atualiza apenas produtos permitidos                   │
└─────────────────────────────────────────────────────────────┘
```

**Resultado:** Produto X **NUNCA VOLTA**

---

## 📊 IMPACTO ESPERADO

| Cenário                      | Antes               | Depois               |
| ---------------------------- | ------------------- | -------------------- |
| Admin exclui → sync roda     | ❌ Produto volta    | ✅ Produto NÃO volta |
| Admin exclui → webhook chega | ❌ Produto volta    | ✅ Webhook ignorado  |
| Admin exclui → cron roda     | ❌ Atualiza produto | ✅ Produto ignorado  |
| Produto excluído no FácilZap | ✅ Detecta          | ✅ Detecta           |

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Criar `lib/produtos-excluidos.ts` com helpers
2. ✅ Atualizar `app/api/sync-produtos/route.ts`
3. ✅ Atualizar `app/api/webhook/facilzap/route.ts`
4. ✅ Atualizar `app/api/cron-estoque/route.ts`
5. ✅ Testar cenário completo
6. ✅ Monitorar logs

---

## 🧪 TESTE DE VALIDAÇÃO

```sql
-- 1. Marcar produto como excluído
INSERT INTO produtos_excluidos (id_externo, excluido_por)
VALUES ('12345', 'teste');

-- 2. Forçar sync manualmente
-- Acessar: /api/sync-produtos

-- 3. Verificar se produto NÃO foi inserido
SELECT * FROM produtos WHERE id_externo = '12345';
-- Esperado: 0 rows

-- 4. Simular webhook (via Postman/curl)
POST /api/webhook/facilzap
{
  "evento": "produto.estoque_alterado",
  "dados": { "id": "12345", "estoque": 50 }
}
-- Esperado: Log "Produto excluído - webhook ignorado"

-- 5. Verificar novamente
SELECT * FROM produtos WHERE id_externo = '12345';
-- Esperado: 0 rows ✅
```

---

## ⚠️ HIPÓTESES ADICIONAIS (Investigar se problema persistir)

Se após implementar a solução o problema continuar:

### Hipótese #8: Cache no cliente

- Zustand/React Query podem estar fazendo cache
- Frontend não recarrega lista após exclusão
- **Verificar:** DevTools → Application → Storage

### Hipótese #9: Múltiplas instâncias rodando

- Vercel serverless pode ter várias instâncias
- Cada uma com seu próprio estado de sync
- **Verificar:** Logs de deployment

### Hipótese #10: Trigger do banco reativando

- Algum trigger SQL pode estar re-inserindo
- Verificar migration 061 (trigger_sincronizar_estoque_variacoes)
- **Verificar:** `\d+ produtos` no SQL Editor

---

**PRIORIDADE:** 🔴 CRÍTICA - Implementar helpers imediatamente
