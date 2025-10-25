# 🧪 Guia de Testes - Sistema de Sincronização

## 📋 Checklist de Testes

### 1️⃣ Preparação do Ambiente

#### Backend C4 Admin

```bash
# 1. Aplicar migration
node scripts/apply_migrations.mjs

# 2. Verificar migration aplicada
# SQL no Supabase:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'lojas' 
AND column_name LIKE 'webhook%';
```

**Resultado esperado**:
```
webhook_product_url
webhook_secret
```

#### Configurar Loja de Teste

```sql
-- No Supabase do C4 Admin
UPDATE lojas
SET 
  webhook_product_url = 'https://cjotarasteirinhas.com.br/api/webhooks/product-update',
  webhook_secret = 'test-secret-123',
  auto_sync_enabled = true
WHERE dominio = 'cjotarasteirinhas';

-- Verificar
SELECT 
  nome, 
  webhook_product_url, 
  webhook_secret, 
  auto_sync_enabled 
FROM lojas 
WHERE dominio = 'cjotarasteirinhas';
```

---

### 2️⃣ Testar SOLUÇÃO 1: Webhook Automático

#### Teste 1: Atualizar Estoque de Produto

```bash
# No terminal
curl -X PATCH https://c4franquiaas.netlify.app/api/produtos/ec0c0b0d-9b1c-4bc4-8e76-9ecf660cb956 \
  -H "Content-Type: application/json" \
  -d '{"estoque": 999}'
```

**Logs esperados no Console do C4 Admin**:
```
[api/produtos/:id PATCH] 🔔 Enviando webhook de atualização...
[webhookService] 🔔 Notificação de mudança de produto
[webhookService]   Evento: STOCK_UPDATED
[webhookService] 📋 Enviando para 1 loja(s)...
[webhookService] 📤 Enviando webhook para C Jota Rasteirinhas...
[webhookService] ✅ Webhook enviado com sucesso
```

**Logs esperados no Console da Franqueada**:
```
[webhook/product-update] 📥 Webhook recebido
[webhook/product-update] 🔐 Validando segurança...
[webhook/product-update]   Event: STOCK_UPDATED
[webhook/product-update] ♻️ Produto encontrado, atualizando...
[webhook/product-update] ✅ Produto atualizado com sucesso!
```

**Verificar no Banco da Franqueada**:
```sql
SELECT nome, estoque, last_synced_at 
FROM produtos 
WHERE id = 'ec0c0b0d-9b1c-4bc4-8e76-9ecf660cb956';
```

✅ **SUCESSO**: `estoque = 999` e `last_synced_at` recente

---

#### Teste 2: Webhook com Secret Inválido (Segurança)

```bash
# Simular webhook com secret errado
curl -X POST https://cjotarasteirinhas.com.br/api/webhooks/product-update \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: secret-errado" \
  -H "X-Webhook-Event: PRODUCT_UPDATED" \
  -H "X-Webhook-Source: c4-admin" \
  -d '{
    "eventType": "PRODUCT_UPDATED",
    "timestamp": "2025-10-25T14:00:00Z",
    "produto": {
      "id": "test-123",
      "nome": "Produto Teste",
      "preco_base": 99.90,
      "estoque": 10,
      "ativo": true
    }
  }'
```

**Resposta esperada**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid webhook secret"
}
```

✅ **SUCESSO**: Status 401, webhook rejeitado

---

### 3️⃣ Testar SOLUÇÃO 2: Catálogo Mestre

#### Teste 3: Buscar Catálogo Completo

```bash
curl -X GET "https://c4franquiaas.netlify.app/api/public/master-catalog?limit=10" \
  -H "X-API-Key: sua-chave-api-aqui"
```

**Resposta esperada**:
```json
{
  "success": true,
  "timestamp": "2025-10-25T14:30:00Z",
  "total": 235,
  "limit": 10,
  "offset": 0,
  "produtos": [
    {
      "id": "uuid-123",
      "sku": "SKU-34",
      "nome": "Rasteirinha Feminina",
      "preco_base": 199.90,
      "estoque": 50,
      "ativo": true,
      "imagem": "https://..."
    }
  ]
}
```

✅ **SUCESSO**: Array de produtos retornado

---

#### Teste 4: Catálogo com Filtros

```bash
# Apenas produtos ativos
curl -X GET "https://c4franquiaas.netlify.app/api/public/master-catalog?only_active=true&limit=5" \
  -H "X-API-Key: sua-chave-api-aqui"
```

✅ **SUCESSO**: Apenas produtos com `ativo: true`

---

### 4️⃣ Testar Sincronização em Lote

#### Teste 5: Sincronização Manual Completa

**No código do painel da franqueada**:

```tsx
// Adicionar temporariamente na página de produtos
<SyncCatalogButton
  masterCatalogUrl="https://c4franquiaas.netlify.app/api/public/master-catalog"
  apiKey="sua-chave-api-aqui"
  mode="update_only"
  onSyncComplete={(result) => {
    console.log('Resultado:', result);
  }}
/>
```

**Fluxo esperado**:
1. Clicar no botão "Sincronizar Catálogo Central"
2. Spinner de loading aparece
3. Após 5-10 segundos, aparece resumo:
   ```
   Sincronização Concluída!
   Total: 235
   Atualizados: 230
   Criados: 0
   Erros: 0
   ```

**Verificar no Banco**:
```sql
SELECT 
  COUNT(*) as total_sincronizado,
  MAX(last_synced_at) as ultima_sinc
FROM produtos
WHERE last_synced_at > NOW() - INTERVAL '1 minute';
```

✅ **SUCESSO**: Todos os produtos com `last_synced_at` recente

---

#### Teste 6: Criar Produto Novo via Sincronização

**No C4 Admin**: Criar produto novo manualmente
**No Painel Franqueada**: Clicar em "Sincronizar Catálogo"

**Resultado esperado**:
```
Sincronização Concluída!
Criados: 1
```

**E um aviso**:
```
1 produto(s) novo(s) foi(ram) criado(s) como DESATIVADO.
Ative-os manualmente na página de Produtos.
```

**Verificar no Banco**:
```sql
SELECT nome, ativo, last_synced_at
FROM produtos
WHERE last_synced_at > NOW() - INTERVAL '1 minute'
AND ativo = false;
```

✅ **SUCESSO**: Produto novo com `ativo: false`

---

## 🔧 Troubleshooting dos Testes

### Webhook não chega

**Verificar**:
1. URL do webhook está correta?
   ```sql
   SELECT webhook_product_url FROM lojas WHERE dominio = 'cjotarasteirinhas';
   ```

2. CORS do Netlify está configurado?
   - Verificar `netlify.toml`

3. Variável de ambiente `WEBHOOK_PRODUCT_SECRET` está definida?
   ```bash
   # No projeto da franqueada
   cat .env.local | grep WEBHOOK_PRODUCT_SECRET
   ```

---

### Erro 401 no catálogo mestre

**Verificar**:
1. Header `X-API-Key` está correto?
2. Variável `API_KEY` no `.env.local` do C4 Admin está definida?

---

### Produtos não são atualizados

**Verificar**:
1. SKU/código_barras existe no banco da franqueada?
   ```sql
   SELECT * FROM produtos WHERE codigo_barras = 'SKU-34';
   ```

2. Logs do endpoint `/api/products/sync-all`:
   ```
   [products/sync-all] ♻️ Atualizando produto existente
   [products/sync-all] ✅ Atualizado com sucesso
   ```

---

## 📊 Métricas de Sucesso

### Webhook Automático

| Métrica | Meta | Como Verificar |
|---------|------|----------------|
| **Latência** | < 2 segundos | Console logs timestamp |
| **Taxa de Sucesso** | > 95% | Logs "✅ Webhook enviado" |
| **Segurança** | 100% validação | Todos os webhooks validam secret |

### Sincronização Manual

| Métrica | Meta | Como Verificar |
|---------|------|----------------|
| **Tempo de Sync** | < 30s para 235 produtos | Tempo do loading |
| **Taxa de Erro** | < 1% | `result.errors / result.total` |
| **Produtos Atualizados** | 100% dos existentes | `result.updated` |

---

## ✅ Checklist Final

- [ ] Migration 015 aplicada no C4 Admin
- [ ] Variável `WEBHOOK_PRODUCT_SECRET` configurada (ambos os lados)
- [ ] Variável `API_KEY` configurada no C4 Admin
- [ ] Tabela `lojas` com webhook_product_url preenchida
- [ ] Teste 1: Atualizar estoque via PATCH ✅
- [ ] Teste 2: Webhook com secret inválido retorna 401 ✅
- [ ] Teste 3: Buscar catálogo completo ✅
- [ ] Teste 4: Filtros do catálogo funcionam ✅
- [ ] Teste 5: Sincronização manual completa ✅
- [ ] Teste 6: Produto novo criado como desativado ✅
- [ ] Logs detalhados em ambos os lados ✅
- [ ] Documentação `SYNC_SISTEMA.md` revisada ✅

---

**Data dos Testes**: ___/___/2025  
**Testado por**: _______________  
**Resultado Geral**: ⬜ APROVADO | ⬜ COM RESSALVAS | ⬜ REPROVADO
