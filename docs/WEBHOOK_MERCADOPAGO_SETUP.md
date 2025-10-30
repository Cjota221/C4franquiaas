# 🔔 GUIA: Configurar Webhook do Mercado Pago (Checkout Transparente)

## 🎯 OBJETIVO

Fazer o status do pedido mudar AUTOMATICAMENTE de "pending" para "approved" quando o pagamento for aprovado (PIX ou Cartão).

---

## 📋 COMO FUNCIONA

1. **Cliente paga** (PIX ou Cartão)
2. **Mercado Pago aprova** o pagamento
3. **Mercado Pago DISPARA webhook** → `https://SEU_DOMINIO/api/webhook/mercadopago`
4. **Nosso sistema recebe** a notificação
5. **Sistema atualiza** `status_pagamento` de `pending` → `approved`
6. **Dá baixa no estoque** automaticamente

---

## ⚠️ PROBLEMA ATUAL

O webhook **NÃO está configurado** no Mercado Pago ou **não está sendo recebido**.

**Sintomas**:

- ✅ Pagamento aprovado no Mercado Pago
- ❌ Status continua "pending" no sistema
- ❌ Não aparece log no console do servidor

---

## ✅ SOLUÇÃO - PASSO A PASSO

### **1️⃣ VERIFICAR URL DO WEBHOOK NO NETLIFY**

Sua aplicação está no Netlify. A URL do webhook é:

```
https://SEU_DOMINIO.netlify.app/api/webhook/mercadopago
```

**Como descobrir seu domínio**:

1. Vá em: https://app.netlify.com
2. Clique no seu projeto
3. Veja o domínio em "Site overview"
4. Exemplo: `c4-franquias-admin.netlify.app`

---

### **2️⃣ CONFIGURAR WEBHOOK NO MERCADO PAGO**

1. **Acesse**: https://www.mercadopago.com.br/developers/panel/app
2. **Clique na sua aplicação** (Produção ou Teste)
3. **Vá em**: "Webhooks" no menu lateral
4. **Clique em**: "Adicionar webhook"
5. **Configure**:

   - **URL de notificação**:

     ```
     https://c4-franquias-admin.netlify.app/api/webhook/mercadopago
     ```

     ⚠️ **Substitua** pelo seu domínio real!

   - **Eventos**:
     ✅ Marque: `payment` (Pagamentos)
     ✅ Marque: `merchant_order` (Pedidos)

   - **Modo**:
     - Para teste: Use URL do Netlify
     - Para produção: Use domínio customizado

6. **Clique em**: "Salvar"

7. **Teste a URL**:
   - O Mercado Pago vai fazer um GET na URL
   - Deve retornar status 200 OK
   - Se der erro, verifique se a URL está acessível

---

### **3️⃣ TESTAR SE O WEBHOOK FUNCIONA**

**Opção A: Fazer pagamento teste**

1. Faça uma compra na loja com cartão de teste
2. Use dados de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing
3. Cartão aprovado: `5031 4332 1540 6351`
4. CVV: `123`
5. Validade: Qualquer data futura
6. Nome: APRO (aprova sempre)

**Opção B: Simular webhook manualmente**

- Use o próprio painel do Mercado Pago
- Vá em "Webhooks" → "Simular notificação"

---

### **4️⃣ VERIFICAR LOGS DO WEBHOOK**

Após fazer um pagamento teste, veja os logs:

**No Netlify**:

1. Vá em: https://app.netlify.com
2. Clique no seu projeto
3. Vá em: **Functions** → **webhook-mercadopago**
4. Veja os logs de execução

**Procure por**:

```
🔔 [Webhook MP] Recebido
💳 [Webhook MP] Payment ID: XXXXX
📊 [Webhook MP] Status do pagamento: approved
✅ [Webhook MP] Venda atualizada com sucesso!
```

**Se NÃO aparecer logs**:

- Webhook não está chegando
- Verifique a URL configurada no MP
- Verifique se o domínio está acessível

---

### **5️⃣ VERIFICAR SE O CÓDIGO DO WEBHOOK ESTÁ CORRETO**

O arquivo `/api/webhook/mercadopago/route.ts` **JÁ ESTÁ IMPLEMENTADO**.

Ele faz:

1. ✅ Recebe notificação do MP
2. ✅ Busca detalhes do pagamento
3. ✅ Atualiza `status_pagamento` na tabela `vendas`
4. ✅ Dá baixa no estoque

---

### **6️⃣ TESTAR MANUALMENTE (TEMPORÁRIO)**

Se o webhook não funcionar imediatamente, você pode atualizar manualmente:

```sql
-- No Supabase SQL Editor
UPDATE vendas
SET status_pagamento = 'approved'
WHERE mp_payment_id = 'COLE_O_PAYMENT_ID_AQUI';
```

Para encontrar o `mp_payment_id`:

1. Vá no Mercado Pago → Vendas
2. Encontre o pagamento
3. Copie o ID

---

## 🔧 TROUBLESHOOTING

### ❌ "Webhook não chega"

**Causa**: URL incorreta ou não acessível
**Solução**:

- Verifique se a URL está correta
- Teste no navegador: `https://SEU_DOMINIO/api/webhook/mercadopago`
- Deve retornar: `{"status":"ok","message":"Webhook Mercado Pago endpoint is running"}`

### ❌ "Erro 401 Unauthorized"

**Causa**: `MP_ACCESS_TOKEN` não configurado
**Solução**:

1. Vá em Netlify → Site settings → Environment variables
2. Adicione: `MP_ACCESS_TOKEN` = seu access token do MP

### ❌ "Venda não encontrada"

**Causa**: `mp_payment_id` não está sendo salvo corretamente
**Solução**: Verificar logs do checkout no browser console

### ❌ "Status não muda mesmo com webhook"

**Causa**: RLS (Row Level Security) bloqueando UPDATE
**Solução**: Webhook usa `SUPABASE_SERVICE_ROLE_KEY` que bypassa RLS

---

## 📝 CHECKLIST FINAL

- [ ] URL do webhook configurada no Mercado Pago
- [ ] Eventos `payment` marcados
- [ ] URL testada e acessível (retorna 200 OK)
- [ ] `MP_ACCESS_TOKEN` configurado no Netlify
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado no Netlify
- [ ] Pagamento teste realizado
- [ ] Logs verificados no Netlify Functions
- [ ] Status mudou de pending → approved

---

## 🎯 RESULTADO ESPERADO

**ANTES** (manual):

```
Cliente paga → Status fica "pending" → Admin atualiza manualmente
```

**DEPOIS** (automático):

```
Cliente paga → Webhook recebe → Status muda para "approved" → Estoque atualizado
```

**TEMPO**: 5-10 segundos após aprovação do pagamento

---

## 📞 SUPORTE

Se continuar com problema:

1. Envie screenshot dos logs do Netlify Functions
2. Envie screenshot da configuração do webhook no MP
3. Envie o `mp_payment_id` de um pagamento teste
