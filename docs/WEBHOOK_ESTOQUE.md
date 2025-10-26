# Sistema de Sincronização de Estoque em Tempo Real

## 📋 Visão Geral

Este documento descreve o sistema de sincronização **bidirecional** de estoque entre:

```
FácilZap (Fonte) → C4 Admin → E-commerce Franqueada
```

### Fluxo de Dados

1. **FácilZap** (gerenciamento de estoque) envia webhook quando estoque muda
2. **C4 Admin** recebe, processa e cria notificações em tempo real
3. **E-commerce Franqueada** recebe atualização automática via webhook

---

## 🔄 Componentes do Sistema

### 1. Tabela de Notificações

**Arquivo:** `migrations/016_add_estoque_notifications.sql`

Armazena todas as mudanças de estoque para exibir alertas no painel admin.

**Campos principais:**
- `produto_nome`: Nome do produto
- `variacao_nome`: Tamanho/cor (ex: "35", "Preto")
- `estoque_anterior`: Quantidade antes
- `estoque_atual`: Quantidade depois
- `diferenca`: Calculado automaticamente (+ ou -)
- `visualizada`: Se admin já viu a notificação

### 2. Endpoint de Webhook FácilZap

**Arquivo:** `app/api/webhooks/facilzap-estoque/route.ts`

**URL:** `https://c4franquiaas.netlify.app/api/webhooks/facilzap-estoque`

**Eventos aceitos:**
- `product.stock.updated` - Estoque foi alterado
- `product.updated` - Produto foi atualizado
- `product.created` - Novo produto criado

**Fluxo:**
1. Recebe payload do webhook
2. Busca produto no banco pelo `id_externo`
3. Compara estoque anterior vs atual
4. Cria notificações para cada mudança
5. Atualiza produto no C4 Admin
6. Dispara webhook para franqueadas (opcional)

### 3. Componente de Notificações

**Arquivo:** `components/EstoqueNotifications.tsx`

**Funcionalidades:**
- 🔴 Aparece automaticamente no canto superior direito
- ⚡ Atualização em tempo real via Supabase Realtime
- 📊 Mostra até 10 notificações mais recentes
- ✅ Permite marcar como visualizada (uma ou todas)
- 🎨 Ícones diferentes para entrada (+) e saída (-)

**Exemplo de notificação:**
```
🔻 Rasteirinha Suzan Preta
    Tamanho: 35 (FZ3361408.2)
    -2 unidades
    3 → 1
    25/10 14:32
```

### 4. Serviço de Sincronização em Cascata

**Arquivo:** `lib/cascadeSync.ts`

**Funções principais:**

#### `syncProdutoEmCascata()`
Atualiza C4 Admin e dispara webhooks para franqueadas.

#### `dispararWebhookFranqueadas()`
Envia notificação para todos os e-commerce das franqueadas configurados.

**Payload enviado:**
```json
{
  "event": "product.stock.updated",
  "data": {
    "id_externo": "3361408",
    "nome": "Rasteirinha Suzan Preta",
    "estoque": 6,
    "variacoes_meta": [
      {
        "id": "850311",
        "nome": "35",
        "sku": "FZ3361408.2",
        "estoque": 3
      }
    ],
    "imagem": "https://..."
  },
  "timestamp": "2025-10-25T14:30:00Z"
}
```

### 5. Endpoint para Franqueadas

**Arquivo:** `app/api/webhooks/franqueada-estoque/route.ts`

**URL:** `https://franqueada.com.br/api/webhooks/franqueada-estoque`

**Integrações suportadas:**
- ✅ **WooCommerce** (implementado)
- ⏳ **Shopify** (a implementar)
- ⏳ **Custom** (a implementar)

**Segurança:**
- Header `X-Webhook-Secret` para autenticação
- Validação de payload

---

## ⚙️ Configuração

### 1. Aplicar Migration no Supabase

```bash
# Via CLI do Supabase
supabase db push

# Ou execute manualmente no SQL Editor:
# Copiar conteúdo de migrations/016_add_estoque_notifications.sql
```

### 2. Configurar Webhook na FácilZap

**Acesse:** Painel FácilZap → Configurações → Webhooks

**Dados para configurar:**

| Campo | Valor |
|-------|-------|
| URL | `https://c4franquiaas.netlify.app/api/webhooks/facilzap-estoque` |
| Eventos | ✅ `product.stock.updated`<br>✅ `product.updated` |
| Método | `POST` |
| Content-Type | `application/json` |

**Teste de conexão:**
```bash
curl https://c4franquiaas.netlify.app/api/webhooks/facilzap-estoque
```

Resposta esperada:
```json
{
  "status": "active",
  "endpoint": "/api/webhooks/facilzap-estoque",
  "events": ["product.stock.updated", "product.updated", "product.created"]
}
```

### 3. Configurar Webhook para Franqueadas

**No arquivo `.env.local`:**

```bash
# Secret key para autenticação de webhooks
FRANQUEADA_WEBHOOK_SECRET=sua_chave_secreta_aqui

# Configuração WooCommerce (se usar)
WOOCOMMERCE_API_URL=https://franqueada.com.br
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxx
```

### 4. Ativar Realtime no Supabase

**Acesse:** Supabase Dashboard → Database → Replication

**Habilite realtime para:**
- ✅ Tabela `estoque_notifications`

**SQL para habilitar:**
```sql
ALTER PUBLICATION supabase_realtime 
ADD TABLE estoque_notifications;
```

---

## 🧪 Testes

### Teste 1: Webhook FácilZap → C4 Admin

```bash
curl -X POST https://c4franquiaas.netlify.app/api/webhooks/facilzap-estoque \
  -H "Content-Type: application/json" \
  -d '{
    "event": "product.stock.updated",
    "data": {
      "id": "3361408",
      "nome": "Rasteirinha Suzan Preta",
      "estoque": 5,
      "variacoes": [
        {
          "id": "850311",
          "nome": "35",
          "sku": "FZ3361408.2",
          "estoque": 2
        }
      ]
    },
    "timestamp": "2025-10-25T14:30:00Z"
  }'
```

**Resultado esperado:**
- ✅ Produto atualizado no banco
- ✅ Notificação criada
- ✅ Aparece alerta no painel admin

### Teste 2: Notificação em Tempo Real

1. Abra o painel admin: `https://c4franquiaas.netlify.app/admin/dashboard`
2. Execute o teste 1 acima
3. **Verifique:** Alerta deve aparecer automaticamente no canto superior direito

### Teste 3: Marcar Notificação como Visualizada

1. Clique no **X** de uma notificação específica
2. **Verifique:** Notificação desaparece
3. **Banco:** Campo `visualizada` = `true`

### Teste 4: C4 Admin → Franqueada

```bash
# Simular disparo para franqueada
curl -X POST https://franqueada.com.br/api/webhooks/franqueada-estoque \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: sua_chave_secreta" \
  -d '{
    "event": "product.stock.updated",
    "data": {
      "id_externo": "3361408",
      "nome": "Rasteirinha Suzan Preta",
      "estoque": 5,
      "variacoes_meta": [...]
    }
  }'
```

---

## 📊 Monitoramento

### Ver Notificações no Banco

```sql
SELECT 
  produto_nome,
  variacao_nome,
  estoque_anterior,
  estoque_atual,
  diferenca,
  created_at,
  visualizada
FROM estoque_notifications
ORDER BY created_at DESC
LIMIT 20;
```

### Ver Produtos com Estoque Atualizado Recentemente

```sql
SELECT 
  nome,
  estoque,
  updated_at
FROM produtos
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
```

### Limpar Notificações Antigas

```sql
-- Marcar notificações de +7 dias como visualizadas
SELECT auto_mark_old_notifications_as_read();
```

---

## 🚀 Deploy

### Netlify (C4 Admin)

O webhook já está configurado e será deployado automaticamente com o push para `main`.

**Verificar após deploy:**
```bash
curl https://c4franquiaas.netlify.app/api/webhooks/facilzap-estoque
```

### Franqueadas (E-commerce)

Cada franqueada deve:
1. Adicionar arquivo `api/webhooks/franqueada-estoque/route.ts` ao projeto
2. Configurar variáveis de ambiente (WooCommerce/Shopify)
3. Fazer deploy
4. Informar URL do webhook para C4 Admin

---

## ⚠️ Troubleshooting

### Notificações não aparecem

**Verificar:**
1. Realtime habilitado no Supabase
2. Tabela `estoque_notifications` existe
3. Console do navegador (F12) não mostra erros

**Solução:**
```sql
-- Verificar se tabela existe
SELECT * FROM estoque_notifications LIMIT 1;

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime 
ADD TABLE estoque_notifications;
```

### Webhook não recebe dados

**Verificar:**
1. URL configurada corretamente na FácilZap
2. Endpoint retorna 200 OK no teste
3. Logs do Netlify Functions

**Teste manual:**
```bash
# Ver logs do webhook
netlify functions:log facilzap-estoque
```

### Estoque não atualiza na franqueada

**Verificar:**
1. URL do webhook da franqueada configurada
2. Secret key correta
3. WooCommerce API ativa

**Debug:**
```javascript
console.log('[Webhook] Payload:', payload);
console.log('[Webhook] WooCommerce URL:', process.env.WOOCOMMERCE_API_URL);
```

---

## 📝 Próximos Passos

### Melhorias Futuras

- [ ] Criar tabela `franqueadas_webhook_config` no banco
- [ ] Painel para gerenciar webhooks das franqueadas
- [ ] Retry automático em caso de falha
- [ ] Dashboard de métricas (webhooks enviados/falhados)
- [ ] Notificações via email/SMS para alertas críticos
- [ ] Integração com Shopify
- [ ] Log de auditoria de mudanças de estoque

---

## 📚 Referências

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [Shopify Admin API](https://shopify.dev/docs/api/admin-rest)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)

---

**Última atualização:** 25/10/2025  
**Versão:** 1.0.0
