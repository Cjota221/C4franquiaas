# 🔗 Webhook de Sincronização de Estoque

## 📋 Visão Geral

Este webhook sincroniza automaticamente o estoque após uma venda, atualizando:

- ✅ Banco de dados central (Supabase)
- ✅ Meta Commerce (Facebook/Instagram Shopping)
- ✅ Lojas das franqueadas (via notificação)

---

## 🔐 Configuração de Segurança

### Variáveis de Ambiente Necessárias

```bash
# .env.local
WEBHOOK_SECRET=c4franquias_webhook_secret_2025_secure_key
META_ACCESS_TOKEN=SEU_TOKEN_DA_META
META_CATALOG_ID=SEU_CATALOG_ID
```

### Como obter o Meta Access Token:

1. Acesse [Facebook for Developers](https://developers.facebook.com/)
2. Vá em **Ferramentas > Explorador de API Graph**
3. Selecione seu app de comércio
4. Adicione a permissão: `catalog_management`
5. Gere o token de acesso

---

## 📡 Endpoint do Webhook

### URL

```
POST https://c4franquiaas.netlify.app/api/sync-estoque
```

### Headers

```json
{
  "Content-Type": "application/json"
}
```

### Payload (Body)

```json
{
  "secret": "c4franquias_webhook_secret_2025_secure_key",
  "produto_sku": "CACAU-SHOW-100G",
  "quantidade_vendida": 2,
  "transacao_id": "VENDA-2025-001234"
}
```

---

## ✅ Resposta de Sucesso (200)

```json
{
  "success": true,
  "message": "Estoque sincronizado com sucesso",
  "data": {
    "sku": "CACAU-SHOW-100G",
    "estoque_anterior": 50,
    "estoque_novo": 48,
    "quantidade_vendida": 2,
    "tempo_processamento_ms": 145
  }
}
```

---

## ❌ Respostas de Erro

### 401 - Não Autorizado

```json
{
  "error": "Chave secreta inválida"
}
```

### 404 - Produto Não Encontrado

```json
{
  "error": "Produto não encontrado"
}
```

### 400 - Dados Inválidos

```json
{
  "error": "SKU ou quantidade inválida"
}
```

### 500 - Erro Interno

```json
{
  "error": "Erro interno do servidor",
  "details": "Mensagem de erro técnica"
}
```

---

## 🧪 Teste Local

### Com cURL:

```bash
curl -X POST http://localhost:3000/api/sync-estoque \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "c4franquias_webhook_secret_2025_secure_key",
    "produto_sku": "CACAU-SHOW-100G",
    "quantidade_vendida": 1,
    "transacao_id": "TEST-001"
  }'
```

### Com Postman:

1. Método: **POST**
2. URL: `http://localhost:3000/api/sync-estoque`
3. Body (JSON):

```json
{
  "secret": "c4franquias_webhook_secret_2025_secure_key",
  "produto_sku": "CACAU-SHOW-100G",
  "quantidade_vendida": 1,
  "transacao_id": "TEST-001"
}
```

---

## 📊 Health Check

Verifique se o webhook está online:

```bash
curl https://c4franquiaas.netlify.app/api/sync-estoque
```

Resposta:

```json
{
  "status": "online",
  "service": "Webhook de Sincronização de Estoque",
  "version": "1.0.0",
  "timestamp": "2025-10-29T20:53:00.000Z"
}
```

---

## 🔄 Fluxo de Sincronização

```
┌─────────────────────────────────────────────────────────┐
│  1. Venda Realizada                                     │
│     └─> Sistema de vendas dispara webhook              │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  2. Webhook Recebe Notificação                          │
│     └─> Valida secret                                   │
│     └─> Busca produto no banco                          │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  3. Atualiza Estoque Central (Supabase)                 │
│     └─> Calcula: estoque_novo = atual - vendida         │
│     └─> Salva no banco de dados                         │
│     └─> Registra movimentação (log)                     │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  4. Sincronizações Assíncronas (Paralelo)               │
│     ├─> Meta Commerce (Facebook/Instagram)              │
│     └─> Franqueadas (WebSocket/Webhook)                 │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  5. Retorna Sucesso (200 OK)                            │
│     └─> Total: ~100-200ms                               │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Logs

O webhook gera logs detalhados:

```
🔔 [Webhook] Recebido - SKU: CACAU-SHOW-100G, Qtd: 2, Transação: VENDA-001
📦 [Webhook] Produto encontrado: Chocolate ao Leite 100g - Estoque atual: 50
🔢 [Webhook] Novo estoque calculado: 48
✅ [Webhook] Estoque atualizado no banco de dados!
⚡ [Webhook] Sincronizações disparadas em background.
⚡ [Webhook] Processado em 145ms

🔄 [Sync] Iniciando sincronização para SKU CACAU-SHOW-100G...
📦 [Meta Sync] Sincronizando SKU CACAU-SHOW-100G com estoque 48...
✅ [Meta Sync] Estoque sincronizado com sucesso!
📢 [Franqueadas] Notificando lojas sobre SKU CACAU-SHOW-100G - Estoque: 48
✅ [Sync] Todas as sincronizações completadas!
```

---

## ⚠️ Alertas Automáticos

### Estoque Mínimo

Quando `estoque_novo <= estoque_minimo`:

```
⚠️ [Webhook] ALERTA: Produto Chocolate ao Leite 100g atingiu estoque mínimo!
```

### Estoque Zerado

Quando `estoque_novo === 0`:

```
🚫 [Webhook] CRÍTICO: Produto Chocolate ao Leite 100g sem estoque!
```

---

## 🔧 Troubleshooting

### Webhook retorna 401

- ✅ Verifique se o `secret` está correto
- ✅ Confira se `WEBHOOK_SECRET` está no `.env.local`

### Produto não encontrado (404)

- ✅ Verifique se o SKU está correto no banco
- ✅ Confirme que o produto está ativo

### Meta Sync falha

- ✅ Valide o `META_ACCESS_TOKEN`
- ✅ Confirme permissão `catalog_management`
- ✅ Verifique se o `META_CATALOG_ID` está correto

---

## 📚 Próximos Passos

- [ ] Implementar notificação WebSocket para franqueadas
- [ ] Adicionar retry automático em caso de falha na Meta API
- [ ] Criar dashboard de monitoramento de sincronizações
- [ ] Implementar fila de tarefas (Bull/BullMQ) para processamento assíncrono

---

## 🔗 Links Úteis

- [Meta Graph API Docs](https://developers.facebook.com/docs/marketing-api/catalog)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
