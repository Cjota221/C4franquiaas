# 🚀 APLICAR MIGRATIONS URGENTES - 012 e 013

## ⚡ URGENTE: Aplicar Agora!

Essas migrations corrigem o erro de produtos e adicionam o painel de customização avançado.

---

## 📋 Migration 012: Adicionar Descrição nos Produtos

### **O Que Faz:**
Adiciona o campo `descricao` na tabela `produtos` para exibir nos sites.

### **Como Aplicar:**

1. **Acesse o Supabase:**
   ```
   https://supabase.com/dashboard
   ```

2. **Vá em SQL Editor > New Query**

3. **Cole o SQL:**
   ```sql
   BEGIN;

   ALTER TABLE produtos 
   ADD COLUMN IF NOT EXISTS descricao TEXT;

   COMMENT ON COLUMN produtos.descricao IS 'Descrição completa do produto exibida no site';

   COMMIT;
   ```

4. **Clique em RUN**

5. **Verifique:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'produtos' 
     AND column_name = 'descricao';
   ```
   
   Deve retornar:
   ```
   column_name | data_type
   descricao   | text
   ```

---

## 🎨 Migration 013: Painel de Customização Avançado

### **O Que Faz:**
Adiciona **28 novos campos** na tabela `lojas` para customização completa:

**Identidade Visual:**
- `descricao` - Descrição da loja
- `slogan` - Slogan
- `banner_hero` - Banner principal
- `texto_hero` - Título do banner
- `subtexto_hero` - Subtítulo do banner
- `favicon` - Ícone do site
- `fonte_principal` - Fonte principal
- `fonte_secundaria` - Fonte secundária
- `cor_texto` - Cor do texto
- `cor_fundo` - Cor de fundo
- `cor_botao` - Cor dos botões
- `cor_botao_hover` - Cor ao passar mouse
- `cor_link` - Cor dos links

**Contato:**
- `whatsapp` - Número WhatsApp
- `instagram` - Perfil Instagram
- `facebook` - Página Facebook
- `email_contato` - Email
- `telefone` - Telefone
- `endereco` - Endereço completo

**SEO:**
- `meta_title` - Título SEO
- `meta_description` - Descrição SEO
- `google_analytics` - ID Analytics
- `facebook_pixel` - ID Pixel

**Configurações:**
- `mostrar_estoque` - Exibir estoque
- `mostrar_codigo_barras` - Exibir código de barras
- `permitir_carrinho` - Permitir carrinho
- `modo_catalogo` - Modo catálogo (WhatsApp)
- `mensagem_whatsapp` - Mensagem padrão

### **Como Aplicar:**

1. **Acesse o Supabase:**
   ```
   https://supabase.com/dashboard
   ```

2. **Vá em SQL Editor > New Query**

3. **Cole o SQL:**
   ```sql
   BEGIN;

   ALTER TABLE lojas
   ADD COLUMN IF NOT EXISTS descricao TEXT,
   ADD COLUMN IF NOT EXISTS slogan VARCHAR(255),
   ADD COLUMN IF NOT EXISTS banner_hero TEXT,
   ADD COLUMN IF NOT EXISTS texto_hero VARCHAR(255),
   ADD COLUMN IF NOT EXISTS subtexto_hero TEXT,
   ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
   ADD COLUMN IF NOT EXISTS instagram VARCHAR(100),
   ADD COLUMN IF NOT EXISTS facebook VARCHAR(100),
   ADD COLUMN IF NOT EXISTS email_contato VARCHAR(255),
   ADD COLUMN IF NOT EXISTS telefone VARCHAR(20),
   ADD COLUMN IF NOT EXISTS endereco TEXT,
   ADD COLUMN IF NOT EXISTS favicon TEXT,
   ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255),
   ADD COLUMN IF NOT EXISTS meta_description TEXT,
   ADD COLUMN IF NOT EXISTS google_analytics VARCHAR(50),
   ADD COLUMN IF NOT EXISTS facebook_pixel VARCHAR(50),
   ADD COLUMN IF NOT EXISTS fonte_principal VARCHAR(100) DEFAULT 'Inter',
   ADD COLUMN IF NOT EXISTS fonte_secundaria VARCHAR(100) DEFAULT 'Poppins',
   ADD COLUMN IF NOT EXISTS cor_texto VARCHAR(7) DEFAULT '#1F2937',
   ADD COLUMN IF NOT EXISTS cor_fundo VARCHAR(7) DEFAULT '#FFFFFF',
   ADD COLUMN IF NOT EXISTS cor_botao VARCHAR(7),
   ADD COLUMN IF NOT EXISTS cor_botao_hover VARCHAR(7),
   ADD COLUMN IF NOT EXISTS cor_link VARCHAR(7) DEFAULT '#2563EB',
   ADD COLUMN IF NOT EXISTS mostrar_estoque BOOLEAN DEFAULT true,
   ADD COLUMN IF NOT EXISTS mostrar_codigo_barras BOOLEAN DEFAULT false,
   ADD COLUMN IF NOT EXISTS permitir_carrinho BOOLEAN DEFAULT true,
   ADD COLUMN IF NOT EXISTS modo_catalogo BOOLEAN DEFAULT false,
   ADD COLUMN IF NOT EXISTS mensagem_whatsapp TEXT DEFAULT 'Olá! Gostaria de saber mais sobre este produto:';

   COMMIT;
   ```

4. **Clique em RUN**

5. **Verifique:**
   ```sql
   SELECT column_name, data_type, column_default
   FROM information_schema.columns 
   WHERE table_name = 'lojas' 
     AND column_name IN ('descricao', 'whatsapp', 'modo_catalogo')
   ORDER BY column_name;
   ```
   
   Deve retornar 3 linhas.

---

## ✅ Checklist de Aplicação

### **Migration 012 (Produtos):**
- [ ] SQL colado no Supabase
- [ ] RUN executado
- [ ] Verificação passou
- [ ] Campo `descricao` existe

### **Migration 013 (Customização):**
- [ ] SQL colado no Supabase
- [ ] RUN executado
- [ ] Verificação passou
- [ ] 28 campos adicionados

### **Testes:**
- [ ] Produtos aparecem no site
- [ ] Painel de customização funciona
- [ ] Salvamento funciona
- [ ] Preview atualiza

---

## 🚨 Se Der Erro

### **Erro: "column already exists"**
✅ **NORMAL!** Significa que o campo já existe. A migration usa `IF NOT EXISTS`.

### **Erro: "permission denied"**
❌ **Problema:** Usuário sem permissão.

**Solução:** Use um usuário com permissão de admin no Supabase.

### **Erro: "syntax error"**
❌ **Problema:** SQL colado incorretamente.

**Solução:** Copie o SQL inteiro novamente, desde `BEGIN;` até o último `;`.

---

## 📊 Resultado Esperado

### **Antes:**
```
❌ Erro: column produtos.descricao does not exist
❌ Painel limitado (só nome, logo, 2 cores)
```

### **Depois:**
```
✅ Produtos aparecem no site
✅ Painel com 5 abas de customização
✅ 28 campos novos disponíveis
✅ Site totalmente personalizável
```

---

## 🎯 Próximos Passos

Após aplicar as migrations:

1. **Faça commit do código:**
   ```bash
   git add migrations/
   git commit -m "migrations: adiciona descricao e painel avançado"
   git push
   ```

2. **Teste local:**
   ```bash
   npm run dev
   ```

3. **Teste criar loja:**
   ```
   http://localhost:3001/franqueada/loja
   ```

4. **Teste site:**
   ```
   http://localhost:3001/loja/[dominio]
   ```

---

## 📅 Data de Aplicação
22 de outubro de 2025

## ⚡ Status
🔴 **URGENTE** - Aplicar agora para corrigir produtos
🟡 **IMPORTANTE** - Habilita painel de customização avançado

---

**APLIQUE AS DUAS MIGRATIONS AGORA!**
