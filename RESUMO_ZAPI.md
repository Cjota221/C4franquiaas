# ⚡ RESUMO RÁPIDO - Z-API

## 🎯 O QUE VOCÊ PRECISA FAZER AGORA

### 1️⃣ Criar conta Z-API (5 min)

👉 https://app.z-api.io/ → "Criar conta grátis"

### 2️⃣ Conectar WhatsApp (3 min)

- Nova Instância → Escanear QR Code

### 3️⃣ Copiar credenciais

- `Instance ID`: ******\_\_\_******
- `Token`: ******\_\_\_******

### 4️⃣ Adicionar no projeto

```bash
# Criar arquivo .env.local
ZAPI_INSTANCE_ID=seu_id_aqui
ZAPI_TOKEN=seu_token_aqui
```

### 5️⃣ Testar local

```bash
npm run dev
# Abrir: http://localhost:3000/api/test-whatsapp
```

### 6️⃣ Configurar Netlify

- Site configuration → Environment variables
- Adicionar `ZAPI_INSTANCE_ID` e `ZAPI_TOKEN`

### 7️⃣ Deploy

```bash
git add -A
git commit -m "feat: Z-API configurado"
git push
```

### 8️⃣ Testar aprovação

- Aprovar uma revendedora
- WhatsApp enviado automaticamente! 🎉

---

## 📁 ARQUIVOS CRIADOS

✅ `lib/zapi-whatsapp.ts` - Cliente Z-API  
✅ `app/api/test-whatsapp/route.ts` - Rota de teste  
✅ `app/api/admin/revendedoras/aprovar/route.ts` - Integração (atualizado)  
✅ `GUIA_CONFIGURACAO_ZAPI.md` - Guia completo  
✅ `PASSO_A_PASSO_ZAPI.md` - Instruções detalhadas

---

## 🚀 QUANDO FUNCIONAR

**Ao aprovar revendedora:**

- ✅ Status → "Aprovada"
- 📧 Email enviado
- 📱 **WhatsApp enviado automaticamente**

**Ao rejeitar revendedora:**

- ❌ Status → "Rejeitada"
- 📧 Email enviado
- 📱 **WhatsApp enviado automaticamente**

---

## 💡 DICA

Use o plano **GRATUITO** da Z-API para começar:

- 500 mensagens/mês
- Perfeito para testes e primeiros meses

Depois que crescer, upgrade para Starter (R$ 39/mês).

---

**🎯 PRÓXIMO PASSO:** Seguir o `PASSO_A_PASSO_ZAPI.md`
