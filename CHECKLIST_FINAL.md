# ✅ CHECKLIST: Configuração Final do Sistema de Envios

## 📋 Status Atual

### ✅ Já Feito:

- [x] Token do Melhor Envio salvo no banco de dados
- [x] Variável `NEXT_PUBLIC_MELHORENVIO_SANDBOX` = `false` ✅
- [x] Código atualizado para usar variáveis de ambiente
- [x] Deploy iniciado

### ⏳ Falta Fazer AGORA:

## 🔧 PASSO 1: Adicionar variável no Netlify

**Acesse:** https://app.netlify.com/sites/c4franquiaas/configuration/env

**Adicione esta variável:**

```
Nome: SUPABASE_SERVICE_ROLE_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsbW14c2R4bW92bGtwZnFhbXZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMzkyMDEwMSwiZXhwIjoyMDM5NDk2MTAxfQ.RM7IPQE-PgXW6xAZugFqJU1bCpcUb7xrOvPXOApOXuQ
```

**Importante:**

- Clique em "Add a variable" ou "New variable"
- Cole o nome EXATAMENTE: `SUPABASE_SERVICE_ROLE_KEY`
- Cole o valor completo acima
- Clique em **Save**

---

## 🚀 PASSO 2: Fazer novo deploy

Depois de salvar a variável:

1. Vá em **Deploys** (no menu do Netlify)
2. Clique em **Trigger deploy** → **Deploy site**
3. Aguarde 1-2 minutos

---

## ✅ PASSO 3: Testar tudo

Acesse: https://c4franquiaas.netlify.app/admin/diagnostico

Clique em **▶️ Executar Todos os Testes**

### Resultado Esperado:

```
✅ 1. Configuração no Banco de Dados - success
✅ 2. Variáveis de Ambiente - success
✅ 3. Autenticação Melhor Envio - success
✅ 4. API de Transportadoras - success (2 transportadoras)
✅ 5. API de Serviços de Envio - success (5 serviços)
✅ 6. Cálculo de Frete - success (opções de frete com preços reais)
```

**TODOS devem ficar VERDES! ✅**

---

## 🎯 Resumo das Variáveis no Netlify

Depois de adicionar, você deve ter:

```
NEXT_PUBLIC_MELHORENVIO_CLIENT_ID = 20735
NEXT_PUBLIC_BASE_URL = https://c4franquiaas.netlify.app
NEXT_PUBLIC_MELHORENVIO_SANDBOX = false
MELHORENVIO_CLIENT_SECRET = (seu secret)
MELHORENVIO_REDIRECT_URI = https://c4franquiaas.netlify.app/admin/configuracoes/melhorenvio/callback
SUPABASE_SERVICE_ROLE_KEY = eyJhbGci... (adicionar agora) ⬅️ FALTA ESTA!
```

---

## 🐛 Se der erro ainda:

1. Tire screenshot da página de diagnóstico
2. Me mostre para eu ajudar
3. Posso ver os logs do Netlify também

---

## 📞 Próximos Passos (depois que tudo ficar verde):

1. ✅ Testar cálculo de frete na loja
2. ✅ Aplicar migration 030 (tabelas de envio)
3. ✅ Configurar webhook do Melhor Envio
4. ✅ Integrar com Mercado Pago
5. ✅ Configurar notificações

Mas primeiro: **adicione a variável SUPABASE_SERVICE_ROLE_KEY no Netlify!** 🚀
