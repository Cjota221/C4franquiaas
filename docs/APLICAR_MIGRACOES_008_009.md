# 🔧 Guia Rápido: Aplicar Migrações e Corrigir Erros

## ⚠️ Erros Atuais
```
❌ null value in column "id" of relation "franqueadas" violates not-null constraint
❌ Could not find the 'senha_definida' column of 'franqueadas' in the schema cache
```

**Causa:** A tabela `franqueadas` precisa de ajustes e as migrações 008 e 009 não foram aplicadas.

---

## ✅ Solução: Aplicar Migrações Corrigidas

### **Opção 1: Aplicar Via Supabase Dashboard (RECOMENDADO)**

1. **Abra o Supabase Dashboard:**
   - Acesse: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Vá para SQL Editor:**
   - Menu lateral → **SQL Editor**
   - Clique em **New query**

3. **Cole o SQL:**
   - Abra o arquivo: `migrations/APPLY_008_009.sql`
   - Copie TODO o conteúdo (agora com correção do ID incluída)
   - Cole no editor do Supabase

4. **Execute:**
   - Clique em **Run** ou pressione `Ctrl + Enter`
   - Aguarde confirmação de sucesso

5. **Verifique os Resultados:**
   - O script mostrará queries de verificação
   - Confirme que as colunas foram criadas
   - Confirme que a tabela `produtos_franqueadas_precos` existe

---

## 🧪 Testar Cadastro Imediatamente

### **1. Verificar Estrutura:**
```sql
-- Ver colunas em franqueadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'franqueadas' 
AND column_name IN ('user_id', 'senha_definida', 'ultimo_acesso');

-- Ver tabela produtos_franqueadas_precos
SELECT * FROM produtos_franqueadas_precos LIMIT 1;
```

### **2. Testar Cadastro:**
1. Acesse: http://localhost:3001/cadastro/franqueada
2. Preencha o formulário
3. Clique em "Cadastrar"
4. ✅ **Deve funcionar** sem erro de `senha_definida`

### **3. Testar Aprovação:**
1. Acesse: http://localhost:3001/admin/franqueadas
2. Encontre o cadastro criado
3. Clique em "Aprovar"
4. ✅ Sistema deve criar produtos vinculados

---

## 🔑 Configurar Primeiro Acesso

Após aplicar as migrações e aprovar uma franqueada, você precisa **vincular um usuário do Supabase Auth**:

### **Método 1: Via Supabase Dashboard (Manual)**

1. **Criar Usuário:**
   - Supabase Dashboard → **Authentication** → **Users**
   - Clique em **Add user**
   - Email: use o mesmo email da franqueada cadastrada
   - Password: defina uma senha (ex: `senha123`)
   - Clique em **Create user**
   - **COPIE o UUID** do usuário criado

2. **Vincular user_id:**
   ```sql
   UPDATE franqueadas 
   SET user_id = 'UUID-COPIADO-AQUI',
       senha_definida = true
   WHERE email = 'email@franqueada.com';
   ```

3. **Testar Login:**
   - Acesse: http://localhost:3001/franqueada/login
   - Email: `email@franqueada.com`
   - Senha: `senha123`
   - ✅ Deve redirecionar para `/franqueada/dashboard`

---

### **Método 2: Via Email (Automático - Futuro)**

Quando configurar SMTP no Supabase:

1. **Admin aprova franqueada** → Sistema envia email
2. **Franqueada clica no link** → Define senha
3. **Login automático** → Acessa dashboard

Para configurar:
- Supabase Dashboard → **Settings** → **Auth** → **SMTP Settings**
- Configure seu provedor de email (Gmail, SendGrid, etc.)

---

## 📋 Checklist Pós-Migração

- [ ] Migrações 008 e 009 aplicadas no Supabase
- [ ] Coluna `user_id` existe em `franqueadas`
- [ ] Coluna `senha_definida` existe em `franqueadas`
- [ ] Coluna `ultimo_acesso` existe em `franqueadas`
- [ ] Tabela `produtos_franqueadas_precos` criada
- [ ] Cadastro de franqueada funciona sem erros
- [ ] Usuário criado no Supabase Auth
- [ ] `user_id` vinculado à franqueada
- [ ] Login funciona em `/franqueada/login`
- [ ] Dashboard carrega corretamente
- [ ] Produtos aparecem em `/franqueada/produtos`

---

## 🐛 Troubleshooting

### **Erro: "Could not find the table 'produtos_franqueadas'"**
```sql
-- Verificar se a tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'produtos_franqueadas';

-- Se não existir, aplicar migration 007 primeiro
-- Ver: migrations/007_add_franqueadas_system.sql
```

### **Erro: "Usuário não vinculado a franqueada"**
```sql
-- Verificar vinculação
SELECT f.id, f.nome, f.email, f.user_id, f.status
FROM franqueadas f
WHERE f.email = 'email@teste.com';

-- Se user_id estiver NULL, vincular manualmente
UPDATE franqueadas 
SET user_id = 'uuid-do-usuario-auth'
WHERE email = 'email@teste.com';
```

### **Erro: "Franqueada não aprovada"**
```sql
-- Aprovar manualmente
UPDATE franqueadas 
SET status = 'aprovada',
    aprovado_em = NOW()
WHERE email = 'email@teste.com';
```

---

## 📞 Precisa de Ajuda?

Consulte a documentação completa:
- `docs/PAINEL_FRANQUEADA.md` - Guia completo do sistema
- `docs/FRANQUEADAS_IMPLEMENTADO.md` - Sistema de gerenciamento
- `migrations/008_add_user_id_to_franqueadas.sql` - Detalhes da migration 008
- `migrations/009_add_franqueadas_precos.sql` - Detalhes da migration 009

---

**Criado em:** 21 de outubro de 2025  
**Status:** ✅ Pronto para aplicar
