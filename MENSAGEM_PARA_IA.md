# 🤖 Mensagem para outra IA - Ajuda com Evolution API no Render

## 📋 CONTEXTO

Estou tentando hospedar a **Evolution API** (API de WhatsApp) no **Render.com** para integrar com meu sistema de franquias Next.js.

---

## 🎯 OBJETIVO

Quero que a Evolution API fique rodando 24/7 no Render.com para:

- Conectar WhatsApp via QR Code
- Enviar mensagens automáticas quando aprovar/rejeitar cadastros de revendedoras
- Integrar com meu site Next.js hospedado no Netlify

---

## ❌ PROBLEMA ATUAL

Estou tentando fazer deploy da Evolution API no Render.com usando o repositório público:

```
https://github.com/EvolutionAPI/evolution-api
```

**Mas está dando erro de banco de dados:**

```
Error: Database provider  invalid.
```

Mesmo configurando `DATABASE_ENABLED=false`, ele continua tentando rodar migrações do Prisma e falhando.

---

## 🔧 O QUE JÁ TENTEI

### Tentativa 1: Deploy via Public Git Repository

- Escolhi "Web Service" no Render
- Usei: `https://github.com/EvolutionAPI/evolution-api`
- Branch: main
- Language: Docker

**Variáveis de ambiente configuradas:**

```
AUTHENTICATION_API_KEY=minha-chave-secreta-123
DATABASE_ENABLED=false
SERVER_URL=https://evolution-api-t2jc.onrender.com
STORE_MESSAGES=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://user:pass@localhost:5432/db
DATABASE_CONNECTION_CLIENT_NAME=evolution_exchange
```

**Resultado:**

- Build funciona
- Deploy falha com erro: "Database provider invalid"
- Ele tenta rodar migrações do Prisma mesmo com `DATABASE_ENABLED=false`

**Logs do erro:**

```
Deploying migrations for postgresql
Database URL:
Error: P1001: Can't reach database server at `localhost:5432`
Migration failed
Error: Database provider  invalid.
==> Exited with status 1
```

---

## 💡 POSSÍVEL SOLUÇÃO (NÃO TESTADA)

Acredito que deva usar a **imagem Docker oficial** ao invés do repositório:

```
atendai/evolution-api:v2.2.0
```

Usando a aba **"Existing Image"** no Render, com apenas essas variáveis:

```
AUTHENTICATION_API_KEY=minha-chave-secreta-123
DATABASE_ENABLED=false
```

---

## ❓ PERGUNTAS

1. **Como fazer deploy correto da Evolution API no Render.com sem banco de dados?**
2. **Devo usar a imagem Docker pronta ou o repositório GitHub?**
3. **Quais variáveis de ambiente são REALMENTE necessárias?**
4. **Como evitar que ele tente rodar migrações do Prisma?**

---

## 🎯 REQUISITOS

- **Plataforma:** Render.com (Starter plan - $7/mês)
- **Sem banco de dados:** Quero usar cache em memória por enquanto
- **Sempre online:** Precisa rodar 24h sem dormir
- **Fácil de configurar:** Sou iniciante, preciso de passos claros

---

## 📚 REFERÊNCIAS

- Evolution API Docs: https://doc.evolution-api.com/
- Render.com Docs: https://render.com/docs
- Repositório oficial: https://github.com/EvolutionAPI/evolution-api
- Imagem Docker: https://hub.docker.com/r/atendai/evolution-api

---

## 🆘 AJUDA NECESSÁRIA

**Por favor, me dê um passo a passo detalhado de como:**

1. Configurar corretamente no Render.com
2. Fazer deploy funcionar sem erros de banco de dados
3. Conectar o WhatsApp após o deploy
4. Integrar com meu Next.js depois

**Formato preferido:** Passo a passo numerado, bem detalhado, como se eu fosse iniciante.

---

## ℹ️ INFORMAÇÕES ADICIONAIS

- Já tentei múltiplas vezes com diferentes configurações de variáveis
- O build sempre funciona, mas o deploy sempre falha
- Parece que o `DATABASE_ENABLED=false` está sendo ignorado
- Estou há várias horas tentando resolver isso

**Muito obrigada pela ajuda!** 🙏
