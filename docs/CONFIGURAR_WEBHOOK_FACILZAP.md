# 🔔 Configurar Webhook do FacilZap

## 🎯 O que é o Webhook?

O webhook permite que o **FacilZap notifique automaticamente** o painel admin da C4 Franquias sempre que um produto for criado, atualizado ou deletado. Isso mantém o catálogo sincronizado em tempo real!

---

## 📋 Passo a Passo

### 1️⃣ Configurar Variável de Ambiente (Segurança)

No seu projeto (Netlify ou onde hospeda), adicione a variável de ambiente:

```
FACILZAP_WEBHOOK_SECRET=sua-chave-secreta-aqui-123456
```

**Como gerar uma chave segura:**
```bash
# No terminal (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ou use um gerador online:
https://www.random.org/strings/
```

⚠️ **IMPORTANTE**: Guarde essa chave em segredo! Ela garante que apenas o FacilZap possa enviar webhooks.

---

### 2️⃣ URL do Webhook

A URL do seu webhook é:

```
https://c4franquiaas.netlify.app/api/webhooks/facilzap-produtos
```

📝 **Substitua** `c4franquiaas.netlify.app` pelo seu domínio real!

---

### 3️⃣ Configurar no Painel do FacilZap

1. Acesse o **Painel do FacilZap**
2. Vá em **Configurações** → **Webhooks** (ou **Integrações**)
3. Clique em **Adicionar Webhook** ou **Novo Webhook**
4. Preencha os campos:

```
Nome: C4 Franquias - Sincronização de Produtos
URL: https://c4franquiaas.netlify.app/api/webhooks/facilzap-produtos
Método: POST
```

5. **Headers** (cabeçalhos HTTP):

```
Content-Type: application/json
X-Webhook-Secret: sua-chave-secreta-aqui-123456
```

⚠️ **Use a mesma chave** que você configurou em `FACILZAP_WEBHOOK_SECRET`!

6. **Eventos** para ouvir (marque todos):
   - ✅ Produto criado
   - ✅ Produto atualizado
   - ✅ Produto deletado
   - ✅ Sincronização completa

7. Clique em **Salvar** ou **Ativar Webhook**

---

### 4️⃣ Testar o Webhook

#### **Teste 1: Via Painel do FacilZap**

Se o FacilZap oferece um botão de "Testar Webhook":
1. Clique em **Testar**
2. Verifique se recebe sucesso ✅

#### **Teste 2: Manualmente (curl)**

```bash
curl -X POST https://c4franquiaas.netlify.app/api/webhooks/facilzap-produtos \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: sua-chave-secreta-aqui-123456" \
  -d '{
    "event": "produto.atualizado",
    "produto": {
      "id": "teste-123",
      "nome": "Produto de Teste",
      "preco": 99.90,
      "estoque": 10,
      "ativo": true
    }
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Webhook processado com sucesso"
}
```

#### **Teste 3: Criar/Editar Produto no FacilZap**

1. No painel do FacilZap, **crie um novo produto**
2. Aguarde alguns segundos
3. **Verifique** se o produto aparece automaticamente no painel admin da C4 Franquias
4. ✅ Se apareceu = Webhook funcionando!

---

## 🔍 Verificar se está Configurado

Acesse esta URL no navegador:

```
https://c4franquiaas.netlify.app/api/webhooks/facilzap-produtos
```

Você deve ver um JSON com:
```json
{
  "mensagem": "Webhook do FacilZap - Endpoint ativo",
  "configuracao": { ... },
  "variaveis_ambiente": {
    "FACILZAP_WEBHOOK_SECRET": "✅ Configurada"
  }
}
```

Se aparecer **"❌ Não configurada"** em `FACILZAP_WEBHOOK_SECRET`, configure a variável de ambiente!

---

## 📊 Eventos Suportados

| Evento | Descrição | Ação no Painel |
|--------|-----------|----------------|
| `produto.criado` | Novo produto criado no FacilZap | Cria produto no banco |
| `produto.atualizado` | Produto editado no FacilZap | Atualiza dados do produto |
| `produto.deletado` | Produto removido no FacilZap | Marca produto como inativo |
| `sync.full` | Sincronização completa | Atualiza todos os produtos |

---

## 🆘 Troubleshooting

### ❌ "Webhook não está funcionando"

**Verifique:**
1. ✅ Variável `FACILZAP_WEBHOOK_SECRET` está configurada no Netlify
2. ✅ URL do webhook está correta (sem erros de digitação)
3. ✅ Secret key no FacilZap é **exatamente igual** à variável de ambiente
4. ✅ Eventos estão marcados no FacilZap (produto.criado, atualizado, etc)

### ❌ "Erro 401 Unauthorized"

- A chave secreta (`X-Webhook-Secret`) está **incorreta** ou **não está sendo enviada**
- Configure o header `X-Webhook-Secret` com a mesma chave da variável de ambiente

### ❌ "Erro 500"

- Veja os logs do Netlify para identificar o erro
- Pode ser erro ao salvar no banco de dados

### ❌ "Produtos não aparecem automaticamente"

1. **Teste manualmente** o webhook com curl (comando acima)
2. **Verifique logs** do Netlify (Functions → facilzap-produtos)
3. **Sincronize manualmente** usando o botão "Sincronizar FacilZap" no painel admin

---

## 🎯 Sincronização Manual (Botão)

Caso o webhook não esteja configurado ou tenha falhado, você pode usar o **botão de sincronização manual**:

1. Acesse **Painel Admin** → **Produtos**
2. Clique no botão verde **"Sincronizar FacilZap"** no topo
3. Aguarde a mensagem de sucesso
4. ✅ Produtos atualizados!

---

## 📅 Manutenção

**Recomendações:**
- ✅ Teste o webhook **mensalmente** para garantir que está ativo
- ✅ Se mudar o domínio, **atualize a URL** no FacilZap
- ✅ Mantenha a chave secreta **segura** (não compartilhe)
- ✅ Se suspeitar de acesso não autorizado, **gere nova chave** e atualize em ambos os lugares

---

📅 **Criado**: 28/10/2025  
🔗 **URL do Webhook**: `/api/webhooks/facilzap-produtos`  
🔐 **Variável de Ambiente**: `FACILZAP_WEBHOOK_SECRET`
