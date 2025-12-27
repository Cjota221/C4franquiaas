# 📊 Stock Sync Service - Documentação

## Visão Geral

Serviço de sincronização de estoque via **polling** da API FácilZap.
Usado quando o webhook não está disponível para alterações de estoque.

---

## 🔧 Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    STOCK SYNC SERVICE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Netlify    │───▶│   API Route  │───▶│  StockSync   │     │
│  │ Cron (2min)  │    │   /api/sync  │    │   Service    │     │
│  └──────────────┘    └──────────────┘    └──────┬───────┘     │
│                                                  │              │
│                      ┌───────────────────────────┼──────┐      │
│                      │                           ▼      │      │
│                      │  ┌─────────────────────────────┐ │      │
│                      │  │   FácilZap API (Polling)    │ │      │
│                      │  │   - GET /produtos?page=N    │ │      │
│                      │  │   - 1.2s delay entre páginas│ │      │
│                      │  └─────────────────────────────┘ │      │
│                      │                                  │      │
│                      │  ┌─────────────────────────────┐ │      │
│                      │  │      Supabase (Banco)       │ │      │
│                      │  │   - Compara estoque         │ │      │
│                      │  │   - UPDATE se diferente     │ │      │
│                      │  └─────────────────────────────┘ │      │
│                      └──────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Arquivos

| Arquivo                                        | Descrição                               |
| ---------------------------------------------- | --------------------------------------- |
| `lib/services/stockSyncService.ts`             | Serviço principal com toda a lógica     |
| `app/api/sync-estoque-polling/route.ts`        | API endpoint (GET status, POST trigger) |
| `netlify/functions/scheduled-stock-polling.ts` | Cron job (a cada 2 minutos)             |

---

## 🛡️ Rate Limiting

### Limites da API FácilZap

| Limite          | Valor                      |
| --------------- | -------------------------- |
| Por segundo     | 2 requisições              |
| Por dia         | 172.800 requisições        |
| Erro se exceder | HTTP 429 Too Many Requests |

### Nossa Implementação (Conservadora)

| Configuração            | Valor        | Razão                     |
| ----------------------- | ------------ | ------------------------- |
| Delay entre páginas     | 1.2 segundos | Garante < 1 req/s         |
| Delay entre requisições | 1.0 segundo  | Margem de segurança       |
| Max retries em 429      | 3 tentativas | Evita loop infinito       |
| Backoff inicial         | 5 segundos   | Tempo de espera após 429  |
| Backoff multiplicador   | 2x           | Exponencial: 5s, 10s, 20s |

---

## 🔄 Fluxo de Execução

```
1. Cron trigger (a cada 2 minutos)
        │
        ▼
2. Verifica se já está em execução
        │ (se sim, retorna 409)
        ▼
3. Busca produtos da API (paginado)
        │
        │  ┌─────────────────────────────┐
        ├──│ Página 1: GET /produtos?page=1
        │  │ Espera 1.2 segundos         │
        ├──│ Página 2: GET /produtos?page=2
        │  │ Espera 1.2 segundos         │
        └──│ ...até última página        │
           └─────────────────────────────┘
        │
        ▼
4. Busca produtos locais (Supabase)
        │
        ▼
5. Para cada produto:
        │
        ├── Compara estoque API vs Local
        │
        ├── Se IGUAL: pula (unchanged)
        │
        └── Se DIFERENTE:
                ├── UPDATE no banco
                └── Se estoque = 0:
                        └── Desativa nas franquias
        │
        ▼
6. Registra log em logs_sincronizacao
        │
        ▼
7. Retorna resultado
```

---

## 📡 Endpoints

### GET /api/sync-estoque-polling

Retorna status do serviço.

**Resposta:**

```json
{
  "service": "Stock Sync Service (Polling)",
  "status": "idle", // ou "running"
  "description": "Sincronização de estoque via polling",
  "schedule": "A cada 2 minutos (Cron)",
  "rate_limits": {
    "api_limit": "2 req/segundo",
    "daily_limit": "172.800 req/dia",
    "throttle_delay": "1.2s entre páginas"
  }
}
```

### POST /api/sync-estoque-polling

Executa sincronização manualmente.

**Resposta (sucesso):**

```json
{
  "success": true,
  "message": "Sincronização concluída: 15 produtos atualizados",
  "result": {
    "processed": 500,
    "updated": 15,
    "unchanged": 485,
    "errors": 0,
    "duration_ms": 45230,
    "rate_limit_hits": 0,
    "pages_fetched": 10
  }
}
```

**Resposta (já em execução):**

```json
{
  "success": false,
  "error": "Sincronização já em andamento",
  "message": "Aguarde a conclusão da sincronização atual"
}
```

---

## 🚨 Tratamento de Erros

### HTTP 429 (Rate Limit)

1. Incrementa contador `rate_limit_hits`
2. Aplica backoff exponencial (5s, 10s, 20s)
3. Retenta até 3 vezes
4. Se persistir, aborta sincronização atual

### Timeout

- Timeout por requisição: 15 segundos
- Se falhar, registra erro e continua com próximo produto

### Erro de Banco

- Registra erro no log
- Incrementa contador `errors`
- Continua processando outros produtos

---

## 📊 Monitoramento

### Logs no Console

```
============================================================
🔄 [StockSync] INICIANDO SINCRONIZAÇÃO DE ESTOQUE
============================================================

📡 [StockSync] Buscando página 1...
📊 [StockSync] Rate Limit: 1850/2000 restantes
✅ [StockSync] Página 1: 50 produtos
⏳ [StockSync] Aguardando 1200ms - Throttling entre páginas

📡 [StockSync] Buscando página 2...
✅ [StockSync] Página 2: 50 produtos

📦 [StockSync] Total de produtos buscados: 100
💾 [StockSync] 95 produtos locais indexados

📊 [StockSync] Comparando e atualizando estoques...

🔄 [StockSync] Atualizado: Sandália Rosa | 15 → 12
🔄 [StockSync] Atualizado: Tênis Branco | 0 → 5
🚫 [StockSync] Produto desativado (estoque zerado): Bolsa Azul

============================================================
📊 [StockSync] RESULTADO DA SINCRONIZAÇÃO
============================================================
   Sucesso: ✅
   Processados: 100
   Atualizados: 3
   Inalterados: 97
   Erros: 0
   Rate Limit Hits: 0
   Duração: 12.45s
============================================================
```

### Query para Verificar Logs

```sql
SELECT
  created_at,
  tipo,
  descricao,
  sucesso,
  payload->>'processed' as processados,
  payload->>'updated' as atualizados,
  payload->>'duration_ms' as duracao_ms
FROM logs_sincronizacao
WHERE tipo = 'polling_estoque'
ORDER BY created_at DESC
LIMIT 20;
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# API FácilZap
FACILZAP_API_URL=https://api.facilzap.app.br
FACILZAP_TOKEN=seu_token_aqui

# Supabase (já configuradas)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Ajustar Rate Limiting

Edite `lib/services/stockSyncService.ts`:

```typescript
const CONFIG = {
  DELAY_BETWEEN_PAGES_MS: 1200, // Aumentar se receber muitos 429
  MAX_RETRIES_ON_429: 3, // Aumentar se API instável
  PAGE_SIZE: 50, // Diminuir se páginas muito grandes
};
```

---

## 🆚 Polling vs Webhook

| Aspecto        | Polling (este serviço)         | Webhook         |
| -------------- | ------------------------------ | --------------- |
| Frequência     | A cada 2 minutos               | Tempo real      |
| Uso de API     | ~30 req por sync               | 0 (passivo)     |
| Complexidade   | Maior                          | Menor           |
| Confiabilidade | Alta (não depende de terceiro) | Depende do ERP  |
| Quando usar    | ERP sem webhook de estoque     | ERP com webhook |

**Recomendação:** Use ambos! Webhook para atualizações imediatas, Polling como fallback/verificação.

---

## 📅 Histórico

- **v1.0.0** (27/12/2025): Versão inicial com polling, throttling e backoff exponencial.
