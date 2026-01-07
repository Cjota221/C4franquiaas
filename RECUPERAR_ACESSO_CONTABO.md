# 🔐 Recuperar Acesso ao Contabo (VPS WhatsApp)

## Problema

Não consegue acessar o painel do Contabo e não está recebendo email de recuperação.

## Soluções

### 1️⃣ Verificar Email Cadastrado

- Acesse: https://my.contabo.com/
- Clique em "Forgot Password?"
- Tente com TODOS os emails que você usa:
  - Email principal
  - Email alternativo
  - Email do cadastro inicial

### 2️⃣ Verificar Caixa de Spam

⚠️ **MUITO IMPORTANTE!**

- Emails do Contabo costumam cair no SPAM
- Verifique as pastas:
  - 📧 Spam/Lixo Eletrônico
  - 📧 Promoções
  - 📧 Social

### 3️⃣ Checar Email Correto

Busque no seu email por:

- Remetente: `@contabo.com` ou `noreply@contabo.com`
- Assunto: "Welcome to Contabo" ou "Contabo Registration"
- Assunto: "Password Reset" ou "Reset your password"

### 4️⃣ Suporte Direto do Contabo

Se nada funcionar, abra ticket:

**Por Email:**

- support@contabo.com
- Assunto: "Cannot access account - Password reset not working"
- Mencione:
  - Nome completo usado no cadastro
  - Email(s) tentados
  - Número do cliente (se tiver)
  - IP do servidor VPS (se lembrar)

**Por Ticket:**

- https://my.contabo.com/support/ticket/create
- Mas precisa estar logado (catch-22!)

### 5️⃣ Informações Importantes para o Suporte

Quando contatar o suporte, tenha em mãos:

```
- Nome completo: [seu nome no cadastro]
- Email usado: [email do cadastro]
- Forma de pagamento: [cartão/PayPal usado]
- Data aproximada da contratação: [quando contratou]
- Tipo de serviço: VPS Cloud (para WhatsApp)
```

### 6️⃣ Acesso Direto ao VPS (Plano B)

Se você tem o IP do servidor, pode tentar acessar direto via SSH:

**Windows (PowerShell):**

```powershell
ssh root@SEU_IP_DO_VPS
```

**Credenciais:**

- Usuário: `root`
- Senha: [senha que você definiu no VPS]
- IP: [verificar email de "VPS Activated" do Contabo]

### 7️⃣ Localizar Email Original do Contabo

Busque no seu email por:

**Termos de busca:**

```
from:contabo.com
subject:VPS
subject:activated
subject:welcome contabo
subject:order confirmation
```

**Email de Ativação contém:**

- ✅ IP do servidor
- ✅ Dados de acesso SSH
- ✅ Número do cliente
- ✅ Login do painel

## 🆘 Precisa de Ajuda Urgente?

**Opção 1: Chat do Contabo**

- https://contabo.com/ (canto inferior direito)
- Disponível em horário comercial (Europa)

**Opção 2: Telefone**

- +49 89 3564717 70 (Alemanha)
- Horário: 9h-17h (horário alemão)

## 📋 Checklist Rápido

- [ ] Tentei recuperar senha com todos os emails
- [ ] Verifiquei pasta de SPAM
- [ ] Busquei emails antigos do Contabo
- [ ] Tentei acessar SSH direto (se tenho IP)
- [ ] Entrei em contato com suporte

## ⚠️ Importante

O servidor WhatsApp pode estar rodando mesmo sem você conseguir acessar o painel!

- Se as conversas estão funcionando, servidor está OK
- Problema é só de acesso ao painel de controle

---

**Me diga:**

1. Você lembra qual email usou no cadastro?
2. Está encontrando emails antigos do Contabo?
3. Tem o IP do servidor anotado em algum lugar?
