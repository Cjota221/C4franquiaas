# 🚀 ATIVAR WEBHOOK FACILZAP - PASSO A PASSO

## 📋 PRÉ-REQUISITOS

- [ ] Acesso ao painel do FácilZap
- [ ] Acesso ao Netlify Dashboard

---

## PASSO 1️⃣: Configurar Variável no Netlify

1. Acesse: https://app.netlify.com/sites/c4franquiaas/configuration/env
2. Adicione ou verifique a variável:

```
Nome:  FACILZAP_WEBHOOK_SECRET
Valor: MinhaSenhaSecreta2025!
```

> ⚠️ IMPORTANTE: Anote esse valor, você usará no FácilZap!

3. Clique em **Save**
4. Faça um **novo deploy** para aplicar

---

## PASSO 2️⃣: Configurar Webhook no Painel FácilZap

### Acesse as Configurações de Webhook

Procure por:
- **Integrações** → **Webhooks**
- **Configurações** → **API/Webhooks**
- **Automações** → **Webhooks**

### Configure o Endpoint

#### ✅ OPÇÃO A: URL com Secret (RECOMENDADO - Para ERPs sem headers customizados)

| Campo | Valor |
|-------|-------|
| **URL** | `https://c4franquiaas.netlify.app/api/webhook/facilzap?secret=MinhaSenhaSecreta2025!` |
| **Método** | `POST` |
| **Content-Type** | `application/json` |

> ⚠️ Substitua `MinhaSenhaSecreta2025!` pelo valor real da sua variável no Netlify!

#### Opção B: URL simples + Header (se o FácilZap suportar headers)

| Campo | Valor |
|-------|-------|
| **URL** | `https://c4franquiaas.netlify.app/api/webhook/facilzap` |
| **Método** | `POST` |
| **Content-Type** | `application/json` |
| **Header** | `X-FacilZap-Signature: MinhaSenhaSecreta2025!` |

### Selecione os Eventos

Marque os seguintes eventos:
- [x] **Produto criado** (produto_criado / product.created)
- [x] **Produto atualizado** (produto_atualizado / product.updated)
- [x] **Estoque atualizado** (estoque_atualizado / stock.updated)
- [x] Pedido criado (opcional, se disponível)

---

## PASSO 3️⃣: Testar o Webhook

### Opção A: Usar o FácilZap

1. No painel do FácilZap, procure por "Testar Webhook"
2. Envie um evento de teste
3. Veja se retorna `200 OK`

### Opção B: Teste Manual com cURL

Abra o terminal e execute:

```bash
curl -X POST https://c4franquiaas.netlify.app/api/webhook/facilzap \
  -H "Content-Type: application/json" \
  -H "X-FacilZap-Signature: MinhaSenhaSecreta2025!" \
  -d '{
    "event": "estoque_atualizado",
    "produto_id": "12345",
    "timestamp": "2025-12-27T12:00:00Z",
    "data": {
      "id": "12345",
      "estoque": 50
    }
  }'
```

### Opção C: Teste com PowerShell (Windows)

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "X-FacilZap-Signature" = "MinhaSenhaSecreta2025!"
}

$body = @{
    event = "estoque_atualizado"
    produto_id = "12345"
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    data = @{
        id = "12345"
        estoque = 50
    }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "https://c4franquiaas.netlify.app/api/webhook/facilzap" -Method POST -Headers $headers -Body $body
```

---

## PASSO 4️⃣: Verificar Logs

### No Supabase

Execute essa query para ver eventos recebidos:

```sql
SELECT 
  created_at,
  tipo,
  descricao,
  sucesso,
  erro
FROM logs_sincronizacao
WHERE tipo LIKE 'webhook%'
ORDER BY created_at DESC
LIMIT 20;
```

### No Netlify

1. Acesse: https://app.netlify.com/sites/c4franquiaas/logs/functions
2. Procure por `___netlify-server-handler`
3. Veja os logs em tempo real

---

## PASSO 5️⃣: Verificar Status

Acesse no navegador:

```
https://c4franquiaas.netlify.app/api/webhook/facilzap
```

Resposta esperada:

```json
{
  "status": "active",
  "security": "Enabled (x-facilzap-signature required)",
  "supported_events": [...]
}
```

Se aparecer `"security": "Disabled (WARNING)"`, a variável `FACILZAP_WEBHOOK_SECRET` não está configurada!

---

## ✅ CHECKLIST FINAL

- [ ] Variável `FACILZAP_WEBHOOK_SECRET` configurada no Netlify
- [ ] Novo deploy feito após adicionar a variável
- [ ] URL do webhook configurada no FácilZap
- [ ] Header `X-FacilZap-Signature` com o mesmo valor
- [ ] Eventos selecionados no FácilZap
- [ ] Teste retornou `200 OK`
- [ ] Logs aparecem em `logs_sincronizacao`

---

## 🆘 TROUBLESHOOTING

### Erro 401 Unauthorized

**Causa**: A assinatura não confere

**Solução**:
1. Verifique se o valor em `FACILZAP_WEBHOOK_SECRET` no Netlify é EXATAMENTE igual ao header enviado
2. Verifique o nome do header: pode ser `X-FacilZap-Signature` ou `X-Webhook-Secret`

### Erro 400 Bad Request

**Causa**: Payload inválido

**Solução**:
1. O campo `event` é obrigatório
2. O campo `data.id` ou `produto_id` é obrigatório

### Erro 500 Internal Server Error

**Causa**: Erro no processamento

**Solução**:
1. Veja logs do Netlify Functions
2. Veja tabela `logs_sincronizacao` para detalhes

### Webhook nunca chega

**Causa**: FácilZap não está enviando

**Solução**:
1. Verifique se os eventos estão ativados no painel
2. Faça uma alteração real de estoque para disparar
3. Teste com cURL para confirmar que a URL está acessível

---

## 📞 Contato FácilZap

Se o painel do FácilZap não tiver opção de webhook visível, entre em contato com o suporte deles para:
1. Solicitar ativação do recurso de webhooks
2. Pedir a documentação de eventos disponíveis
3. Confirmar formato exato do payload

---

📅 **Última atualização**: 27/12/2025
