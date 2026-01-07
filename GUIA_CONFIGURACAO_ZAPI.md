# 📱 Guia de Configuração Z-API

## 🎯 O que é Z-API?

Z-API é uma plataforma brasileira que permite integrar WhatsApp com seu sistema de forma simples e oficial.

**Vantagens:**

- ✅ Interface em português
- ✅ Suporte brasileiro
- ✅ Configuração super simples
- ✅ Plano gratuito disponível
- ✅ Muito mais fácil que Evolution API

---

## 📋 PASSO 1: Criar conta e conectar WhatsApp

### 1.1 Cadastro na Z-API

1. Acesse: https://app.z-api.io/
2. Clique em **"Criar conta grátis"**
3. Preencha seus dados
4. Confirme o email

### 1.2 Criar Instância

1. No painel, clique em **"+ Nova Instância"**
2. Escolha um nome (ex: "C4 Franquias")
3. Clique em **"Criar"**

### 1.3 Conectar WhatsApp

1. Aparecerá um **QR Code**
2. Abra o WhatsApp no seu celular
3. Vá em: **Configurações → Aparelhos Conectados**
4. Clique em **"Conectar aparelho"**
5. Escaneie o QR Code
6. Aguarde confirmação ✅

---

## 🔑 PASSO 2: Pegar credenciais

No painel da Z-API, você verá:

### **Instance ID**

Exemplo: `3D7B9F2A8C1E`

### **Token**

Exemplo: `ABC123XYZ789`

**📝 Anote esses dois valores!**

---

## ⚙️ PASSO 3: Configurar no seu projeto

### 3.1 Variáveis de Ambiente LOCAL

1. Crie o arquivo `.env.local` na raiz do projeto
2. Adicione:

```env
# Z-API WhatsApp
ZAPI_INSTANCE_ID=sua-instance-id-aqui
ZAPI_TOKEN=seu-token-aqui
```

### 3.2 Variáveis de Ambiente NETLIFY

1. Acesse: https://app.netlify.com
2. Vá em: **Site configuration → Environment variables**
3. Adicione as mesmas variáveis:
   - `ZAPI_INSTANCE_ID`
   - `ZAPI_TOKEN`

---

## 🧪 PASSO 4: Testar integração

### Teste 1: Verificar conexão

```bash
npm run dev
```

Acesse: http://localhost:3000/api/test-whatsapp

Você verá se está conectado.

### Teste 2: Enviar mensagem de teste

No painel admin, aprove uma revendedora para testar o envio automático.

---

## 📱 COMO USAR

### Enviar mensagem simples:

```typescript
import { sendWhatsAppMessage } from '@/lib/zapi-whatsapp';

await sendWhatsAppMessage({
  phone: '5511999999999', // DDI + DDD + número
  message: 'Olá! Teste de mensagem.',
});
```

### Enviar com template pronto:

```typescript
import { sendWhatsAppMessage, WhatsAppTemplates } from '@/lib/zapi-whatsapp';

await sendWhatsAppMessage({
  phone: '5511999999999',
  message: WhatsAppTemplates.aprovacaoCadastro(
    'Maria Silva',
    'https://c4franquias.com.br/maria-silva',
  ),
});
```

---

## 💰 PLANOS Z-API

### **Gratuito**

- 500 mensagens/mês
- 1 instância
- Ideal para testes

### **Starter - R$ 39/mês**

- 3.000 mensagens/mês
- 3 instâncias
- Recomendado para começar

### **Professional - R$ 89/mês**

- 10.000 mensagens/mês
- 10 instâncias
- Para crescimento

---

## 🔍 WEBHOOK (Receber mensagens)

Se quiser receber mensagens no seu sistema:

### 1. Configurar Webhook na Z-API

No painel:

1. Clique na sua instância
2. Vá em **"Webhooks"**
3. Adicione: `https://seu-site.netlify.app/api/webhook/whatsapp`

### 2. Criar rota no Next.js (já vou criar para você)

---

## ⚠️ PROBLEMAS COMUNS

### WhatsApp desconecta sozinho

**Solução:** Isso acontece se você:

- Desinstalar o WhatsApp
- Resetar o aparelho
- Ficar 14 dias sem usar

Solução: Reconectar o QR Code novamente.

### Mensagens não chegam

**Verifique:**

- [ ] Número está correto (DDI + DDD + número)
- [ ] WhatsApp está conectado
- [ ] Não ultrapassou limite de mensagens do plano
- [ ] Variáveis de ambiente estão corretas

### Erro "Invalid phone number"

**Formato correto:** `5511999999999`

- 55 = Brasil
- 11 = São Paulo
- 999999999 = número (9 dígitos para celular)

---

## 📚 Links Úteis

- **Painel Z-API:** https://app.z-api.io/
- **Documentação:** https://developer.z-api.io/
- **Suporte:** suporte@z-api.io
- **Status:** https://status.z-api.io/

---

## ✅ CHECKLIST

Antes de usar em produção:

- [ ] Conta criada na Z-API
- [ ] WhatsApp conectado via QR Code
- [ ] Instance ID copiado
- [ ] Token copiado
- [ ] Variáveis adicionadas no `.env.local`
- [ ] Variáveis adicionadas no Netlify
- [ ] Teste de conexão funcionando
- [ ] Mensagem de teste enviada e recebida

---

🎉 **Pronto! Agora seu sistema pode enviar WhatsApp automaticamente!**
