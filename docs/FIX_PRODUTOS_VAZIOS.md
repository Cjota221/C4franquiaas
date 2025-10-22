# 🔧 PROBLEMA: Produtos não aparecem para a franqueada

## 🎯 Causa Identificada

O console mostra:
```
[produtos] Vinculações encontradas: 0
[produtos] Nenhum produto vinculado
```

**Problema:** Quando o admin aprovou a franqueada, houve erro ao vincular os produtos automaticamente.

**Erro no servidor:**
```
null value in column "id" of relation "produtos_franqueadas" violates not-null constraint
```

A tabela `produtos_franqueadas` não está gerando UUID automaticamente para o campo `id`.

---

## ✅ SOLUÇÃO - 3 Passos

### Passo 1: Aplicar Migration 011

**No Supabase Dashboard:**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral esquerdo)
4. Clique em **New Query**
5. Cole este código:

```sql
-- Migration 011: Fix produtos_franqueadas ID generation
BEGIN;

ALTER TABLE produtos_franqueadas 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

COMMIT;
```

6. Clique em **Run** (ou F5)
7. Deve aparecer: "Success. No rows returned"

---

### Passo 2: Reprovar e Aprovar Novamente

**No painel admin:**

1. Acesse: http://localhost:3001/admin/franqueadas
2. Encontre a franqueada "Teste Caroline" (ou a que você criou)
3. Se ela estiver aprovada:
   - Clique no botão **"✕ Reprovar"**
   - Aguarde confirmação
4. Agora ela deve estar com status "Rejeitada"
5. Clique no botão **"✓ Aprovar"** novamente
6. Aguarde confirmação
7. Veja no console do servidor: deve aparecer:
   ```
   [api/admin/franqueadas/action] X produtos vinculados à franqueada
   ```

---

### Passo 3: Verificar Produtos

**No painel da franqueada:**

1. Acesse: http://localhost:3001/franqueada/produtos
2. Recarregue a página (F5)
3. Abra o console (F12)
4. Deve mostrar:
   ```
   [produtos] Vinculações encontradas: X
   [produtos] Produtos formatados: X
   ```
5. Os produtos devem aparecer na tela!

---

## 🔍 Verificação Manual (Opcional)

Se ainda não funcionar, vamos verificar diretamente no banco:

**No Supabase SQL Editor:**

```sql
-- Ver se a franqueada existe
SELECT id, nome, email, status, user_id 
FROM franqueadas 
WHERE email = 'teste@gmail.com';

-- Ver produtos ativos no sistema
SELECT id, nome, ativo 
FROM produtos 
WHERE ativo = true;

-- Ver vinculações da franqueada (use o ID dela acima)
SELECT * 
FROM produtos_franqueadas 
WHERE franqueada_id = 'ID_DA_FRANQUEADA_AQUI';
```

---

## ⚡ Solução Rápida Alternativa

Se não quiser reprovar/aprovar, pode vincular manualmente:

**No Supabase SQL Editor:**

```sql
-- Vincular TODOS os produtos ativos à franqueada
INSERT INTO produtos_franqueadas (id, produto_id, franqueada_id, ativo, vinculado_em)
SELECT 
  gen_random_uuid() as id,
  p.id as produto_id,
  'ID_DA_FRANQUEADA_AQUI' as franqueada_id,
  true as ativo,
  now() as vinculado_em
FROM produtos p
WHERE p.ativo = true
ON CONFLICT (produto_id, franqueada_id) DO NOTHING;
```

Substitua `ID_DA_FRANQUEADA_AQUI` pelo ID real da franqueada.

---

## 📊 Como Saber se Funcionou

Após aplicar a migration e reprovar/aprovar:

**No servidor (terminal):**
```
[api/admin/franqueadas/action] X produtos vinculados à franqueada
```

**No console do navegador:**
```
[produtos] Vinculações encontradas: X  (X > 0)
[produtos] Produtos formatados: X
```

**Na tela:**
- Produtos aparecem com cards
- Estatísticas mostram números corretos
- Pode selecionar e ajustar preços

---

## ❓ Se Ainda Não Funcionar

Me diga:

1. **Aplicou a migration?** (Sim/Não)
2. **O que apareceu no servidor** ao reprovar/aprovar?
3. **O que mostra o console** após recarregar /franqueada/produtos?
4. **Quantos produtos ativos** existem no sistema?

---

Última atualização: 21 de outubro de 2025
