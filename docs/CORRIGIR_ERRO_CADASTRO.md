# 🚨 CORREÇÃO URGENTE - Erro de Cadastro

## ❌ Erro que você está vendo:
```
null value in column "id" of relation "franqueadas" violates not-null constraint
```

---

## ✅ SOLUÇÃO RÁPIDA (3 minutos)

### **PASSO 1: Abrir Supabase SQL Editor**

1. Acesse: **https://supabase.com/dashboard**
2. Selecione seu projeto **C4 Franquias**
3. Menu lateral → **SQL Editor**
4. Clique em **+ New query**

---

### **PASSO 2: Executar Este SQL**

**Cole este código no editor e clique em RUN:**

```sql
-- ============================================================================
-- CORREÇÃO COMPLETA - Execute tudo de uma vez
-- ============================================================================

-- 1. Corrigir coluna ID para gerar UUID automaticamente
ALTER TABLE franqueadas 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Adicionar colunas de autenticação
ALTER TABLE franqueadas 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE franqueadas 
ADD COLUMN IF NOT EXISTS senha_definida BOOLEAN DEFAULT false;

ALTER TABLE franqueadas 
ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_franqueadas_user_id ON franqueadas(user_id);

-- 3. Criar tabela de preços personalizados
CREATE TABLE IF NOT EXISTS produtos_franqueadas_precos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_franqueada_id UUID NOT NULL REFERENCES produtos_franqueadas(id) ON DELETE CASCADE,
  preco_base DECIMAL(10,2) NOT NULL,
  ajuste_tipo VARCHAR(20),
  ajuste_valor DECIMAL(10,2),
  preco_final DECIMAL(10,2) NOT NULL,
  ativo_no_site BOOLEAN DEFAULT false,
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(produto_franqueada_id)
);

CREATE INDEX IF NOT EXISTS idx_produtos_franqueadas_precos_produto ON produtos_franqueadas_precos(produto_franqueada_id);
CREATE INDEX IF NOT EXISTS idx_produtos_franqueadas_precos_ativo ON produtos_franqueadas_precos(ativo_no_site);

ALTER TABLE produtos_franqueadas_precos ENABLE ROW LEVEL SECURITY;

-- Mensagem de sucesso
SELECT '✅ TUDO CORRIGIDO! Pode cadastrar agora!' as status;
```

---

### **PASSO 3: Testar Cadastro Novamente**

1. Volte para: **http://localhost:3001/cadastro/franqueada**
2. Preencha o formulário:
   - Nome: Caroline Carvalho
   - Email: cjotarasteirinhas@hotmail.com
   - Telefone: 62981480687
   - CPF: 07712582599
   - Cidade: Goiânia
   - Estado: GO
3. Clique em **Cadastrar**
4. ✅ **Deve funcionar agora!**

---

## 🎯 Após o Cadastro Funcionar:

### **Aprovar a Franqueada:**

1. Acesse: **http://localhost:3001/admin/franqueadas**
2. Login admin se necessário
3. Encontre: **Caroline Carvalho**
4. Clique em **Aprovar**

---

### **Criar Usuário para Login:**

**No Supabase Dashboard:**

1. Vá em **Authentication** → **Users**
2. Clique em **Add user**
3. Preencha:
   - **Email:** `cjotarasteirinhas@hotmail.com`
   - **Password:** `senha123` (ou outra)
   - **Auto Confirm User:** ✅ Marque
4. Clique em **Create user**
5. **COPIE O UUID** do usuário criado

---

### **Vincular Usuário à Franqueada:**

**No SQL Editor do Supabase:**

```sql
UPDATE franqueadas 
SET user_id = 'UUID-COPIADO-AQUI',
    senha_definida = true
WHERE email = 'cjotarasteirinhas@hotmail.com';
```

---

### **Fazer Login:**

1. Acesse: **http://localhost:3001/franqueada/login**
2. Email: `cjotarasteirinhas@hotmail.com`
3. Senha: `senha123`
4. ✅ Deve entrar no dashboard!

---

## 📋 CHECKLIST RÁPIDO:

- [ ] Executar SQL de correção no Supabase
- [ ] Cadastrar novamente pelo site
- [ ] Aprovar como admin
- [ ] Criar usuário no Supabase Auth
- [ ] Vincular user_id com UPDATE
- [ ] Testar login

---

## ⏱️ Tempo total: **3-5 minutos**

**Comece pelo PASSO 1 agora!** 🚀
