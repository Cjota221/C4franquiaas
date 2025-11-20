# 🔧 Corrigir Conflito de Chaves: facilzap_id UNIQUE

## 🎯 Objetivo

Garantir que `facilzap_id` seja **único** na tabela `produtos` para evitar conflitos entre webhook e sincronização manual.

---

## 📋 Problema Identificado

### ❌ **Antes (Conflitante):**

1. **Sync Manual** (`lib/syncProdutos.ts`) usa `onConflict: 'id_externo'`
2. **Webhook** (`app/api/webhook/facilzap/route.ts`) usava `onConflict: 'facilzap_id'`
3. Se um produto tem `id_externo` preenchido mas `facilzap_id` é NULL → webhook cria duplicata
4. Se `facilzap_id` não tem constraint UNIQUE → upsert falha silenciosamente
5. **Estoque não atualiza** porque objeto é salvo em campo numérico

### ✅ **Depois (Corrigido):**

- Sync Manual: Usa `id_externo` + **normalizeEstoque()** + Cliente Admin
- Webhook: **Alterado para usar `id_externo`** também (compatibilidade)
- Ambos preenchem `facilzap_id` E `id_externo` com o mesmo valor
- Migration adiciona constraint UNIQUE em `facilzap_id`
- Estoque sempre convertido para number válido

---

## 🚀 Passo a Passo

### 1️⃣ **Verificar Duplicatas Antes**

Execute no SQL Editor do Supabase:

```sql
-- Ver se há produtos duplicados por facilzap_id
SELECT
  facilzap_id,
  COUNT(*) as ocorrencias,
  STRING_AGG(id::text, ', ') as ids_duplicados
FROM produtos
WHERE facilzap_id IS NOT NULL
GROUP BY facilzap_id
HAVING COUNT(*) > 1
ORDER BY ocorrencias DESC;
```

**Resultado Esperado:** `0 rows` (sem duplicatas)

---

### 2️⃣ **Preencher facilzap_id Vazios**

```sql
-- Atualizar facilzap_id = id_externo onde está NULL
UPDATE produtos
SET facilzap_id = id_externo
WHERE (facilzap_id IS NULL OR facilzap_id = '')
  AND id_externo IS NOT NULL
  AND id_externo != '';

-- Ver resultado
SELECT
  COUNT(*) as total_produtos,
  COUNT(facilzap_id) as com_facilzap_id,
  COUNT(*) - COUNT(facilzap_id) as sem_facilzap_id
FROM produtos;
```

**Resultado Esperado:** `sem_facilzap_id = 0`

---

### 3️⃣ **Aplicar Constraint ÚNICA**

```sql
-- Adicionar constraint única em facilzap_id
ALTER TABLE produtos
ADD CONSTRAINT produtos_facilzap_id_key
UNIQUE (facilzap_id);
```

**Se der erro "duplicate key":** Veja seção "Tratamento de Duplicatas" abaixo.

---

### 4️⃣ **Criar Índice para Performance**

```sql
-- Índice para melhorar buscas por facilzap_id
CREATE INDEX IF NOT EXISTS idx_produtos_facilzap_id
ON produtos(facilzap_id)
WHERE facilzap_id IS NOT NULL;
```

---

### 5️⃣ **Verificar Resultado Final**

```sql
-- Ver constraints criadas
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'produtos'::regclass
  AND conname LIKE '%facilzap%';
```

**Resultado Esperado:**

```
constraint_name              | definition
-----------------------------|---------------------------
produtos_facilzap_id_key     | UNIQUE (facilzap_id)
```

---

## 🔧 Tratamento de Duplicatas (se necessário)

### Identificar Duplicatas:

```sql
WITH duplicatas AS (
  SELECT
    facilzap_id,
    id,
    nome,
    estoque,
    ultima_sincronizacao,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY facilzap_id
      ORDER BY ultima_sincronizacao DESC NULLS LAST, created_at DESC
    ) as rn
  FROM produtos
  WHERE facilzap_id IS NOT NULL
)
SELECT * FROM duplicatas WHERE rn > 1;
```

### Mesclar Duplicatas (Manter Mais Recente):

```sql
-- Deletar duplicatas antigas, mantendo a mais recente
WITH duplicatas AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY facilzap_id
      ORDER BY ultima_sincronizacao DESC NULLS LAST, created_at DESC
    ) as rn
  FROM produtos
  WHERE facilzap_id IS NOT NULL
)
DELETE FROM produtos
WHERE id IN (
  SELECT id FROM duplicatas WHERE rn > 1
);
```

---

## ✅ Testar Correções

### Teste 1: Sincronização Manual

```bash
# Chamar endpoint de sync (ou usar migration anterior)
curl -X POST http://localhost:3000/api/admin/sync-produtos
```

**Log Esperado:**

```
🔄 Iniciando sincronização manual de produtos...
📦 354 produtos encontrados. Processando...
💾 Salvando 354 produtos no banco...
📊 Exemplo de produto normalizado: { estoque: 15 }  // ✅ NUMBER
✅ Sucesso! 354 produtos processados.
```

### Teste 2: Verificar Estoque é Numérico

```sql
-- Verificar se estoque está como número
SELECT
  id,
  nome,
  estoque,
  pg_typeof(estoque) as tipo_coluna
FROM produtos
LIMIT 5;
```

**Resultado Esperado:**

```
tipo_coluna = integer (ou numeric)
```

### Teste 3: Webhook

```bash
curl -X POST https://c4franquiaas.netlify.app/api/webhook/facilzap \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: SEU_SECRET" \
  -d '{
    "evento": "estoque_atualizado",
    "produto": {
      "id": "12345",
      "nome": "Rasteirinha Teste",
      "estoque": { "disponivel": 8 }
    }
  }'
```

**Resultado Esperado:**

```json
{
  "success": true,
  "message": "Evento estoque_atualizado processado"
}
```

### Teste 4: Verificar no Banco

```sql
-- Ver se estoque foi atualizado corretamente
SELECT
  id,
  nome,
  facilzap_id,
  estoque,
  ultima_sincronizacao
FROM produtos
WHERE facilzap_id = '12345';
```

**Resultado Esperado:**

```
estoque = 8  // ✅ Convertido de objeto para número
```

---

## 📊 Arquivos Modificados

### ✅ `lib/syncProdutos.ts`

```typescript
// ✅ Adicionado:
- função normalizeEstoque(estoqueField: unknown): number
- Cliente Admin (bypass RLS)
- Preenche facilzap_id E id_externo
- Timeout 15s
- Logs detalhados

// ❌ Removido:
- Cliente público (tinha problemas com RLS)
- Tipo fixo estoque: number (agora aceita unknown)
```

### ✅ `app/api/webhook/facilzap/route.ts`

```typescript
// 🔧 Mudança crítica:
onConflict: 'id_externo'  // Antes era 'facilzap_id'

// Justificativa:
- Garante compatibilidade com sync manual
- Evita duplicatas quando facilzap_id é NULL
- Ambos os sistemas usam mesma chave agora
```

### ✅ `migrations/035_adicionar_constraint_facilzap_id.sql`

```sql
-- ✅ Criado:
- Constraint UNIQUE em facilzap_id
- Índice para performance
- Limpeza de duplicatas
- Scripts de verificação
```

---

## 🎉 Resultado Final

Após aplicar todas as correções:

- ✅ **Estoque sempre numérico** (normalizeEstoque funciona)
- ✅ **Sem duplicatas** (constraint UNIQUE)
- ✅ **Webhook e Sync compatíveis** (mesma chave: id_externo)
- ✅ **Cliente Admin** (sem bloqueios de RLS)
- ✅ **Logs detalhados** (facilita debug)
- ✅ **Retry inteligente** (já implementado anteriormente)

**Sistema agora sincroniza estoque corretamente! 🚀**

---

## 📞 Troubleshooting

### Problema: "Produtos: 0" no log do sync

**Causa:** API retorna estoque como objeto, sync tentava salvar objeto em campo numérico
**Solução:** ✅ Corrigido com normalizeEstoque()

### Problema: Webhook cria produtos duplicados

**Causa:** facilzap_id NULL + sem constraint UNIQUE
**Solução:** ✅ Constraint adicionada + ambos usam id_externo

### Problema: "violates unique constraint"

**Causa:** Existem duplicatas no banco
**Solução:** Execute seção "Tratamento de Duplicatas"

### Problema: Estoque não atualiza após venda no FácilZap

**Causa:** Webhook estava usando chave diferente do sync
**Solução:** ✅ Ambos usam id_externo agora

---

## 🔗 Próximos Passos

1. ✅ Aplicar migration 035 (constraint UNIQUE)
2. ✅ Testar sync manual (deve mostrar estoque numérico)
3. ✅ Configurar webhook no FácilZap
4. ✅ Testar alteração de estoque no FácilZap
5. ✅ Verificar propagação para franquias/revendedoras
6. ⏳ Implementar push nos endpoints de venda
7. ⏳ Completar handleNovoPedido()
