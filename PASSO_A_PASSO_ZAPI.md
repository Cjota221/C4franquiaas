# 🚀 CONFIGURAR Z-API - PASSO A PASSO

## ✅ O QUE JÁ FOI FEITO

- ✅ Cliente Z-API criado (`lib/zapi-whatsapp.ts`)
- ✅ Templates de mensagens prontos
- ✅ Integração com aprovação/rejeição de revendedoras
- ✅ Rota de teste (`/api/test-whatsapp`)
- ✅ Exemplo de `.env.local`

---

## 📋 PRÓXIMOS PASSOS

### **PASSO 1: Criar conta na Z-API** (5 minutos)

1. Acesse: https://app.z-api.io/
2. Clique em **"Criar conta grátis"**
3. Preencha:
   - Nome completo
   - Email
   - Senha
   - Telefone
4. Clique em **"Cadastrar"**
5. Confirme seu email (cheque a caixa de entrada)

---

### **PASSO 2: Criar Instância e Conectar WhatsApp** (3 minutos)

1. No painel Z-API, clique em **"+ Nova Instância"**
2. Digite um nome: `C4 Franquias`
3. Clique em **"Criar"**
4. **Aparecerá um QR Code** 📱
5. No seu celular:
   - Abra o **WhatsApp**
   - Vá em: **Configurações** → **Aparelhos Conectados**
   - Toque em **"Conectar aparelho"**
   - **Escaneie o QR Code** da tela do computador
6. Aguarde a mensagem: **"Conectado com sucesso!"** ✅

---

### **PASSO 3: Copiar Credenciais** (1 minuto)

No painel da instância, você verá:

```
Instance ID: 3D7B9F2A8C1E
Token: ABC123XYZ789DEF456
```

**📝 Copie esses dois valores!** (Vamos usar no próximo passo)

---

### **PASSO 4: Configurar no Projeto LOCAL** (2 minutos)

1. Abra o projeto no VS Code
2. Crie o arquivo `.env.local` na raiz (se não existir)
3. Adicione as variáveis:

```env
# 🗄️ Supabase (já deve ter)
NEXT_PUBLIC_SUPABASE_URL=sua-url-aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui

# 📱 Z-API WhatsApp (NOVO!)
ZAPI_INSTANCE_ID=COLE_SEU_INSTANCE_ID_AQUI
ZAPI_TOKEN=COLE_SEU_TOKEN_AQUI

# 🌐 URL do site (já deve ter)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Salve o arquivo

---

### **PASSO 5: Testar Localmente** (3 minutos)

1. No terminal, execute:

```bash
npm run dev
```

2. Acesse no navegador:

```
http://localhost:3000/api/test-whatsapp
```

3. **Resultado esperado:**

```json
{
  "success": true,
  "message": "✅ WhatsApp conectado com sucesso!",
  "connected": true
}
```

4. Se deu erro, verifique:
   - [ ] `ZAPI_INSTANCE_ID` está correto?
   - [ ] `ZAPI_TOKEN` está correto?
   - [ ] WhatsApp está conectado no painel Z-API?

---

### **PASSO 6: Configurar no NETLIFY** (5 minutos)

Agora vamos adicionar as variáveis no servidor de produção:

1. Acesse: https://app.netlify.com
2. Clique no seu site (c4franquiaas)
3. Vá em: **Site configuration** → **Environment variables**
4. Clique em **"Add a variable"**
5. Adicione uma por uma:

| Key                | Value                       |
| ------------------ | --------------------------- |
| `ZAPI_INSTANCE_ID` | Cole o Instance ID da Z-API |
| `ZAPI_TOKEN`       | Cole o Token da Z-API       |

6. Clique em **"Save"**

---

### **PASSO 7: Fazer Deploy** (2 minutos)

1. No terminal:

```bash
git add -A
git commit -m "feat: Integração Z-API WhatsApp configurada"
git push
```

2. Aguarde o Netlify fazer o deploy (2-3 minutos)
3. Acesse: `https://seu-site.netlify.app/api/test-whatsapp`
4. Deve aparecer: **"✅ WhatsApp conectado com sucesso!"**

---

### **PASSO 8: Testar Aprovação de Revendedora** (5 minutos)

1. Acesse: `https://seu-site.netlify.app/admin/revendedoras`
2. Escolha uma revendedora **pendente**
3. **IMPORTANTE:** Verifique se ela tem telefone cadastrado!
4. Clique em **"Aprovar"**
5. **O WhatsApp será enviado automaticamente!** 📱
6. Verifique o celular da revendedora

---

## 🎉 PRONTO! AGORA FUNCIONA ASSIM:

### Quando você **APROVAR** uma revendedora:

✅ Status muda para "Aprovada"  
📧 Email de aprovação enviado (se tiver Resend configurado)  
📱 **WhatsApp automático enviado com:**

- Mensagem de parabéns
- Link da loja personalizada
- Instruções de acesso

### Quando você **REJEITAR** uma revendedora:

❌ Status muda para "Rejeitada"  
📧 Email de rejeição enviado  
📱 **WhatsApp automático enviado com:**

- Mensagem educada
- Motivo da rejeição (se informado)

---

## 📊 MONITORAMENTO

### Ver se está funcionando:

1. Acesse o painel Z-API: https://app.z-api.io/
2. Clique na sua instância
3. Vá em **"Histórico"** ou **"Mensagens"**
4. Você verá todas as mensagens enviadas

### Logs no Netlify:

1. Acesse: https://app.netlify.com
2. Clique no seu site → **Functions**
3. Veja os logs das execuções

---

## ⚠️ PROBLEMAS COMUNS

### ❌ "WhatsApp não está conectado"

**Solução:**

1. Entre no painel Z-API
2. Clique na instância
3. Se aparecer "Desconectado", clique em **"Reconectar"**
4. Escaneie o QR Code novamente

### ❌ "Mensagem não chegou"

**Verifique:**

- [ ] Telefone está no formato correto: `5511999999999` (DDI + DDD + número, SEM +)
- [ ] WhatsApp está instalado nesse número
- [ ] Número não está bloqueado
- [ ] Você não ultrapassou o limite de mensagens do plano

### ❌ "Invalid phone number"

**Formato correto:**

```
Certo: 5511999999999
Errado: +55 11 99999-9999
Errado: 11999999999
Errado: 5511 999999999
```

### ❌ "Z-API não configurado"

**Verifique:**

1. Variáveis estão no `.env.local`?
2. Variáveis estão no Netlify?
3. Você fez deploy depois de adicionar no Netlify?

---

## 💰 PLANOS Z-API

### **Gratuito** (seu plano atual)

- ✅ 500 mensagens/mês
- ✅ 1 instância
- ✅ Perfeito para começar

**Quando trocar de plano?**

- Se você tiver mais de 500 aprovações/mês
- Se precisar conectar mais WhatsApps

### **Starter - R$ 39/mês**

- 3.000 mensagens/mês
- 3 instâncias

---

## 🎯 CHECKLIST FINAL

Antes de considerar concluído:

- [ ] Conta Z-API criada
- [ ] WhatsApp conectado (QR Code escaneado)
- [ ] Credenciais copiadas (Instance ID + Token)
- [ ] `.env.local` configurado
- [ ] Teste local funcionou (`/api/test-whatsapp`)
- [ ] Variáveis adicionadas no Netlify
- [ ] Deploy realizado
- [ ] Teste de produção funcionou
- [ ] Aprovação de revendedora testada
- [ ] WhatsApp recebido no celular ✅

---

## 📞 PRÓXIMOS PASSOS (OPCIONAL)

### Você pode adicionar mais automações:

1. ✅ **Boas-vindas:** Enviar WhatsApp assim que a revendedora se cadastra
2. ✅ **Novo pedido:** Notificar revendedora quando receber pedido
3. ✅ **Lembretes:** Produtos com estoque baixo
4. ✅ **Promoções:** Avisar sobre novos produtos

**Quer que eu implemente algum desses?** 🚀

---

## 📱 MENSAGENS QUE SERÃO ENVIADAS

### Aprovação:

```
🎉 *Parabéns, Maria!*

Seu cadastro como revendedora foi *APROVADO!* ✅

Agora você já pode:
✨ Acessar sua loja personalizada
🎨 Personalizar cores e logo
📦 Ativar produtos do catálogo
💰 Definir suas margens de lucro

🔗 *Sua loja:*
https://c4franquias.com.br/maria-silva

📱 *Login:* Use o mesmo email e senha do cadastro

Qualquer dúvida, estamos aqui para ajudar! 💙

_Equipe C4 Franquias_
```

### Rejeição:

```
Olá, Maria.

Infelizmente não foi possível aprovar seu cadastro no momento. ❌

*Motivo:* Documentação incompleta

Se tiver alguma dúvida ou quiser revisar sua solicitação, entre em contato conosco.

Estamos à disposição! 📱

_Equipe C4 Franquias_
```

---

**🎉 É isso! Agora seu sistema envia WhatsApp automaticamente!**
