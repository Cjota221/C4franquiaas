# 🔐 Mercado Pago - Guia de Credenciais

## 📋 Tipos de Credenciais

O Mercado Pago fornece **4 tipos de credenciais**. Vamos usar apenas **2 agora**:

---

## ✅ **CREDENCIAIS EM USO**

### 1. Public Key (Chave Pública)

```
APP_USR-086dbdd9-9f48-43d3-9ed9-487662bbc457
```

- **📍 Onde usar:** Frontend (JavaScript/React)
- **🔓 Segurança:** Pode ser exposta publicamente
- **⚙️ Função:** Inicializar SDK do Mercado Pago no navegador
- **💡 Exemplo:** Renderizar formulário de cartão de crédito

**Configuração:**

```bash
# .env.local
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_PROD=APP_USR-086dbdd9-9f48-43d3-9ed9-487662bbc457
```

---

### 2. Access Token (Token de Acesso)

```
APP_USR-5373031385088927-072514-862fb0c406d6c9d956295ad1d8b47beb-631113758
```

- **📍 Onde usar:** Backend/API Routes (Node.js/Server)
- **🔒 Segurança:** **NUNCA** expor no frontend
- **⚙️ Função:** Fazer chamadas à API do Mercado Pago
- **💡 Exemplo:** Criar preferência de pagamento, buscar detalhes de um pagamento

**Configuração:**

```bash
# .env.local (VARIÁVEL PRIVADA - sem NEXT_PUBLIC_)
MERCADOPAGO_ACCESS_TOKEN_PROD=APP_USR-5373031385088927-072514-862fb0c406d6c9d956295ad1d8b47beb-631113758
```

---

## ⏭️ **CREDENCIAIS PARA O FUTURO (OAuth)**

### 3. Client ID

```
5373031385088927
```

- **⏳ Quando usar:** Implementação de OAuth 2.0
- **🎯 Objetivo:** Permitir que cada franqueada tenha sua própria conta MP
- **📝 Status:** **Não implementado ainda**

---

### 4. Client Secret

```
••••••••••••••••••••••••••••
```

- **⏳ Quando usar:** OAuth 2.0 (junto com Client ID)
- **🔐 Segurança:** **EXTREMAMENTE** sensível
- **📝 Status:** **Não implementado ainda**

---

## 🏗️ **Arquitetura de Segurança Atual**

```
┌─────────────────────────────────────────────────┐
│  FRONTEND (Next.js Client Component)            │
│  ✅ Pode usar: Public Key                       │
│  ❌ Nunca usar: Access Token                    │
│                                                  │
│  Exemplo:                                        │
│  const mp = new MercadoPago(                     │
│    process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_PROD │
│  );                                              │
└─────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────┐
│  BACKEND (API Routes - Server Component)        │
│  ✅ Usa: Access Token                           │
│  🔒 Nunca expõe ao cliente                      │
│                                                  │
│  Exemplo:                                        │
│  fetch('https://api.mercadopago.com/...', {     │
│    headers: {                                    │
│      'Authorization': `Bearer ${accessToken}`   │
│    }                                             │
│  })                                              │
└─────────────────────────────────────────────────┘
```

---

## 🚀 **Configuração no Netlify**

### Variáveis Privadas (Server-side)

```bash
MERCADOPAGO_ACCESS_TOKEN_PROD=APP_USR-5373031385088927-072514-862fb0c406d6c9d956295ad1d8b47beb-631113758
```

### Variáveis Públicas (Frontend)

```bash
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_PROD=APP_USR-086dbdd9-9f48-43d3-9ed9-487662bbc457
```

---

## ⚠️ **Importante: Modo Teste vs Produção**

### 🟡 **Modo Teste (Sandbox)**

- Credenciais começam com `TEST-`
- Pagamentos não são reais
- Use para desenvolvimento e testes

### 🔴 **Modo Produção**

- Credenciais começam com `APP_USR-`
- **Pagamentos são REAIS**
- Use apenas quando estiver tudo testado

**No código:**

```typescript
// A função mp-credentials.ts escolhe automaticamente
// baseado em loja.mp_modo_producao (true/false)
const { accessToken, publicKey } = await getMercadoPagoCredentials(lojaId);
```

---

## 📚 **Links Úteis**

- [Onde encontrar credenciais](https://www.mercadopago.com.br/developers/panel/credentials)
- [Documentação de credenciais](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/credentials)
- [Testar pagamentos (sandbox)](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing)

---

## 🔧 **Como Obter Credenciais de Teste**

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Vá em **Suas Integrações → Credenciais**
3. Alterne para **Modo Teste**
4. Copie a **Public Key TEST** e o **Access Token TEST**
5. Configure no `.env.local`:

```bash
MERCADOPAGO_ACCESS_TOKEN_TEST=TEST-xxx...
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_TEST=TEST-APP_USR-xxx...
```

---

## ✅ **Checklist de Segurança**

- [x] Access Token está em variável privada (sem `NEXT_PUBLIC_`)
- [x] Public Key está em variável pública (`NEXT_PUBLIC_`)
- [x] Access Token **nunca** é enviado ao frontend
- [x] Credenciais estão no `.env.local` (não commitadas no Git)
- [x] Credenciais estão configuradas no Netlify
- [ ] Webhook está configurado no painel do MP
- [ ] Testado em modo Sandbox antes de produção
