# 📝 Cadastro de Revendedoras - Implementado!

## ✅ O que foi criado:

### 1. Página de Cadastro
**URL:** `/cadastro/revendedora`

A revendedora preenche:
- Nome Completo
- Email
- Telefone (com máscara)
- CPF (com máscara)
- Nome da Loja
- Cidade
- Estado (UF)
- Senha
- Confirmação de Senha

### 2. API de Cadastro
**Endpoint:** `POST /api/cadastro/revendedora`

O que a API faz:
1. Valida todos os campos
2. Verifica se email já existe
3. Gera um slug único para a loja (ex: "beleza-da-maria")
4. Cria usuário no Supabase Auth (com email confirmado)
5. Insere na tabela `resellers` com status `pendente`
6. Se falhar, desfaz a criação do usuário Auth

### 3. Migration 034
**Arquivo:** `migrations/034_add_reseller_fields.sql`

Adiciona campos que faltavam na tabela:
- `cpf` - CPF da revendedora
- `city` - Cidade
- `state` - Estado (UF)

---

## 🚀 COMO ATIVAR

### Passo 1: Aplicar a Migration no Supabase

Vá em **Supabase → SQL Editor** e execute:

```sql
-- Migration 034: Campos extras para cadastro de Revendedoras
ALTER TABLE resellers 
  ADD COLUMN IF NOT EXISTS cpf VARCHAR(14),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(2);

CREATE INDEX IF NOT EXISTS idx_resellers_city_state ON resellers(city, state);

-- Permite cadastro público
DROP POLICY IF EXISTS "Cadastro publico de revendedoras" ON resellers;
CREATE POLICY "Cadastro publico de revendedoras" 
  ON resellers FOR INSERT 
  WITH CHECK (true);

-- ✅ Pronto!
SELECT 'Migration 034 aplicada!' as status;
```

### Passo 2: Testar Localmente

1. Acesse: http://localhost:3000/cadastro/revendedora
2. Preencha o formulário com dados de teste
3. Após cadastrar, verifique no Supabase se o registro foi criado

### Passo 3: Aprovar Revendedora

Acesse: http://localhost:3000/admin/revendedoras

Lá você verá as revendedoras pendentes e pode:
- ✅ **Aprovar** - Libera acesso ao painel
- ❌ **Rejeitar** - Com motivo opcional

---

## 🔄 Fluxo Completo

```
1. Revendedora acessa /cadastro/revendedora
2. Preenche formulário e cria senha
3. Sistema cria conta no Supabase Auth
4. Sistema insere registro com status = 'pendente'
5. Revendedora vê mensagem de "Aguardando aprovação"

6. Admin acessa /admin/revendedoras
7. Vê revendedora na lista de pendentes
8. Clica em "Aprovar"
9. Sistema atualiza status = 'aprovada'

10. Revendedora faz login em /login/revendedora
11. Sistema verifica status = 'aprovada'
12. Revendedora acessa o painel
```

---

## 📱 Links Úteis

- **Cadastro:** http://localhost:3000/cadastro/revendedora
- **Login:** http://localhost:3000/login/revendedora
- **Admin (aprovar):** http://localhost:3000/admin/revendedoras

---

## ⚠️ Importante

A migration 033 (status e user_id) precisa estar aplicada antes da 034.

Se ainda não aplicou, execute primeiro:

```sql
-- Migration 033 (se ainda não aplicou)
ALTER TABLE resellers 
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

UPDATE resellers SET status = 'aprovada' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_resellers_status ON resellers(status);
CREATE INDEX IF NOT EXISTS idx_resellers_user_id ON resellers(user_id);
```
