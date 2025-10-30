# 🧪 Teste de Pagamento - Mercado Pago

## 🎯 Como Testar o Fluxo Completo

### **Passo 1: Criar um Pedido de Teste**

Você pode testar de 2 formas:

#### **Opção A: Via cURL (Rápido)**

Execute no terminal:

```bash
curl -X POST https://c4franquiaas.netlify.app/api/mp-preference \
  -H "Content-Type: application/json" \
  -d '{
    "lojaId": "SEU_ID_DA_LOJA_AQUI",
    "items": [
      {
        "id": "PROD-001",
        "title": "Chocolate ao Leite 100g - TESTE",
        "quantity": 2,
        "unit_price": 15.90,
        "currency_id": "BRL",
        "picture_url": "https://via.placeholder.com/150"
      }
    ],
    "payer": {
      "email": "test_user_123456@testuser.com",
      "name": "Teste da Silva"
    },
    "external_reference": "PEDIDO-TESTE-001"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "preference_id": "123456-xxxx-xxxx",
  "init_point": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=xxx",
  "sandbox_init_point": "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=xxx",
  "is_production": false
}
```

---

#### **Opção B: Via Postman/Insomnia**

1. **Método:** POST
2. **URL:** `https://c4franquiaas.netlify.app/api/mp-preference`
3. **Headers:**
   ```
   Content-Type: application/json
   ```
4. **Body (JSON):**
   ```json
   {
     "lojaId": "SEU_ID_DA_LOJA_AQUI",
     "items": [
       {
         "id": "PROD-001",
         "title": "Produto Teste",
         "quantity": 1,
         "unit_price": 50.00,
         "currency_id": "BRL"
       }
     ],
     "payer": {
       "email": "test_user_123456@testuser.com",
       "name": "João Teste"
     },
     "external_reference": "PEDIDO-TESTE-001"
   }
   ```

---

### **Passo 2: Acessar o Link de Pagamento**

1. Copie o `init_point` (ou `sandbox_init_point` se estiver em teste)
2. Abra no navegador
3. Você verá o checkout do Mercado Pago

---

### **Passo 3: Usar Cartões de Teste**

**IMPORTANTE:** No modo sandbox, use apenas **cartões de teste** do Mercado Pago.

#### **Cartão que APROVA o pagamento:**
```
Número: 5031 4332 1540 6351
Titular: APRO
CVV: 123
Validade: 11/25
CPF: 12345678909
```

#### **Cartão que REJEITA o pagamento:**
```
Número: 5031 4332 1540 6351
Titular: OTHE
CVV: 123
Validade: 11/25
CPF: 12345678909
```

**Lista completa:** https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing

---

### **Passo 4: Acompanhar os Logs**

Após fazer o pagamento, veja os logs no terminal do Netlify:

1. Acesse: https://app.netlify.com
2. Vá em **Deploys → Functions**
3. Clique em `mp-webhook`
4. Veja os logs em tempo real

**Você deve ver:**
```
🔔 [MP Webhook] Notificação recebida: {...}
💳 [MP Webhook] Processando pagamento: 123456
📊 [MP Webhook] Status do pagamento: approved
📦 [MP Webhook] Pedido encontrado: xxx
✅ [MP Webhook] Pagamento APROVADO!
✅ [MP Webhook] Pedido atualizado com sucesso!
📦 [MP Webhook] TODO: Disparar integração Envioecom para gerar etiqueta
```

---

## 🔍 **Verificar no Banco de Dados**

Após o pagamento ser aprovado:

1. Acesse o Supabase
2. Vá em **Table Editor → pedidos**
3. Você deve ver um novo pedido com:
   - `status`: `PROCESSANDO_ENVIO`
   - `mp_payment_id`: O ID do pagamento
   - `mp_status`: `approved`
   - `pago_em`: Data/hora do pagamento

---

## 📊 **Status do Pedido - Fluxo Completo**

```
1. AGUARDANDO_PAGAMENTO
   ↓ (cliente paga no MP)
2. PAGO
   ↓ (webhook recebe notificação)
3. PROCESSANDO_ENVIO
   ↓ (integração Envioecom - próxima fase)
4. ENVIADO
   ↓ (produto chega ao cliente)
5. ENTREGUE
```

---

## ⚠️ **Troubleshooting**

### Erro 404 - Pedido não encontrado
- Certifique-se de criar o pedido no banco antes de criar a preferência
- Ou use o `external_reference` para identificar

### Webhook não dispara
- Verifique se a URL está correta no painel do MP
- Confirme que o webhook está ativo
- Veja os logs no Netlify Functions

### Pagamento não atualiza o pedido
- Verifique se o `mp_payment_id` ou `external_reference` estão corretos
- Veja os logs do webhook para identificar o erro

---

## 🎉 **Próxima Fase: Integração Envioecom**

Depois que o pagamento estiver funcionando 100%, vamos implementar:

1. Gerar etiqueta de envio automaticamente
2. Atualizar status: `PROCESSANDO_ENVIO` → `ENVIADO`
3. Enviar código de rastreio para o cliente

---

## 📚 **Links Úteis**

- [Cartões de Teste MP](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing)
- [Documentação Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Painel do Desenvolvedor MP](https://www.mercadopago.com.br/developers/panel)
