# ✅ Checklist para Ativar o ERP Bidirecional

## 🎯 Status Atual

### ✅ Implementado e Funcionando:
- [x] Scheduled function (sync a cada 1 minuto)
- [x] Webhook unificado (`/api/webhook/facilzap`)
- [x] Funções push (`updateEstoqueFacilZap`, `updateEstoquesFacilZapBatch`)
- [x] Retry com exponential backoff
- [x] Classificação inteligente de mudanças (new/updated/unchanged)
- [x] Ativação/desativação automática por estoque
- [x] Logs completos em `logs_sincronizacao`
- [x] Segurança dual (HMAC + secret)
- [x] Suporte multi-idioma (PT/EN)

### ⏳ Aguardando Configuração Externa:
- [ ] Configurar webhook no painel FácilZap
- [ ] Definir `FACILZAP_WEBHOOK_SECRET` no Netlify
- [ ] Testar webhook com botão "Test" do FácilZap
- [ ] Implementar push nos endpoints de venda

---

## 📋 Passo a Passo para Ativação

### 1️⃣ **Configurar Variável de Ambiente no Netlify** ⚙️

**Acesse:** https://app.netlify.com/sites/c4franquiaas/settings/deploys#environment

**Adicionar Nova Variável:**
```
Key: FACILZAP_WEBHOOK_SECRET
Value: [ESCOLHA_UMA_SENHA_FORTE_AQUI]
```

**Exemplo de senha forte:**
```
c4franquias_facilzap_2025_!@#$%
```

**Salvar e Redeploy:**
- Clique em "Save"
- Aguarde redeploy automático (~2 minutos)

---

### 2️⃣ **Configurar Webhook no Painel FácilZap** 🔗

**URL do Webhook:**
```
https://c4franquiaas.netlify.app/api/webhook/facilzap
```

**Método:** `POST`

**Headers a Configurar:**
```
Content-Type: application/json
x-webhook-secret: [MESMA_SENHA_CONFIGURADA_NO_NETLIFY]
```

**Eventos para Ativar:**
- ✅ `produto_criado` (ou `product.created`)
- ✅ `produto_atualizado` (ou `product.updated`)
- ✅ `estoque_atualizado` (ou `product.stock.updated`)
- ✅ `pedido_criado` (ou `order.created`)

---

### 3️⃣ **Testar Webhook** 🧪

#### A. Teste Manual (GET):
Acesse no navegador:
```
https://c4franquiaas.netlify.app/api/webhook/facilzap
```

**Resposta Esperada:**
```json
{
  "status": "ok",
  "webhook": "facilzap",
  "eventos_suportados": [
    "produto_criado",
    "produto_atualizado",
    "estoque_atualizado",
    "pedido_criado",
    "product.created",
    "product.updated",
    "product.stock.updated",
    "order.created"
  ]
}
```

#### B. Teste Via FácilZap:
1. No painel FácilZap, localize a seção de webhooks
2. Clique no botão **"Testar Webhook"** ou **"Send Test"**
3. Verifique os logs no Netlify

#### C. Verificar Logs no Netlify:
**Acesse:** https://app.netlify.com/sites/c4franquiaas/logs/functions

**Procure por:**
```
[facilzap] Webhook recebido: produto_criado
[facilzap] ✅ Produto upsert: ID 12345, estoque: 10
```

#### D. Verificar Logs no Supabase:
Execute no SQL Editor:
```sql
SELECT 
  created_at,
  tipo,
  mensagem,
  detalhes
FROM logs_sincronizacao
WHERE tipo ILIKE '%webhook%'
ORDER BY created_at DESC
LIMIT 10;
```

---

### 4️⃣ **Implementar Push nos Endpoints de Venda** 🔄

#### A. Identificar Endpoints que Fazem Vendas:

Busque por arquivos que BAIXAM ESTOQUE após venda:

```typescript
// Provavelmente em:
// - app/api/admin/vendas/route.ts
// - app/api/franqueada/vendas/route.ts (ou similar)
// - app/api/revendedora/vendas/route.ts (ou similar)
// - app/api/loja/checkout/route.ts
```

#### B. Adicionar Import:
```typescript
import { updateEstoqueFacilZap } from '@/lib/facilzapClient';
```

#### C. Adicionar APÓS Baixar Estoque Local:
```typescript
// ANTES (só baixava estoque local):
await supabase
  .from('produtos')
  .update({ estoque: supabase.raw('estoque - ?', [quantidade]) })
  .eq('id', produtoId);

// DEPOIS (baixa local E atualiza FácilZap):
const { data: produto } = await supabase
  .from('produtos')
  .select('facilzap_id, estoque')
  .eq('id', produtoId)
  .single();

await supabase
  .from('produtos')
  .update({ estoque: supabase.raw('estoque - ?', [quantidade]) })
  .eq('id', produtoId);

// 🔄 PUSH para FácilZap
if (produto?.facilzap_id) {
  const novoEstoque = produto.estoque - quantidade;
  const sucesso = await updateEstoqueFacilZap(produto.facilzap_id, novoEstoque);
  
  if (sucesso) {
    console.log(`✅ Estoque sincronizado com FácilZap: ${produto.facilzap_id} → ${novoEstoque}`);
  } else {
    console.error(`❌ Falha ao sincronizar com FácilZap: ${produto.facilzap_id}`);
    // Opcional: Adicionar em fila de retry
  }
}
```

#### D. Para Vendas com Múltiplos Produtos (Batch):
```typescript
import { updateEstoquesFacilZapBatch } from '@/lib/facilzapClient';

// Após baixar estoque de todos os itens do pedido:
const updates = [];

for (const item of itensDoPedido) {
  const { data: produto } = await supabase
    .from('produtos')
    .select('facilzap_id, estoque')
    .eq('id', item.produto_id)
    .single();
  
  if (produto?.facilzap_id) {
    updates.push({
      facilzapId: produto.facilzap_id,
      novoEstoque: produto.estoque - item.quantidade,
    });
  }
}

// Push em lote (100ms de delay entre requisições)
if (updates.length > 0) {
  const resultados = await updateEstoquesFacilZapBatch(updates);
  const sucessos = resultados.filter(r => r.success).length;
  console.log(`✅ ${sucessos}/${updates.length} estoques sincronizados com FácilZap`);
}
```

---

### 5️⃣ **Monitoramento Pós-Ativação** 📊

#### A. Verificar Scheduled Function (a cada 1 min):
**Logs Netlify:** https://app.netlify.com/sites/c4franquiaas/logs/functions

**Procure por:**
```
✅ Produtos sincronizados: 354
🆕 Novos: 0
✏️ Atualizados: 3
✅ Inalterados: 351
```

#### B. Verificar Webhooks Recebidos:
**SQL Supabase:**
```sql
-- Eventos das últimas 24 horas
SELECT 
  tipo,
  COUNT(*) as total,
  MAX(created_at) as ultimo_evento
FROM logs_sincronizacao
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY tipo
ORDER BY total DESC;
```

**Resultado Esperado:**
```
tipo                    | total | ultimo_evento
-----------------------|-------|------------------
scheduled_sync         | 1440  | 2025-06-15 23:59
webhook_estoque        | 45    | 2025-06-15 18:30
webhook_produto        | 12    | 2025-06-15 14:22
push_estoque          | 8     | 2025-06-15 20:15
```

#### C. Verificar Produtos com Estoque = 0 (Desativados):
```sql
-- Produtos zerados devem estar desativados nas franquias
SELECT 
  p.nome,
  p.estoque,
  COUNT(DISTINCT pfp.franqueada_id) as franquias_ativas,
  COUNT(DISTINCT rp.reseller_id) as revendedoras_ativas
FROM produtos p
LEFT JOIN produtos_franqueadas_precos pfp 
  ON pfp.produto_id = p.id AND pfp.ativo = true
LEFT JOIN reseller_products rp 
  ON rp.product_id = p.id AND rp.is_active = true
WHERE p.estoque = 0
GROUP BY p.id, p.nome, p.estoque
HAVING COUNT(DISTINCT pfp.franqueada_id) > 0 
    OR COUNT(DISTINCT rp.reseller_id) > 0;
```

**Resultado Esperado:** `0 rows` (nenhum produto zerado ativo)

#### D. Testar Ciclo Completo:

1. **No FácilZap:** Altere estoque de produto X de 10 → 8
2. **Aguarde:** Até 1 minuto (scheduled) ou instantâneo (webhook)
3. **Verifique Sistema:** 
   ```sql
   SELECT estoque FROM produtos WHERE facilzap_id = 'X';
   -- Deve retornar: 8
   ```

4. **No Sistema:** Faça venda de 2 unidades do produto X
5. **Verifique FácilZap:** Estoque deve estar em 6

---

### 6️⃣ **Troubleshooting** 🔧

#### Problema: Webhook não recebe eventos
**Soluções:**
1. Verifique se `FACILZAP_WEBHOOK_SECRET` está configurado no Netlify
2. Teste GET na URL do webhook (deve retornar status ok)
3. Verifique se eventos estão habilitados no painel FácilZap
4. Confira logs de erro no Netlify Functions

#### Problema: Push não atualiza FácilZap
**Soluções:**
1. Verifique se `FACILZAP_TOKEN` está válido
2. Confira logs: procure por `❌ Falha ao sincronizar com FácilZap`
3. Teste token manualmente:
   ```bash
   curl -H "Authorization: Bearer SEU_TOKEN" \
        https://api.facilzap.app.br/produtos
   ```
4. Verifique se `facilzap_id` está preenchido nos produtos

#### Problema: Scheduled function retorna 0 produtos
**Soluções:**
1. Verifique token: `echo $FACILZAP_TOKEN` (primeiros 20 chars)
2. Execute teste direto:
   ```bash
   node test-facilzap-direct.mjs
   ```
3. Confira logs detalhados no Netlify
4. Verifique permissões do token no painel FácilZap

#### Problema: Produtos não desativam quando estoque = 0
**Soluções:**
1. Verifique função `desativarProdutoNasFranquias()` no webhook
2. Execute manualmente:
   ```sql
   UPDATE produtos_franqueadas_precos 
   SET ativo = false 
   WHERE produto_id IN (
     SELECT id FROM produtos WHERE estoque = 0
   );
   ```

---

## 🎉 Sistema 100% Operacional!

Quando completar todos os passos acima, você terá:

- ✅ Sincronização automática a cada 1 minuto
- ✅ Webhook em tempo real
- ✅ Push bidirecional (Sistema → FácilZap)
- ✅ Ativação/desativação automática
- ✅ Logs completos
- ✅ Retry inteligente
- ✅ 4 canais sincronizados (Admin, Franquias, Revendedoras, Loja)

**Seu ERP está pronto para uso! 🚀**

---

## 📞 Suporte

Se precisar de ajuda, consulte:
- 📖 `ERP_BIDIRECIONAL_COMPLETO.md` - Arquitetura detalhada
- 📖 `CONFIGURAR_WEBHOOK_FACILZAP.md` - Guia de configuração
- 📊 Logs Netlify: https://app.netlify.com/sites/c4franquiaas/logs
- 📊 SQL Editor Supabase: Execute queries de monitoramento
