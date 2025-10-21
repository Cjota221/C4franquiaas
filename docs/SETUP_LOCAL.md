# 🚀 GUIA: Como Configurar o Ambiente Local

## ❗ Problema: "Não consigo acessar o local"

Você precisa configurar as variáveis de ambiente do Supabase para o servidor funcionar corretamente.

## ✅ Solução: Criar arquivo .env.local

### Passo 1: Copiar o arquivo de exemplo

Na pasta raiz do projeto (`c:\Users\carol\c4-franquias-admin\`), crie um arquivo chamado `.env.local`

### Passo 2: Preencher as credenciais

Copie o conteúdo abaixo e preencha com suas credenciais do Supabase:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui

# FácilZap API (se tiver)
FACILZAP_API_TOKEN=seu_token_facilzap_aqui

# Debug Mode (opcional)
NEXT_PUBLIC_DEBUG_MODE=true
DEBUG_SYNC=true
```

### Passo 3: Onde encontrar as credenciais do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings → API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Passo 4: Reiniciar o servidor

Após criar o `.env.local`, reinicie o servidor de desenvolvimento.

## 🔧 Comando alternativo para teste rápido

Se você quiser testar sem criar o arquivo, pode executar:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"; $env:NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave"; npm run dev
```

## ⚠️ Importante

- O arquivo `.env.local` NÃO deve ser commitado no Git (já está no .gitignore)
- Guarde suas credenciais com segurança
- Use variáveis diferentes para produção (Netlify)

## 📱 Após configurar

O servidor estará acessível em:
- Local: http://localhost:3000
- Network: http://10.0.0.102:3000
- Admin: http://localhost:3000/admin/produtos

---

**Precisa de ajuda?** Me avise se tiver dúvidas sobre onde encontrar as credenciais!
