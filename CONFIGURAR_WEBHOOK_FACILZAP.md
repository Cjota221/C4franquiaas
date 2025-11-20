# 🎯 Configuração do Webhook FácilZap (ERP Bidirecional)

## ✅ Sistema Agora é Bidirecional

### 🔄 **Fluxos de Sincronização:**

1. **FácilZap → Sistema (Webhook - PULL)**

   - Produto criado/atualizado no FácilZap → Sistema recebe via webhook
   - Estoque atualizado no FácilZap → Propaga para franquias/revendedoras

2. **Sistema → FácilZap (API - PUSH)**
   - Venda no balcão da franquia → Atualiza estoque no FácilZap
   - Venda na loja online → Atualiza estoque no FácilZap

---

## 📡 PASSO 1: Configurar Webhook no FácilZap

### URL do Webhook Unificado:

```
https://c4franquiaas.netlify.app/api/webhook/facilzap
```

### Eventos para Configurar:

- ✅ `produto_criado` ou `product.created`
- ✅ `produto_atualizado` ou `product.updated`
- ✅ `estoque_atualizado` ou `product.stock.updated`
- ✅ `pedido_criado` ou `order.created`

### Segurança (Secret):

O webhook suporta **DOIS** métodos de autenticação:

1. **Header:** `x-facilzap-signature`
2. **Header:** `x-webhook-secret`

Configure no Netlify:

```bash
FACILZAP_WEBHOOK_SECRET=seu_secret_forte_aqui_123
```

---

## 🔧 PASSO 2: Variáveis de Ambiente no Netlify

Acesse: https://app.netlify.com/sites/c4franquiaas/settings/deploys#environment

### Variáveis Necessárias:

```env
# Token da FácilZap (já configurado)
FACILZAP_TOKEN=eyJhbGciOi...

# Secret do Webhook (NOVO - você define)
FACILZAP_WEBHOOK_SECRET=minhasenhasegura2025
```

---

## 🧪 PASSO 3: Testar Webhook

### Teste Manual (GET):

Acesse no navegador:

```
https://c4franquiaas.netlify.app/api/webhook/facilzap
```

Deve retornar:

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

### Teste Via FácilZap:

1. Acesse painel do FácilZap
2. Configure o webhook com a URL acima
3. Use o botão **"Testar Webhook"**
4. Verifique logs no Netlify ou Supabase

---

## 📊 PASSO 4: Monitorar Logs

### Supabase - Tabela de Logs:

```sql
-- Últimos eventos recebidos via webhook
SELECT
  created_at,
  tipo,
  mensagem,
  detalhes
FROM logs_sincronizacao
WHERE tipo ILIKE '%webhook%'
ORDER BY created_at DESC
LIMIT 20;

-- Contar eventos por tipo
SELECT
  tipo,
  COUNT(*) as total,
  MAX(created_at) as ultimo_evento
FROM logs_sincronizacao
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY tipo
ORDER BY total DESC;
```

### Netlify Functions Log:

```
https://app.netlify.com/sites/c4franquiaas/logs/functions
```

---

## 🚀 PASSO 5: Usar Função Push (Sistema → FácilZap)

### Exemplo: Atualizar Estoque Após Venda

```typescript
import { updateEstoqueFacilZap } from '@/lib/facilzapClient';

// Em qualquer endpoint de venda (admin/franqueada/revendedora):
async function processarVenda(produtoId: string, quantidade: number) {
  // 1. Baixar estoque local
  await supabase
    .from('produtos')
    .update({ estoque: supabase.raw('estoque - ?', [quantidade]) })
    .eq('id', produtoId);

  // 2. Buscar ID FácilZap
  const { data: produto } = await supabase
    .from('produtos')
    .select('facilzap_id, estoque')
    .eq('id', produtoId)
    .single();

  // 3. Atualizar no FácilZap (PUSH)
  if (produto?.facilzap_id) {
    const sucesso = await updateEstoqueFacilZap(
      produto.facilzap_id,
      produto.estoque, // Novo estoque após venda
    );

    if (sucesso) {
      console.log('✅ Estoque sincronizado com FácilZap');
    } else {
      console.error('❌ Falha ao sincronizar com FácilZap');
    }
  }
}
```

### Exemplo: Atualização em Lote

```typescript
import { updateEstoquesFacilZapBatch } from '@/lib/facilzapClient';

// Após múltiplas vendas:
const updates = [
  { facilzapId: '123', novoEstoque: 5 },
  { facilzapId: '456', novoEstoque: 0 },
  { facilzapId: '789', novoEstoque: 12 },
];

const resultados = await updateEstoquesFacilZapBatch(updates);

console.log(`✅ ${resultados.filter((r) => r.success).length}/${updates.length} sincronizados`);
```

---

## 🔍 Funcionalidades do Webhook Unificado

### ✅ Segurança:

- Valida assinatura via `x-facilzap-signature` **OU** `x-webhook-secret`
- Rejeita requisições sem autenticação válida

### ✅ Normalização:

- `normalizeEstoque()`: Aceita number, string, ou `{quantidade: X}`
- `extractFacilZapId()`: Busca ID em `id`, `facilzap_id`, `external_id`

### ✅ Gestão de Franquias:

- **Estoque = 0** → Desativa produto nas tabelas:
  - `produtos_franqueadas_precos` (ativo = false)
  - `reseller_products` (is_active = false)
- **Estoque > 0** → Reativa automaticamente

### ✅ Suporte Multi-idioma:

- Aceita eventos em **Português**: `produto_criado`, `estoque_atualizado`
- Aceita eventos em **Inglês**: `product.created`, `product.stock.updated`

### ✅ Logs Completos:

- Cada evento gera registro em `logs_sincronizacao`
- Detalhes incluem: evento, produto ID, estoque anterior → novo

---

## 🎯 Próximos Passos (ERP Completo)

### 1. ✅ Implementar `handleNovoPedido()` (TODO atual):

```typescript
// Quando receber evento pedido_criado/order.created:
- Criar cliente (se não existir)
- Inserir em tabela vendas
- Baixar estoque local
- Vincular à franqueada/revendedora
- Enviar notificação
- Gerar NF-e (se configurado)
```

### 2. ✅ Adicionar Chamadas Push em Endpoints de Venda:

- `app/api/admin/vendas/route.ts`
- `app/api/franqueada/vendas/route.ts`
- `app/api/revendedora/vendas/route.ts`
- `app/api/loja/checkout/route.ts`

### 3. ✅ Reconciliação Periódica:

```typescript
// Job diário para garantir consistência:
- Comparar estoque Sistema vs FácilZap
- Corrigir divergências
- Alertar sobre inconsistências grandes
```

---

## 📞 Suporte

### Verificar Status do Webhook:

```bash
curl https://c4franquiaas.netlify.app/api/webhook/facilzap
```

### Testar Evento Manual (curl):

```bash
curl -X POST https://c4franquiaas.netlify.app/api/webhook/facilzap \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: minhasenhasegura2025" \
  -d '{
    "evento": "estoque_atualizado",
    "produto": {
      "id": "123",
      "nome": "Teste Produto",
      "estoque": 10
    }
  }'
```

---

## 🎉 Sistema Transformado em ERP!

Agora você tem:

- ✅ Sincronização automática a cada 1 minuto (scheduled function)
- ✅ Webhook bidirecional (FácilZap ↔ Sistema)
- ✅ Ativação/desativação automática baseada em estoque
- ✅ Suporte a múltiplos formatos de eventos
- ✅ Segurança robusta
- ✅ Logs completos para auditoria
- ✅ Funções push para atualizar FácilZap quando há vendas locais

**Próximo passo:** Configure a URL do webhook no painel da FácilZap! 🚀
