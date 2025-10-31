# ✅ CHECKLIST: Ativar Atualização Automática de Pagamentos

## 🎯 Objetivo

Fazer o status do pedido mudar AUTOMATICAMENTE de "pending" para "approved" quando o cliente pagar.

---

## 📋 PASSO A PASSO RÁPIDO

### **1️⃣ Configurar Variáveis de Ambiente no Netlify** ⏱️ 3 min

1. Acesse: https://app.netlify.com
2. Clique no seu projeto
3. Vá em: **Site settings** → **Environment variables**
4. Adicione as seguintes variáveis:

| Nome                        | Valor                            | Onde encontrar                                                                                                      |
| --------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJh...` (sua service role key) | Supabase → Project Settings → API → **service_role** key (⚠️ secret!)                                               |
| `MP_ACCESS_TOKEN`           | `APP_USR-...` (seu access token) | Mercado Pago → [Suas integrações](https://www.mercadopago.com.br/developers/panel/app) → Produção → **Credenciais** |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | `APP_USR-...` (sua public key)   | Mesma página de credenciais (Public Key)                                                                            |

5. Clique em **Save**

---

### **2️⃣ Redeploy do Netlify** ⏱️ 2 min

1. Ainda no Netlify, vá em: **Deploys**
2. Clique em: **Trigger deploy** → **Clear cache and deploy site**
3. Aguarde o deploy terminar (~2 min)

---

### **3️⃣ Configurar Webhook no Mercado Pago** ⏱️ 5 min

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Clique na sua **aplicação** (Produção)
3. Vá em: **Webhooks** (menu lateral)
4. Clique em: **Adicionar webhook** ou **Configurar notificações**

**Configure assim**:

```
URL de notificação:
https://SEU_DOMINIO.netlify.app/api/webhook/mercadopago

⚠️ Substitua SEU_DOMINIO pelo domínio real do Netlify!
Exemplo: https://c4-franquias-admin.netlify.app/api/webhook/mercadopago
```

**Eventos**:

- ✅ Marque: **Pagamentos** (payment)
- ✅ Marque: **Pedidos de comerciante** (merchant_order)

5. Clique em **Salvar**
6. O Mercado Pago vai **testar a URL** automaticamente
   - Se der ✅ verde → Webhook configurado com sucesso!
   - Se der ❌ erro → Verifique se o deploy terminou e a URL está acessível

---

### **4️⃣ Testar com Pagamento Real** ⏱️ 3 min

1. Faça uma **compra teste** na sua loja
2. Use **cartão de teste** para aprovar imediatamente:
   ```
   Número: 5031 4332 1540 6351
   CVV: 123
   Validade: 11/25 (qualquer data futura)
   Nome: APRO
   CPF: Qualquer CPF válido
   ```
3. Após finalizar compra, aguarde **5-10 segundos**
4. **Atualize a página** do painel franqueada/admin
5. **Verifique**: Status deve mudar de "pending" → "approved" ✅

---

### **5️⃣ Verificar Logs (se não funcionar)** ⏱️ 2 min

1. No Netlify, vá em: **Functions**
2. Procure por: **webhook-mercadopago** (ou similar)
3. Clique para ver os **logs**
4. Procure por mensagens como:
   ```
   🔔 [Webhook MP] Recebido
   💳 [Webhook MP] Payment ID: 12345678
   ✅ [Webhook MP] Venda atualizada com sucesso
   ```

**Se NÃO aparecer logs**:

- ❌ Webhook não está chegando
- Verifique a URL configurada no Mercado Pago
- Verifique se colocou o domínio correto

**Se aparecer erro "MP_ACCESS_TOKEN não configurado"**:

- ❌ Variável de ambiente faltando
- Volte no passo 1️⃣ e adicione `MP_ACCESS_TOKEN`

**Se aparecer erro "Venda não encontrada"**:

- ⚠️ Possível problema: `mp_payment_id` não foi salvo na venda
- Verifique o console do navegador ao finalizar compra

---

## 🎉 RESULTADO ESPERADO

**✅ SUCESSO se você ver**:

1. Cliente finaliza compra → Status fica "pending" (normal)
2. Após 5-10 segundos → Status muda automaticamente para "approved"
3. Estoque é atualizado automaticamente
4. Franqueada vê a venda com status "approved" no painel

**⏱️ Tempo total**: ~10-15 minutos

---

## 🆘 PRECISA DE AJUDA?

**Problema**: "Webhook não chega"

- ✅ Solução: Teste a URL no navegador: `https://seu-dominio.netlify.app/api/webhook/mercadopago`
- ✅ Deve retornar: `{"status":"ok","message":"Webhook Mercado Pago endpoint is running"}`

**Problema**: "Erro 401 Unauthorized"

- ✅ Solução: Adicione `MP_ACCESS_TOKEN` nas variáveis de ambiente e redeploy

**Problema**: "Status não muda mesmo com webhook"

- ✅ Solução: Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurado (webhook precisa disso para bypassing RLS)

---

## 📝 NOTAS

- ⚠️ Use credenciais de **PRODUÇÃO** no Netlify (não Teste)
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` é uma chave **SECRETA** - nunca exponha no frontend
- ⚠️ Teste primeiro com cartão de teste antes de usar cartão real
- ✅ O webhook já está implementado no código - você só precisa configurar!
- ✅ Depois que funcionar uma vez, vai funcionar automaticamente para sempre
