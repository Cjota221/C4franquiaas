# 🔑 GUIA: Como Renovar o Token do FácilZap

## ❌ PROBLEMA IDENTIFICADO:

O token `FACILZAP_TOKEN` está **EXPIRADO ou INVÁLIDO**, por isso a sincronização retorna **0 produtos**.

---

## ✅ SOLUÇÃO: Renovar o Token

### Passo 1: Obter Novo Token no FácilZap

1. **Acesse o painel do FácilZap:**

   - URL: https://painel.facilzap.app.br/ (ou a URL do seu painel)

2. **Vá em Configurações → API ou Integrações**

   - Procure por "Token de API" ou "API Key"
   - Ou procure em "Configurações Avançadas"

3. **Gere um novo token:**

   - Clique em "Gerar novo token" ou "Renovar token"
   - **IMPORTANTE:** Copie o token IMEDIATAMENTE
   - Guarde em local seguro (ele não será mostrado novamente)

4. **Permissões necessárias:**
   - ✅ Leitura de produtos
   - ✅ Leitura de estoque
   - ✅ Leitura de preços
   - (Se tiver webhook, habilitar também)

---

### Passo 2: Atualizar Token no Netlify

#### Via Interface Web (RECOMENDADO):

1. **Acesse o Netlify:**

   - https://app.netlify.com
   - Selecione seu site (c4franquiaas)

2. **Site settings → Environment variables**

   - Ou acesse direto: https://app.netlify.com/sites/c4franquiaas/settings/env

3. **Editar FACILZAP_TOKEN:**

   - Localize a variável `FACILZAP_TOKEN`
   - Clique em "Options" → "Edit"
   - Cole o NOVO token
   - Clique em "Save"

4. **Redeploy do site:**
   - Vá em "Deploys"
   - Clique em "Trigger deploy" → "Clear cache and deploy site"
   - **IMPORTANTE:** Aguarde o deploy terminar (2-3 minutos)

---

#### Via Netlify CLI (OPCIONAL):

\`\`\`bash

# Instalar Netlify CLI (se não tiver)

npm install -g netlify-cli

# Login

netlify login

# Navegar para o projeto

cd c4-franquias-admin

# Atualizar variável

netlify env:set FACILZAP_TOKEN "SEU_NOVO_TOKEN_AQUI"

# Redeploy

netlify deploy --prod
\`\`\`

---

### Passo 3: Verificar se Funcionou

**Aguarde 2-3 minutos** após o deploy, depois teste:

#### Opção 1: Via endpoint de teste

\`\`\`bash
curl https://c4franquiaas.netlify.app/api/test-sync
\`\`\`

Deve retornar:
\`\`\`json
{
"success": true,
"facilzap": {
"total_produtos": 354, // ✅ Não mais 0!
"total_paginas": 7
}
}
\`\`\`

#### Opção 2: Aguardar próximo cron (1 minuto)

Veja os logs do Netlify Functions em:

- https://app.netlify.com/sites/c4franquiaas/logs/functions

Deve mostrar:
\`\`\`
✅ [Cron] Sincronização concluída!
📊 [Cron] Processados: 354 produtos // ✅ Não mais 0!
\`\`\`

---

## 🔍 COMO IDENTIFICAR SE O TOKEN AINDA ESTÁ INVÁLIDO:

### Sintomas de token inválido:

- ❌ \`total_produtos: 0\`
- ❌ \`total_paginas: 0\`
- ❌ Logs mostram: "Processados: 0 produtos"

### Sintomas de token válido:

- ✅ \`total_produtos: 300+\`
- ✅ \`total_paginas: 7+\`
- ✅ Logs mostram produtos sendo processados

---

## 🚨 TROUBLESHOOTING:

### "Não encontro onde gerar o token no FácilZap"

1. Contate o suporte do FácilZap
2. Peça "Token de API para integração"
3. Mencione que precisa para "sincronização de produtos"

### "Atualizei o token mas continua 0 produtos"

1. Verifique se fez o redeploy no Netlify
2. Aguarde pelo menos 3 minutos
3. Limpe o cache: Site settings → Build & deploy → Clear cache
4. Execute o teste novamente

### "Recebi erro 401 ou 403"

- Token está correto mas sem permissões
- Peça ao administrador do FácilZap para dar permissões de API

---

## 📞 PRÓXIMOS PASSOS:

1. **Renovar token no FácilZap** ← FAÇA ISSO AGORA
2. **Atualizar no Netlify**
3. **Verificar teste** (curl ou aguardar cron)
4. **Me avisar quando funcionar** para continuarmos com os outros erros

---

## ⚠️ LEMBRETE IMPORTANTE:

**Tokens de API geralmente expiram!** Configure lembretes:

- 📅 Renovar token a cada 30-90 dias (depende do FácilZap)
- 🔔 Monitore logs diariamente
- 📊 Configure alertas quando \`processados = 0\`
