# 🔍 DEBUG: Por que o webhook não está funcionando?

## ❌ Sintomas observados:

1. Cliente paga com PIX → pagamento APROVADO no Mercado Pago
2. Status no sistema continua "pending" (não muda para "approved")
3. Pedido não aparece no painel da franqueada

---

## 🎯 DIAGNÓSTICO - Siga PASSO A PASSO

### **PASSO 1: Verificar se o webhook foi configurado no Mercado Pago**

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Clique na sua aplicação (Produção)
3. Vá em: **Webhooks** ou **Notificações**
4. **Procure por uma URL configurada**

**❓ Você vê alguma URL tipo:**

```
https://c4-franquias-admin.netlify.app/api/webhook/mercadopago
```

- ✅ **SIM, vejo a URL** → Vá para PASSO 2
- ❌ **NÃO, não tem nenhuma URL** → **ESSE É O PROBLEMA!** Vá para SOLUÇÃO A

---

### **PASSO 2: Verificar se o webhook foi CHAMADO pelo Mercado Pago**

1. No Netlify, acesse: https://app.netlify.com
2. Clique no seu projeto
3. Vá em: **Functions** (menu lateral)
4. Procure por: **webhook-mercadopago** ou qualquer function com "webhook" ou "api"
5. Clique nela
6. Veja os **logs** das últimas execuções

**❓ Você vê logs recentes (dos últimos 10 minutos)?**

Procure por mensagens como:

```
🔔 [Webhook MP] Recebido
💳 [Webhook MP] Payment ID: 12345678
```

- ✅ **SIM, vejo logs** → O webhook está sendo chamado! Vá para PASSO 3
- ❌ **NÃO, não tem logs** → Webhook NÃO está sendo chamado. Vá para SOLUÇÃO B

---

### **PASSO 3: Verificar ERROS nos logs do webhook**

Nos logs do Netlify Functions, procure por mensagens de ERRO:

**❓ Você vê algum desses erros?**

- `❌ MP_ACCESS_TOKEN não configurado` → Vá para SOLUÇÃO C
- `❌ Venda não encontrada` → Vá para SOLUÇÃO D
- `❌ 401 Unauthorized` → Vá para SOLUÇÃO C
- `❌ SUPABASE_SERVICE_ROLE_KEY` → Vá para SOLUÇÃO E

---

## ✅ SOLUÇÕES

### **SOLUÇÃO A: Configurar webhook no Mercado Pago**

O webhook NÃO está configurado. Você precisa adicionar a URL:

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Clique na sua aplicação (Produção)
3. Vá em: **Webhooks** ou **Configurar notificações**
4. Clique em: **Adicionar webhook** ou **Nova notificação**
5. **URL de notificação:**
   ```
   https://c4-franquias-admin.netlify.app/api/webhook/mercadopago
   ```
   ⚠️ **IMPORTANTE:** Substitua `c4-franquias-admin` pelo SEU domínio real do Netlify!
6. **Eventos:** Marque `payment` (Pagamentos)
7. Clique em **Salvar**
8. **Teste:** Faça um novo pagamento teste

---

### **SOLUÇÃO B: Webhook não está sendo chamado**

Possíveis causas:

**B1. URL do webhook está ERRADA**

- Verifique se a URL no MP está correta
- Teste acessar: `https://seu-dominio.netlify.app/api/webhook/mercadopago`
- Deve retornar: `{"status":"ok","message":"Webhook Mercado Pago endpoint is running"}`

**B2. Eventos não estão marcados**

- Volte no Mercado Pago → Webhooks
- Certifique-se que o evento `payment` está marcado

**B3. Webhook em modo TESTE (não produção)**

- Verifique se está configurado na aplicação de PRODUÇÃO, não teste

---

### **SOLUÇÃO C: Erro de autenticação (MP_ACCESS_TOKEN)**

As variáveis do Mercado Pago não estão configuradas corretamente.

**No Netlify:**

1. Vá em: Site settings → Environment variables
2. **Procure por:** `MP_ACCESS_TOKEN`
3. **Se NÃO existir:** Adicione agora:
   - Key: `MP_ACCESS_TOKEN`
   - Value: Copie de `MERCADOPAGO_ACCESS_TOKEN_PROD`
4. **Trigger deploy** (Deploys → Trigger deploy → Clear cache and deploy)
5. **Aguarde deploy terminar** (~2 min)
6. **Teste novamente**

---

### **SOLUÇÃO D: Venda não encontrada**

O webhook está sendo chamado, mas não encontra a venda no banco.

**Possíveis causas:**

**D1. `mp_payment_id` não está sendo salvo**

- Quando você finaliza a compra, abra o **Console do navegador** (F12)
- Procure por logs como: `[Checkout] Payment ID:` ou `mp_payment_id`
- Se NÃO aparecer → O problema está no código do checkout

**D2. Payment ID está sendo salvo ERRADO**

- Execute este SQL no Supabase:
  ```sql
  SELECT id, cliente_nome, mp_payment_id, status_pagamento, created_at
  FROM vendas
  ORDER BY created_at DESC
  LIMIT 5;
  ```
- Verifique se `mp_payment_id` está NULL ou vazio
- Se estiver vazio → Problema no código do checkout

---

### **SOLUÇÃO E: Erro de permissão (SUPABASE_SERVICE_ROLE_KEY)**

O webhook não consegue atualizar o banco por falta de permissão.

**No Netlify:**

1. Vá em: Site settings → Environment variables
2. Procure por: `SUPABASE_SERVICE_ROLE_KEY`
3. **Se NÃO existir:** Adicione:
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Copie do Supabase (Project Settings → API → service_role secret)
4. **Trigger deploy**
5. **Teste novamente**

---

## 🚨 URGENTE: Verifique AGORA

**1. Você configurou o webhook no Mercado Pago?**

- [ ] Sim, a URL está lá
- [ ] Não, ainda não configurei

**2. Você adicionou `MP_ACCESS_TOKEN` no Netlify?**

- [ ] Sim, está configurado
- [ ] Não, só tenho `MERCADOPAGO_ACCESS_TOKEN_PROD`

**3. Você fez redeploy após adicionar as variáveis?**

- [ ] Sim, já fiz redeploy
- [ ] Não, ainda não

---

## 📞 PRÓXIMO PASSO

**Me envie:**

1. Screenshot da tela de Webhooks do Mercado Pago
2. Screenshot das Environment Variables do Netlify (pode esconder os valores)
3. Screenshot dos logs do Netlify Functions (se tiver)

Com essas informações eu consigo identificar EXATAMENTE onde está o problema!
