# ⚙️ Configuração do Webhook FácilZap no Netlify

## 1. Gerar Chave Secreta

Escolha uma senha forte (exemplo):

```
facilzap_webhook_2024_aK9$s!2@dF4gH6jK8mN0pQ
```

## 2. Configurar no Netlify

1. Acesse: https://app.netlify.com
2. Selecione o site: **c4franquiaas**
3. Vá em: **Site configuration** → **Environment variables**
4. Clique em: **Add a variable**
5. Adicione:
   - **Key**: `FACILZAP_WEBHOOK_SECRET`
   - **Value**: `facilzap_webhook_2024_aK9$s!2@dF4gH6jK8mN0pQ` (a senha que você escolheu)
   - **Scopes**: Todos os contextos (Production, Deploy Previews, Branch deploys)
6. Clique em **Create variable**
7. **Trigger deploy** (redeploy do site para aplicar a variável)

## 3. Configurar no FácilZap

1. Acesse o painel do FácilZap
2. Vá em: **Configurações** → **Webhooks** → **Adicionar Webhook**
3. Configure:
   - **URL do Webhook**: `https://c4franquiaas.netlify.app/api/webhook/facilzap`
   - **Método**: POST
   - **Header personalizado**:
     - Nome: `X-FacilZap-Signature`
     - Valor: `facilzap_webhook_2024_aK9$s!2@dF4gH6jK8mN0pQ` (mesma senha do Netlify)
   - **Eventos para notificar**:
     - ✅ `produto_criado`
     - ✅ `produto_atualizado`
     - ✅ `estoque_atualizado`
4. Salve o webhook

## 4. Testar o Webhook

### Teste 1: Verificar se endpoint está ativo

```powershell
curl https://c4franquiaas.netlify.app/api/webhook/facilzap
```

**Resposta esperada**: `{"status":"active","message":"Webhook FácilZap ativo"}`

### Teste 2: Simular evento de produto (depois de configurar a senha)

```powershell
curl -X POST https://c4franquiaas.netlify.app/api/webhook/facilzap `
  -H "Content-Type: application/json" `
  -H "X-FacilZap-Signature: facilzap_webhook_2024_aK9$s!2@dF4gH6jK8mN0pQ" `
  -d '{
    "event": "produto_criado",
    "data": {
      "id": "teste123",
      "nome": "Produto Teste Webhook",
      "preco_base": 99.90,
      "estoque": 10
    }
  }'
```

## 5. Monitorar Logs

### No Supabase - Ver logs de sincronização

```sql
SELECT * FROM logs_sincronizacao
ORDER BY timestamp DESC
LIMIT 20;
```

### No Netlify - Ver logs do webhook

1. Vá em: **Functions** → **facilzap**
2. Clique na aba **Logs**
3. Verifique se aparecem os logs de chamadas do webhook

## 6. Verificar Estatísticas

```sql
-- Ver estatísticas de sincronização
SELECT * FROM vw_estatisticas_sincronizacao;

-- Ver produtos sincronizados
SELECT id, nome, facilzap_id, sincronizado_facilzap, ultima_sincronizacao
FROM produtos
WHERE sincronizado_facilzap = true
LIMIT 10;
```

---

## ⚠️ Importante

- **Use a MESMA senha** no Netlify e no FácilZap
- **Guarde a senha** em local seguro (gerenciador de senhas)
- A URL do webhook é: `https://c4franquiaas.netlify.app/api/webhook/facilzap`
- O header de autenticação é: `X-FacilZap-Signature`
