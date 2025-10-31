# 🚨 PROBLEMAS IDENTIFICADOS E SOLUÇÕES

## ❌ Problemas Atuais

1. **Pagamento não atualiza automaticamente** (fica "pending")
2. **Pedido não aparece no painel da franqueada**
3. **Após pagar, volta para carrinho vazio** (mas a mensagem de sucesso EXISTE no código!)

---

## 🔍 CAUSA RAIZ

O **webhook do Mercado Pago NÃO está configurado** ou **NÃO está sendo chamado**.

Por isso:

- ✅ Pagamento é aprovado no Mercado Pago
- ❌ Sistema não recebe notificação
- ❌ Status não muda para "approved"
- ❌ Pedido não aparece (porque a query filtra por franqueada_id)

---

## ✅ SOLUÇÃO COMPLETA (15 minutos)

### **ETAPA 1: Adicionar variável MP_ACCESS_TOKEN no Netlify** ⏱️ 2 min

1. Acesse: https://app.netlify.com
2. Clique no seu projeto
3. Vá em: **Site settings** → **Environment variables**
4. Clique em: **Add a variable**
5. Preencha:
   - **Key:** `MP_ACCESS_TOKEN`
   - **Value:** Copie o valor de `MERCADOPAGO_ACCESS_TOKEN_PROD` que você já tem
   - **Scope:** All scopes
   - **Deploy contexts:** Same value in all deploy contexts
6. Clique em: **Create variable**

---

### **ETAPA 2: Adicionar variável NEXT_PUBLIC_MP_PUBLIC_KEY** ⏱️ 1 min

1. Ainda no Netlify, clique em: **Add a variable** novamente
2. Preencha:
   - **Key:** `NEXT_PUBLIC_MP_PUBLIC_KEY`
   - **Value:** Copie o valor de `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_PROD`
   - **Scope:** All scopes
   - **Deploy contexts:** Same value in all deploy contexts
3. Clique em: **Create variable**

---

### **ETAPA 3: Redeploy do site** ⏱️ 2 min

1. Ainda no Netlify, vá em: **Deploys**
2. Clique em: **Trigger deploy** → **Clear cache and deploy site**
3. **AGUARDE** o deploy terminar (aparece "Published" com check verde)
4. Anote o URL do seu site (exemplo: `https://c4-franquias-admin.netlify.app`)

---

### **ETAPA 4: Configurar webhook no Mercado Pago** ⏱️ 5 min

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Clique na sua **aplicação de PRODUÇÃO**
3. No menu lateral, procure por: **Webhooks** ou **Notificações** ou **Integrations**
4. Clique em: **Adicionar webhook** ou **Configurar notificações** ou **Add notification URL**

5. Preencha:

   - **URL de notificação:**

     ```
     https://SEU_DOMINIO.netlify.app/api/webhook/mercadopago
     ```

     ⚠️ **IMPORTANTE:** Substitua `SEU_DOMINIO` pelo domínio real do Netlify!

     Exemplo correto:

     ```
     https://c4-franquias-admin.netlify.app/api/webhook/mercadopago
     ```

   - **Eventos / Events:**
     - ✅ Marque: **Pagamentos** (`payment`)
     - ✅ Marque: **Pedidos** (`merchant_order`) se disponível

6. Clique em: **Salvar** ou **Save**

7. **TESTE AUTOMÁTICO:**
   - O Mercado Pago vai fazer um GET na URL
   - Deve aparecer ✅ **verde** (sucesso)
   - Se der ❌ **erro:** Verifique se o deploy terminou e a URL está correta

---

### **ETAPA 5: Testar com pagamento real** ⏱️ 3 min

1. **Faça uma compra teste** na sua loja
2. Use **cartão de teste** (para aprovar instantaneamente):

   ```
   Número: 5031 4332 1540 6351
   CVV: 123
   Validade: 11/25
   Nome: APRO
   CPF: Qualquer CPF válido
   ```

3. **Finalize o pagamento**

4. **Aguarde 5-10 segundos**

5. **Verifique:**
   - ✅ Deve aparecer a **tela de sucesso** com "Pagamento Confirmado! 🎉"
   - ✅ Deve receber email de confirmação
   - ✅ No painel admin, o status deve estar "approved"
   - ✅ No painel da franqueada, o pedido deve aparecer

---

## 🔧 TROUBLESHOOTING

### ❌ "Webhook deu erro 404 no teste do Mercado Pago"

**Causa:** URL está errada ou deploy não terminou

**Solução:**

1. Verifique se o deploy terminou (deve estar "Published")
2. Teste acessar: `https://seu-dominio.netlify.app/api/webhook/mercadopago`
3. Deve retornar: `{"status":"ok","message":"Webhook Mercado Pago endpoint is running"}`

---

### ❌ "Pagamento foi aprovado mas status continua pending"

**Causa:** Webhook não está sendo chamado

**Solução:**

1. Vá no Netlify → **Functions** → procure por "webhook"
2. Verifique se tem logs recentes
3. Se NÃO tiver logs: Webhook não está chegando
4. Volte no Mercado Pago e verifique se a URL está CORRETA

---

### ❌ "Erro 401 Unauthorized nos logs do webhook"

**Causa:** `MP_ACCESS_TOKEN` não configurado ou inválido

**Solução:**

1. Vá no Netlify → Site settings → Environment variables
2. Verifique se `MP_ACCESS_TOKEN` existe
3. Copie o valor de `MERCADOPAGO_ACCESS_TOKEN_PROD`
4. Se estiver vazio: Pegue no Mercado Pago → Credenciais
5. Faça redeploy

---

### ❌ "Venda não encontrada nos logs do webhook"

**Causa:** `mp_payment_id` não está sendo salvo na venda

**Solução:**

1. Abra o Console do navegador (F12) ao finalizar compra
2. Procure por: `[Venda] Payment ID:` ou `mp_payment_id`
3. Se aparecer: Código está funcionando
4. Se NÃO aparecer: Problema no código do checkout

---

## 📊 COMO VERIFICAR SE FUNCIONOU

### **No Netlify Functions (logs do webhook):**

```
🔔 [Webhook MP] Recebido
📦 [Webhook MP] Body: {...}
💳 [Webhook MP] Payment ID: 1234567890
📋 [Webhook MP] Detalhes do pagamento: {...}
🔄 [Webhook MP] Atualizando venda...
✅ [Webhook MP] Venda encontrada: abc-123-def
✅ [Webhook MP] Venda atualizada com sucesso
💰 [Webhook MP] Pagamento APROVADO! Dando baixa no estoque...
✅ Estoque atualizado: 10 → 9
🎉 [Webhook MP] Baixa no estoque concluída!
```

### **No painel da franqueada:**

- ✅ Venda aparece na lista
- ✅ Status está "approved" (não "pending")
- ✅ Nome da franqueada aparece (não "N/A")
- ✅ Comissão está calculada

### **No painel admin:**

- ✅ Venda aparece em /admin/pedidos
- ✅ Venda aparece em /admin/comissoes
- ✅ Status está "approved"
- ✅ Nome da franqueada está correto

---

## ⏱️ TEMPO ESPERADO

**Após pagamento aprovado:**

- ⏱️ **5-10 segundos** → Webhook é chamado
- ⏱️ **Instantâneo** → Status muda para "approved"
- ⏱️ **Instantâneo** → Estoque é atualizado
- ⏱️ **Instantâneo** → Pedido aparece nos painéis

Se demorar mais de 30 segundos, algo está errado!

---

## 📞 CHECKLIST FINAL

Antes de fazer o teste:

- [ ] Variável `MP_ACCESS_TOKEN` adicionada no Netlify
- [ ] Variável `NEXT_PUBLIC_MP_PUBLIC_KEY` adicionada no Netlify
- [ ] Redeploy feito e finalizado (status "Published")
- [ ] URL do webhook configurada no Mercado Pago
- [ ] Eventos `payment` marcados no webhook
- [ ] URL do webhook testada (deve retornar status 200 OK)

**Se todos os itens estiverem ✅, o webhook VAI FUNCIONAR!**
