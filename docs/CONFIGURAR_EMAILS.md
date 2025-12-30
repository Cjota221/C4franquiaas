# 📧 Guia de Configuração - Notificações por Email

## Opção 1: Resend (Recomendado - Grátis até 3.000 emails/mês)

### Passo 1: Criar conta no Resend

1. Acesse https://resend.com
2. Crie uma conta gratuita
3. Vá em "API Keys" e crie uma nova chave

### Passo 2: Configurar domínio (opcional mas recomendado)

1. Em "Domains", clique em "Add Domain"
2. Adicione seu domínio (ex: c4franquias.com.br)
3. Configure os registros DNS conforme instruído
4. Aguarde a verificação

### Passo 3: Adicionar variável de ambiente

**No Netlify:**

1. Vá em Site Settings > Environment Variables
2. Adicione: `RESEND_API_KEY` = `re_xxxxx...` (sua chave)

**Localmente (.env.local):**

```
RESEND_API_KEY=re_xxxxx...
```

### Passo 4: Testar

Aprove uma revendedora e verifique se o email foi enviado!

---

## Opção 2: SendGrid (Grátis até 100 emails/dia)

### Configuração

1. Crie conta em https://sendgrid.com
2. Obtenha API Key
3. Adicione `SENDGRID_API_KEY` nas variáveis de ambiente

### Código (se preferir usar SendGrid)

```typescript
// Trocar a função de envio na API por:
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: reseller.email,
  from: 'noreply@seudominio.com',
  subject: '🎉 Sua conta foi aprovada!',
  html: getApprovalEmailHTML(...)
});
```

---

## Opção 3: Supabase Email (via Auth)

O Supabase já envia emails de confirmação automaticamente.
Para customizar, vá em: Authentication > Email Templates

---

## 📱 Notificação por WhatsApp (Futuro)

### Evolution API (Grátis - Self-hosted)

1. Instale Evolution API em um servidor
2. Conecte um número de WhatsApp
3. Configure webhook para enviar mensagens

### API Oficial do WhatsApp Business

1. Crie conta no Meta Business
2. Configure WhatsApp Business API
3. Custo: ~$0.05 por mensagem

---

## ✅ Status Atual

| Funcionalidade     | Status                                   |
| ------------------ | ---------------------------------------- |
| Email de aprovação | ✅ Implementado (precisa RESEND_API_KEY) |
| Email de rejeição  | ✅ Implementado (precisa RESEND_API_KEY) |
| WhatsApp           | 🔜 Futuro                                |

---

## 🧪 Testando sem Resend

Mesmo sem a chave do Resend, o sistema funciona:

- A aprovação/rejeição é feita normalmente
- O log mostra que o email "seria enviado"
- Quando configurar o Resend, os emails começam a ser enviados automaticamente
