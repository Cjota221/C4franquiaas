# 🚨 CHECKLIST URGENTE - SISTEMA DE BANNERS

## ✅ Problema Identificado

O sistema estava com 2 bugs críticos impedindo banners customizados:

1. **Database**: Coluna `template_id` não aceita NULL (banners customizados)
2. **API**: Código tentava buscar template mesmo para banners 100% customizados

## 🔧 Correções Aplicadas

### 1. ✅ API Corrigida (arquivo `route.ts`)

- **Arquivo**: `app/api/banners/route.ts` (linhas 220-237)
- **O que mudou**: API agora verifica se `template_id` existe antes de buscar template
- **Resultado**: Banners customizados podem ser aprovados sem erro "Template não encontrado"

### 2. ⏳ Database - AÇÃO NECESSÁRIA

**VOCÊ PRECISA EXECUTAR ESTE SQL NO SUPABASE:**

```sql
ALTER TABLE banner_submissions
ALTER COLUMN template_id DROP NOT NULL;
```

**Como executar:**

1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. Vá em "SQL Editor"
3. Cole o comando acima
4. Clique em "Run" (F5)

**Ou execute o arquivo**: `ALTERAR_TEMPLATE_ID_NULLABLE.sql`

---

## 📋 PRÓXIMOS PASSOS (EM ORDEM)

### Passo 1: Executar SQL no Supabase

- [ ] Abrir Supabase Dashboard
- [ ] Acessar SQL Editor
- [ ] Executar: `ALTER TABLE banner_submissions ALTER COLUMN template_id DROP NOT NULL;`
- [ ] Verificar sucesso da execução

### Passo 2: Fazer Deploy no Netlify

```powershell
git add .
git commit -m "fix: corrigir aprovacao de banners customizados sem template"
git push
```

**Aguardar deploy completar** (~2-3 minutos)

### Passo 3: Testar Localmente PRIMEIRO

1. Certifique-se que dev server está rodando (`npm run dev`)
2. Acesse: http://localhost:3000/revendedora/personalizacao
3. Teste **banner customizado** (upload de imagens):
   - Upload desktop
   - Upload mobile
   - Preencher título
   - Submeter
4. Acesse admin: http://localhost:3000/admin/moderacao/banners
5. Aprovar banner customizado
6. Verificar se não aparece erro "Template não encontrado"

### Passo 4: Testar em Produção

1. Após deploy Netlify completar
2. Acesse: https://c4franquias.com/revendedora/personalizacao
3. Submeta banner customizado
4. Acesse: https://c4franquias.com/admin/moderacao/banners
5. Aprovar banner
6. Verificar catálogo da revendedora

---

## 🎯 O Que Cada Correção Faz

### Correção do Database (SQL)

- **Antes**: `template_id` era obrigatório → banners customizados falhavam
- **Depois**: `template_id` pode ser NULL → banners customizados funcionam
- **Permite**: Sistema diferenciar banners de template vs customizados

### Correção da API

- **Antes**: Tentava buscar template SEMPRE → erro 404 se `template_id` null
- **Depois**: Só busca template SE `template_id` existir
- **Lógica**:
  ```
  SE template_id existe:
    Buscar template
    Usar custom OU template como fallback
  SENÃO:
    Usar apenas URLs customizadas (uploaded)
  ```

---

## 🔍 Como Verificar se Está Funcionando

### Indicadores de Sucesso:

1. **Submissão funciona**:

   - Revendedora consegue enviar banner customizado
   - Nenhum erro de banco de dados
   - Banner aparece em "pendente" no admin

2. **Aprovação funciona**:

   - Admin consegue aprovar sem erro 404
   - Não aparece "Template não encontrado"
   - Banner aprovado vai para catálogo da revendedora

3. **URLs corretas**:
   - Desktop: `https://[PROJECT].supabase.co/storage/v1/object/public/banner-uploads/[USER_ID]/desktop_[TIMESTAMP].jpg`
   - Mobile: `https://[PROJECT].supabase.co/storage/v1/object/public/banner-uploads/[USER_ID]/mobile_[TIMESTAMP].jpg`

### Indicadores de Problema:

❌ Erro ao submeter: "null value in column template_id" → SQL não foi executado
❌ Erro 404 ao aprovar: "Template não encontrado" → Código antigo ainda em produção
❌ Console mostra 404 em `/api/banners` → Deploy Netlify não completou

---

## 📊 Status Atual

| Componente      | Status        | Ação Necessária        |
| --------------- | ------------- | ---------------------- |
| Código Frontend | ✅ OK         | Nenhuma - já corrigido |
| API Backend     | ✅ OK         | Deploy no Netlify      |
| Database Schema | ❌ BLOQUEADO  | **EXECUTAR SQL AGORA** |
| Netlify Deploy  | ⏳ AGUARDANDO | Push + aguardar build  |

---

## 🆘 Se Ainda Der Erro

### Erro: "null value in column template_id"

**Causa**: SQL não foi executado
**Solução**: Execute o SQL no Supabase (Passo 1 acima)

### Erro: "Template não encontrado" (404)

**Causa**: Código antigo ainda em produção
**Solução**:

1. Verifique se push foi feito: `git log -1`
2. Verifique Netlify: https://app.netlify.com (site deployments)
3. Aguarde build completar
4. Limpe cache do browser (Ctrl+Shift+R)

### Admin Panel em Branco

**Causa**: JavaScript error ao carregar dados
**Solução**:

1. Abra DevTools (F12) → Console
2. Procure erros em vermelho
3. Verifique Network tab → procure 404 ou 500
4. Se API retorna 404 → deploy não completou
5. Se API retorna 500 → problema no backend (check logs Supabase)

---

## ✨ Resumo Final

**2 bugs identificados. 2 correções feitas. 2 ações necessárias:**

1. ✅ Código corrigido localmente
2. ⏳ **VOCÊ PRECISA: Executar SQL no Supabase**
3. ⏳ **VOCÊ PRECISA: Fazer push + aguardar deploy**

Após essas 2 ações, sistema estará 100% funcional! 🎉
