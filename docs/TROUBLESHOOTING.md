# 🔧 Troubleshooting - Erro de Variáveis de Ambiente

## Problema: "Application error: a client-side exception has occurred"

### Sintoma
A página `/admin/produtos` (ou outras páginas do admin) exibe uma tela em branco com a mensagem:

> **"Application error: a client-side exception has occurred while loading c4franquiaas.netlify.app (see the browser console for more information)."**

### Causa Raiz
As variáveis de ambiente **`NEXT_PUBLIC_SUPABASE_URL`** e **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** não estão configuradas no Netlify.

---

## ✅ Solução Rápida (5 minutos)

### 1. Acesse o Netlify Dashboard
- Vá para: https://app.netlify.com/
- Faça login e selecione o site **c4franquiaas**

### 2. Configure as Variáveis de Ambiente
- Navegue para: **Site settings** → **Build & deploy** → **Environment** → **Environment variables**
- Clique em **"Add a variable"**

### 3. Adicione as Variáveis Necessárias

| Variável | Onde Obter | Descrição |
|----------|------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API → **Project URL** | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API → **anon public** | Chave pública do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API → **service_role** | Chave de serviço (secreta) |
| `FACILZAP_TOKEN` | Painel FácilZap | Token da API (opcional) |

### 4. Faça Redeploy
1. Vá em: **Deploys** → **Trigger deploy**
2. Selecione: **"Clear cache and deploy site"**
3. Aguarde 2-5 minutos até o deploy completar

### 5. Teste
- Acesse: https://c4franquiaas.netlify.app/admin/produtos
- Faça login
- Verifique se a página carrega corretamente

---

## 🔍 Como Identificar o Erro

### No Console do Navegador (F12)
Se você ver uma mensagem similar a:
```
Error: Supabase client not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

ou

```
❌ Configuração Ausente: Por favor, configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no Netlify.
```

**Isso confirma** que as variáveis de ambiente estão ausentes.

### Nos Logs do Netlify
1. Vá em: **Deploys** → clique no último deploy → **Deploy log**
2. Procure por avisos sobre variáveis de ambiente ausentes

---

## 📋 Checklist de Verificação

- [ ] As variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão configuradas no Netlify?
- [ ] As variáveis têm os valores corretos (copie diretamente do Supabase Dashboard)?
- [ ] Você fez redeploy após adicionar as variáveis?
- [ ] O deploy foi concluído com sucesso?
- [ ] Você limpou o cache do navegador (Ctrl+Shift+R)?

---

## 🛡️ Prevenção de Erros

### Desenvolvimento Local
1. Copie o arquivo de exemplo:
   ```powershell
   copy .env.example .env.local
   ```

2. Preencha as variáveis em `.env.local` com suas credenciais

3. Nunca comite o arquivo `.env.local` no Git

### Deploy em Produção
1. **Sempre** configure as variáveis de ambiente no Netlify **antes** do primeiro deploy
2. Use o mesmo formato e valores do ambiente local
3. Faça "Clear cache and deploy" após adicionar novas variáveis

---

## 📚 Documentação Adicional

- [Variáveis de Ambiente - Guia Completo](./ENVIRONMENT.md)
- [Supabase - Getting Started](https://supabase.com/docs/guides/getting-started)
- [Netlify - Environment Variables](https://docs.netlify.com/environment-variables/overview/)

---

## 🆘 Ainda com Problemas?

### Verifique se a URL do Supabase está Correta
A URL deve seguir o formato:
```
https://seu-projeto.supabase.co
```

**❌ Formato Incorreto:**
- `seu-projeto.supabase.co` (falta `https://`)
- `https://supabase.co` (falta o ID do projeto)
- `https://seu-projeto.supabase.co/` (não deve terminar com `/`)

**✅ Formato Correto:**
```
https://xyzabc123.supabase.co
```

### Verifique se a Chave Anon Está Correta
A chave deve ser uma string longa começando com `eyJ...`

**Exemplo:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```

### Limpe o Cache Local
1. Feche o navegador
2. Reabra e acesse o site
3. Pressione Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)

---

**Última Atualização:** 20 de outubro de 2025
