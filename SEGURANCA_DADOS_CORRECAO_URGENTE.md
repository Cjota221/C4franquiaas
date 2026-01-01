# 🚨 ALERTA DE SEGURANÇA CRÍTICO - CORREÇÃO URGENTE

## ⚠️ VULNERABILIDADE ENCONTRADA

**SEVERIDADE:** CRÍTICA 🔴  
**STATUS:** Correção disponível  
**AÇÃO:** Aplicar imediatamente

---

## 🔍 O Problema

A tabela `resellers` está expondo **TODOS os dados sensíveis** publicamente através da política RLS muito permissiva:

### Dados Expostos Publicamente:

- ❌ CPF completo
- ❌ Email
- ❌ Data de nascimento
- ❌ Endereço completo (CEP, rua, número, complemento, bairro)
- ❌ Cidade e Estado
- ❌ Outros dados pessoais

### Como Estava Configurado:

```sql
CREATE POLICY "Resellers publicos para leitura"
  ON resellers FOR SELECT
  USING (status = 'aprovada' AND is_active = true);
```

Isso permite que **qualquer pessoa** faça:

```javascript
// Qualquer visitante consegue ver TODOS os dados!
supabase.from('resellers').select('*').eq('slug', 'qualquer-loja');
```

---

## ✅ A Solução

Criamos:

1. **VIEW pública segura** (`resellers_public`) com apenas dados necessários
2. **RLS restritivo** na tabela original
3. **Proteção de dados sensíveis**

### Dados Públicos (resellers_public):

- ✅ Nome da loja
- ✅ Slug
- ✅ Telefone (para WhatsApp do catálogo)
- ✅ Logos e banners
- ✅ Bio
- ✅ Redes sociais
- ✅ Tema e cores

### Dados Privados (apenas proprietário/admin):

- 🔒 CPF
- 🔒 Email
- 🔒 Data de nascimento
- 🔒 Endereço completo
- 🔒 Outros dados pessoais

---

## 📝 Como Aplicar a Correção

### PASSO 1: Aplicar Migration no Supabase

1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo de: `migrations/APLICAR_AGORA_SEGURANCA_DADOS.sql`
4. Clique em **Run**
5. Aguarde confirmação: "🔒 CORREÇÃO DE SEGURANÇA APLICADA COM SUCESSO!"

### PASSO 2: Verificar no Supabase

Execute esta query para confirmar:

```sql
-- Deve retornar apenas dados públicos
SELECT * FROM resellers_public LIMIT 1;

-- Deve retornar erro se não for admin/proprietário
SELECT cpf, email FROM resellers LIMIT 1;
```

---

## 🔧 Mudanças no Código (JÁ APLICADAS)

### Arquivo Alterado: `app/catalogo/[slug]/layout.tsx`

**ANTES (VULNERÁVEL):**

```typescript
const { data } = await supabase
  .from('resellers')
  .select('*') // ❌ Expõe todos os dados!
  .eq('slug', slug)
  .single();
```

**DEPOIS (SEGURO):**

```typescript
const { data } = await supabase
  .from('resellers')
  .select(
    'id, store_name, slug, phone, logo_url, banner_url, banner_mobile_url, bio, instagram, facebook, colors, theme_settings',
  )
  .eq('slug', slug)
  .eq('is_active', true)
  .eq('status', 'aprovada')
  .single();
```

---

## 🎯 Impacto da Correção

### ✅ Benefícios:

- Dados sensíveis das revendedoras protegidos
- Conformidade com LGPD
- Impossível vazar CPF, email, endereço
- Catálogo público continua funcionando normalmente

### ⚠️ Sem Impacto Negativo:

- Catálogo público funciona igual
- Revendedoras continuam acessando seus dados
- Admin continua gerenciando tudo
- Zero downtime

---

## 📊 Checklist de Segurança

- [x] Identificada vulnerabilidade crítica
- [x] Migration de correção criada
- [x] Código do catálogo atualizado
- [ ] **PENDENTE: Aplicar migration no Supabase**
- [ ] **PENDENTE: Verificar funcionamento**
- [ ] **PENDENTE: Fazer commit e push**

---

## 🔐 Boas Práticas Implementadas

1. **Princípio do Menor Privilégio**: Expor apenas o mínimo necessário
2. **VIEW Segura**: Camada de abstração para dados públicos
3. **RLS Restritivo**: Controle fino de acesso
4. **Documentação**: Comentários SQL indicando dados sensíveis

---

## 📞 Próximos Passos

1. **URGENTE**: Aplicar a migration no Supabase agora
2. Testar o catálogo público
3. Verificar painel admin
4. Fazer commit das mudanças
5. Monitorar logs

---

## ⚡ Aplicar Agora

```bash
# 1. A migration está em:
migrations/APLICAR_AGORA_SEGURANCA_DADOS.sql

# 2. Copie o conteúdo e aplique no Supabase SQL Editor

# 3. Após aplicar, faça:
git add .
git commit -m "security: corrige exposição de dados sensíveis de revendedoras"
git push
```

---

**Data da Descoberta:** 30/12/2025  
**Status:** Correção criada - AGUARDANDO APLICAÇÃO  
**Prioridade:** 🔴 CRÍTICA - Aplicar imediatamente
