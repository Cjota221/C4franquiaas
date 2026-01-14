# 🔍 DIAGNÓSTICO: POR QUE PRODUTOS NÃO ESTÃO SENDO EXCLUÍDOS?

## 🎯 HIPÓTESES PRINCIPAIS

### ❌ HIPÓTESE #1: Migrations NÃO foram aplicadas

**Causa mais provável:** As migrations 060, 061, 062 que você criou **NÃO foram executadas no Supabase**.

**Como verificar:**

1. Abra Supabase SQL Editor
2. Execute:

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'excluir_produtos_completo';
```

3. **Se retornar 0 linhas** → A função NÃO EXISTE!

**Solução:**

- Abra `migrations/060_fix_delete_timeout_indices.sql`
- Copie TODO o conteúdo
- Cole no Supabase SQL Editor
- Execute (Shift + Enter)
- Repita para migrations 061 e 062

---

### ❌ HIPÓTESE #2: RLS está bloqueando DELETE

**Causa:** Mesmo com migration 062, pode haver conflito de policies.

**Como verificar:**
Execute no Supabase:

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'produtos' AND cmd = 'DELETE';
```

**Se retornar 0 linhas** → NÃO HÁ POLICY PARA DELETE!

**Solução:**
Execute migration 062 completa.

---

### ❌ HIPÓTESE #3: Tabela produtos NÃO tem RLS

**Causa:** RLS precisa estar habilitado para policies funcionarem.

**Como verificar:**

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'produtos';
```

**Se rowsecurity = false** → RLS DESABILITADO!

**Solução:**

```sql
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
```

---

### ❌ HIPÓTESE #4: Função tem erro de sintaxe

**Causa:** Função foi criada mas tem bug.

**Como verificar:**

1. Execute no Supabase:

```sql
SELECT excluir_produtos_completo(ARRAY['uuid-qualquer']::UUID[]);
```

2. Se der erro → copie mensagem COMPLETA do erro

**Erros comuns:**

- `function does not exist` → Migration 060 não foi aplicada
- `permission denied` → Migration 062 não foi aplicada
- `relation does not exist` → Alguma tabela não existe

---

### ❌ HIPÓTESE #5: SERVICE_ROLE_KEY incorreta

**Causa:** API usa `process.env.SUPABASE_SERVICE_ROLE_KEY` que pode estar errada.

**Como verificar:**

1. Abra `.env.local`
2. Verifique se `SUPABASE_SERVICE_ROLE_KEY` existe
3. Compare com Supabase Dashboard → Project Settings → API → service_role key

**Solução:**

- Copie a key correta do Supabase
- Cole em `.env.local`
- Reinicie o servidor: `npm run dev`

---

## 🧪 ROTEIRO DE TESTES

### Teste 1: Função existe?

```sql
-- No Supabase SQL Editor:
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'excluir_produtos_completo';
```

**Resultado esperado:** 1 linha
**Se 0 linhas:** Aplique migration 060

### Teste 2: Policies existem?

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('produtos', 'reseller_products', 'produto_categorias')
  AND cmd = 'DELETE';
```

**Resultado esperado:** Pelo menos 3 policies
**Se 0:** Aplique migration 062

### Teste 3: DELETE direto funciona?

```sql
-- Buscar um produto inativo
SELECT id, nome FROM produtos WHERE ativo = false LIMIT 1;

-- Tentar deletar (SUBSTITUA o UUID)
DELETE FROM produtos WHERE id = 'UUID_AQUI';
```

**Resultado esperado:** Success
**Se erro:** RLS está bloqueando

### Teste 4: Função funciona?

```sql
-- SUBSTITUA o UUID
SELECT excluir_produtos_completo(ARRAY['UUID_AQUI']::UUID[]);
```

**Resultado esperado:** `{"success": true, "total_excluidos": 1}`
**Se erro:** Copie mensagem COMPLETA do erro

### Teste 5: API funciona?

1. Abra DevTools do navegador (F12)
2. Vá em Admin → Produtos
3. Selecione 1 produto
4. Clique em "Excluir Selecionados"
5. Veja console.log

**Logs esperados:**

```
🗑️ [CLIENTE] INICIANDO EXCLUSÃO
📡 Enviando requisição para API...
📥 Resposta recebida - Status: 200
✅ [CLIENTE] 1 produto(s) excluído(s)
```

**Se ver erro:** Copie mensagem COMPLETA

---

## 🚨 AÇÃO IMEDIATA

**Execute AGORA no Supabase SQL Editor:**

```sql
-- Arquivo: DIAGNOSTICO_EXCLUSAO_COMPLETO.sql
-- (copie TODO o conteúdo do arquivo)
```

Depois me envie os resultados de:

1. Query #1 (função existe?)
2. Query #4 (policies de DELETE?)
3. Query #6 (DELETE direto funciona?)

Com essas 3 respostas, eu consigo identificar EXATAMENTE o problema.

---

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] Migration 060 aplicada? (função excluir_produtos_completo existe?)
- [ ] Migration 061 aplicada? (trigger_sincronizar_estoque_variacoes existe?)
- [ ] Migration 062 aplicada? (policies de DELETE existem?)
- [ ] RLS habilitado na tabela produtos?
- [ ] SERVICE_ROLE_KEY correta no .env.local?
- [ ] Servidor reiniciado após alterar .env?
- [ ] Netlify tem as variáveis de ambiente?

---

## 🆘 SE NADA FUNCIONAR

Execute este comando SQL que aplica TUDO de uma vez:

```sql
-- Este é um "super-comando" que aplica migrations 060, 061, 062
-- Use APENAS se as migrations individuais não funcionarem

-- (enviou arquivos SQL separados para executar)
```

---

**PRÓXIMO PASSO:** Execute `DIAGNOSTICO_EXCLUSAO_COMPLETO.sql` e me envie os resultados.
