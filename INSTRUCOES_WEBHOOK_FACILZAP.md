# 🚀 INSTRUÇÕES PARA ATIVAR WEBHOOK FACILZAP

## ✅ Checklist de Implementação

### 1️⃣ **Banco de Dados**

Execute a migration no Supabase SQL Editor:

```bash
Arquivo: migrations/WEBHOOK_FACILZAP_MIGRATION.sql
```

Isso vai criar:

- ✅ Coluna `facilzap_id` na tabela `produtos`
- ✅ Coluna `sincronizado_facilzap`
- ✅ Coluna `ultima_sincronizacao`
- ✅ Tabela `logs_sincronizacao`
- ✅ Views para monitoramento
- ✅ Índices para performance
- ✅ Políticas RLS

---

### 2️⃣ **Variáveis de Ambiente**

Adicione no **Netlify** (Site Settings → Environment Variables):

```env
FACILZAP_WEBHOOK_SECRET=SUA_CHAVE_SECRETA_COMPARTILHADA_COM_FACILZAP
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_do_supabase
```

⚠️ **IMPORTANTE:**

- A `FACILZAP_WEBHOOK_SECRET` deve ser a mesma configurada no painel do FácilZap
- A `SUPABASE_SERVICE_ROLE_KEY` já deve existir (verifique no Supabase Dashboard)

---

### 3️⃣ **Deploy no Netlify**

Faça commit e push das mudanças:

```bash
git add .
git commit -m "feat: Implementa webhook FácilZap para sincronização em tempo real"
git push origin main
```

Aguarde o deploy terminar (~2-3 minutos).

---

### 4️⃣ **Configurar no FácilZap**

1. Acesse o painel do FácilZap
2. Vá em **Configurações → Integrações → Webhooks**
3. Clique em **Adicionar Webhook**
4. Preencha:

   **URL do Webhook:**

   ```
   https://c4franquiaas.netlify.app/api/webhook/facilzap
   ```

   **Método:** `POST`

   **Headers Personalizados:**

   ```
   X-FacilZap-Signature: SUA_CHAVE_SECRETA
   ```

5. Selecione os eventos:

   - ✅ Produto Criado
   - ✅ Produto Atualizado
   - ✅ Estoque Atualizado

6. Clique em **Salvar**

---

### 5️⃣ **Testar o Webhook**

#### Opção A: Teste pelo FácilZap

Use o botão "Testar Webhook" no painel do FácilZap.

#### Opção B: Teste Manual com cURL

```bash
curl -X POST https://c4franquiaas.netlify.app/api/webhook/facilzap \
  -H "Content-Type: application/json" \
  -H "X-FacilZap-Signature: SUA_CHAVE_SECRETA" \
  -d '{
    "event": "estoque_atualizado",
    "produto_id": "FAC123456",
    "timestamp": "2025-11-18T10:00:00Z",
    "data": {
      "estoque": 5
    }
  }'
```

**Resposta Esperada:**

```json
{
  "success": true,
  "message": "Evento estoque_atualizado processado com sucesso",
  "result": {
    "produto_id": "uuid-do-produto",
    "action": "stock_updated",
    "novo_estoque": 5
  }
}
```

---

### 6️⃣ **Monitorar Logs**

#### Ver logs no Netlify:

1. Netlify Dashboard → Site → Functions
2. Procure por `webhook/facilzap`
3. Veja os logs em tempo real

#### Ver logs no Supabase:

```sql
-- Últimos 10 eventos
SELECT * FROM logs_sincronizacao
ORDER BY timestamp DESC
LIMIT 10;

-- Estatísticas de sincronização
SELECT * FROM vw_estatisticas_sincronizacao;

-- Produtos com estoque zero ainda ativos
SELECT * FROM vw_produtos_estoque_zero;
```

---

## 🔥 Regra de Negócio Crítica

### Estoque Zero = Desativação Automática

Quando o webhook recebe `estoque: 0`:

1. ✅ Atualiza `produtos.estoque = 0`
2. ✅ Desativa em `produtos_franqueadas_precos.ativo_no_site = false`
3. ✅ Desativa em `reseller_products.is_active = false`
4. ✅ Registra log em `logs_sincronizacao`

Isso garante que **nenhuma franqueada ou revendedora venda produto sem estoque!**

---

## 📊 Monitoramento Contínuo

### Dashboard SQL para Admin

```sql
-- Produtos sincronizados hoje
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE estoque = 0) as sem_estoque,
  COUNT(*) FILTER (WHERE estoque > 0) as com_estoque
FROM produtos
WHERE DATE(ultima_sincronizacao) = CURRENT_DATE
  AND sincronizado_facilzap = true;

-- Eventos de estoque zerado nas últimas 24h
SELECT
  l.timestamp,
  p.nome,
  p.facilzap_id,
  l.descricao
FROM logs_sincronizacao l
JOIN produtos p ON p.id = l.produto_id
WHERE l.tipo = 'estoque_zerado'
  AND l.timestamp > NOW() - INTERVAL '24 hours'
ORDER BY l.timestamp DESC;

-- Produtos desincronizados (facilzap_id nulo)
SELECT
  id,
  nome,
  estoque,
  ativo
FROM produtos
WHERE facilzap_id IS NULL
  OR sincronizado_facilzap = false
LIMIT 20;
```

---

## 🛠️ Troubleshooting

### Problema: Webhook retorna 401 Unauthorized

**Solução:** Verifique se o header `X-FacilZap-Signature` está correto e se a variável de ambiente está configurada no Netlify.

### Problema: Produto não encontrado

**Solução:** O produto precisa ter o `facilzap_id` preenchido. Verifique se o produto foi criado pelo webhook ou se precisa adicionar o ID manualmente.

### Problema: Estoque não desativa produtos

**Solução:** Verifique os logs da função `desativarProdutoEstoqueZero`. Pode ser problema de permissões RLS ou IDs incorretos.

### Problema: Muitos logs acumulados

**Solução:** Execute a limpeza manual:

```sql
SELECT limpar_logs_sincronizacao_antigos();
```

---

## 📚 Documentação Completa

Leia: `docs/WEBHOOK_FACILZAP.md`

---

## ✅ Próximos Passos (Opcional)

1. **Dashboard de Monitoramento:** Criar página admin para visualizar logs
2. **Alertas:** Configurar alertas por email quando webhook falhar
3. **Retry Logic:** Implementar retry automático em caso de falha
4. **Webhook de Reativação:** Adicionar evento para quando produto volta ao estoque

---

**Status:** ✅ Implementação Completa  
**Pronto para Produção:** Sim  
**Data:** 18/11/2025
