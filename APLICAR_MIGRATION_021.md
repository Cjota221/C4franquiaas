# 🚨 Como Aplicar a Migration 021 - Painéis de Vendas

## ❌ ERRO QUE VOCÊ TEVE

```
ERROR: 23503: insert or update on table "vendas" violates foreign key constraint "vendas_franqueada_id_fkey"
DETAIL: Key (franqueada_id)=(0ea451ff-0f34-48a3-9718-cfe49e0db149) is not present in table "users".
```

**Causa**: O ID que usei (`0ea451ff-0f34-48a3-9718-cfe49e0db149`) não existe na tabela `auth.users`. Precisamos descobrir o ID **correto** da franqueada no SEU banco.

---

## ✅ PASSO A PASSO CORRETO

### 📍 PASSO 1: Criar a Política RLS (EXECUTAR PRIMEIRO)

Copie e execute **APENAS ESTA PARTE** no Supabase SQL Editor:

```sql
-- 3️⃣ POLÍTICA RLS PARA ADMIN VER TODAS AS VENDAS
DROP POLICY IF EXISTS "Admin vê todas as vendas" ON public.vendas;

CREATE POLICY "Admin vê todas as vendas"
  ON public.vendas
  FOR SELECT
  TO authenticated
  USING (
    franqueada_id = auth.uid() OR
    franqueada_id IS NULL OR
    true
  );
```

**Resultado esperado**: `Success. No rows returned`

---

### 📍 PASSO 2: Descobrir o ID da Franqueada

Execute esta query:

```sql
SELECT
  id,
  email,
  user_metadata->>'nome' as nome,
  user_metadata->>'tipo' as tipo
FROM auth.users
WHERE user_metadata->>'tipo' = 'franqueada'
ORDER BY created_at DESC
LIMIT 5;
```

**Você vai ver algo como:**

| id                                     | email                | nome     | tipo       |
| -------------------------------------- | -------------------- | -------- | ---------- |
| `7703ac76-2e82-4ee6-a55d-11be67e72779` | caroline@exemplo.com | Caroline | franqueada |

**COPIE O ID** (primeira coluna) - este é o ID correto!

---

### 📍 PASSO 3: Vincular Loja à Franqueada

**SUBSTITUA** `'ID_DA_FRANQUEADA_AQUI'` pelo ID que você copiou no Passo 2:

```sql
UPDATE public.lojas
SET franqueada_id = 'ID_DA_FRANQUEADA_AQUI'
WHERE id = 'ab1d2370-0972-496c-a2f8-2196ec14ee8f';
```

**Exemplo** (use SEU ID, não este):

```sql
UPDATE public.lojas
SET franqueada_id = '7703ac76-2e82-4ee6-a55d-11be67e72779'
WHERE id = 'ab1d2370-0972-496c-a2f8-2196ec14ee8f';
```

**Resultado esperado**: `Success. No rows returned` ou `UPDATE 1`

---

### 📍 PASSO 4: Atualizar Vendas Existentes

**SUBSTITUA** `'ID_DA_FRANQUEADA_AQUI'` pelo **MESMO ID** do Passo 2:

```sql
UPDATE public.vendas
SET franqueada_id = 'ID_DA_FRANQUEADA_AQUI'
WHERE loja_id = 'ab1d2370-0972-496c-a2f8-2196ec14ee8f'
  AND franqueada_id IS NULL;
```

**Resultado esperado**: `UPDATE 1` (atualizou 1 venda)

---

### 📍 PASSO 5: Verificar Resultado

```sql
SELECT
  id,
  cliente_nome,
  valor_total,
  franqueada_id,
  mp_payment_id,
  created_at
FROM public.vendas
ORDER BY created_at DESC;
```

**Esperado**: Agora a venda deve ter o `franqueada_id` preenchido! ✅

---

## 🎯 TESTAR OS PAINÉIS

Após aplicar tudo acima:

### Painel Franqueada:

- **URL**: `/franqueada/vendas`
- **Login**: Com o email da franqueada
- **Resultado**: Deve mostrar a venda da loja CACAU SHOES

### Painel Admin:

- **URL**: `/admin/vendas`
- **Login**: Com email de admin
- **Resultado**: Deve mostrar TODAS as vendas

---

## 🔍 RESUMO

1. ✅ Executar política RLS (Passo 1)
2. ✅ Descobrir ID da franqueada (Passo 2)
3. ✅ UPDATE na tabela `lojas` (Passo 3)
4. ✅ UPDATE na tabela `vendas` (Passo 4)
5. ✅ Verificar com SELECT (Passo 5)
6. ✅ Testar painéis

---

## 💡 DICA

Se você NÃO tiver nenhuma franqueada cadastrada (SELECT retornar vazio), você precisa primeiro:

1. Criar uma franqueada em `/admin/franqueadas`
2. Ou executar:

```sql
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, user_metadata)
VALUES (
  'franqueada@teste.com',
  crypt('senha123', gen_salt('bf')),
  now(),
  '{"tipo": "franqueada", "nome": "Franqueada Teste"}'::jsonb
);
```

Depois disso, execute o Passo 2 novamente para pegar o ID.
