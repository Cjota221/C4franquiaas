# 🚨 SOLUÇÃO: Produtos Excluídos no FácilZap Não Somem do Painel

## 📋 PROBLEMA DESCRITO

**Situação:**

1. ✅ Produtos foram **excluídos no FácilZap** (origem)
2. ❌ Produtos **NÃO somem do painel admin**
3. ❌ Sync **NÃO detecta** a exclusão automaticamente
4. ❌ Exclusão manual **NÃO funciona** (produtos voltam)

**Objetivo:**

- Sincronizar corretamente: **só produtos que existem no FácilZap**
- Permitir exclusão manual sem produtos voltarem

---

## 🔍 DIAGNÓSTICO

### ✅ Sistema TEM Detecção Automática

O código **JÁ TEM** a função `detectarProdutosExcluidos()` que:

- Compara produtos do FácilZap com o banco
- Detecta produtos que foram excluídos no FácilZap
- Exclui automaticamente do banco

**Porém NÃO está funcionando porque:**

- Migration 060 não foi aplicada
- RLS pode estar bloqueando DELETE
- Cron pode estar com erro

---

## ✅ SOLUÇÃO COMPLETA

### **PASSO 1: APLICAR MIGRATION 060** (CRÍTICO)

Esta migration:

- ✅ Cria tabela `produtos_excluidos`
- ✅ Adiciona índices (evita timeout)
- ✅ Atualiza função de exclusão
- ✅ Permite exclusão manual SEM produtos voltarem

**Como aplicar:**

1. Acesse Supabase → SQL Editor
2. Copie **TUDO** de: `migrations/060_fix_delete_timeout_indices.sql`
3. Cole e execute
4. Aguarde: "✅ MIGRATION 060 APLICADA COM SUCESSO"

---

### **PASSO 2: APLICAR MIGRATION 062** (RLS)

Esta migration:

- ✅ Corrige policies RLS
- ✅ Permite DELETE via service_role (usado no sync)
- ✅ Desbloqueia exclusão automática e manual

**Como aplicar:**

1. No mesmo SQL Editor
2. Copie **TUDO** de: `migrations/062_fix_rls_exclusao_produtos.sql`
3. Cole e execute
4. Aguarde: "✅ MIGRATION 062 APLICADA COM SUCESSO"

---

### **PASSO 3: FORÇAR SINCRONIZAÇÃO COMPLETA**

Após aplicar as migrations:

**Opção A - Pelo Painel Admin:**

1. Vá em: `/admin/produtos`
2. Clique no botão: **"Sincronizar FácilZap"** (no topo)
3. Aguarde processar (pode demorar 1-2 minutos)
4. Sistema vai:
   - ✅ Buscar TODOS os produtos do FácilZap
   - ✅ Detectar produtos que você excluiu lá
   - ✅ **EXCLUIR automaticamente** do painel admin
   - ✅ Manter apenas produtos que existem no FácilZap

**Opção B - Via API (se precisar):**

```bash
# Execute no terminal ou Postman
curl -X POST https://c4franquiaas.netlify.app/api/sync-produtos
```

---

### **PASSO 4: VERIFICAR LOGS** (Opcional)

Para confirmar que funcionou:

```sql
-- Execute no Supabase SQL Editor
SELECT
    tipo,
    descricao,
    payload,
    created_at
FROM logs_sincronizacao
WHERE tipo IN ('produtos_excluidos_facilzap', 'produto_atualizado')
ORDER BY created_at DESC
LIMIT 10;
```

Você deve ver logs tipo:

```
tipo: "produtos_excluidos_facilzap"
descricao: "X produtos DELETADOS do banco (não existem mais no FácilZap)"
```

---

## 🎯 RESULTADO ESPERADO

**Após seguir os 4 passos:**

✅ **Produtos excluídos no FácilZap são excluídos automaticamente no painel**

- Sync detecta produtos que não existem mais
- Remove do banco automaticamente
- Registra log da exclusão

✅ **Exclusão manual funciona**

- Admin pode excluir produtos manualmente
- Produtos NÃO voltam (bloqueados em `produtos_excluidos`)
- Sync respeita exclusões manuais

✅ **Banco fica "limpo"**

- Só produtos que existem no FácilZap
- Reduz espaço no banco
- Melhora performance

---

## 🔄 FLUXO CORRETO APÓS CORREÇÃO

### Exclusão Automática (FácilZap → Painel):

```
1. Produto excluído no FácilZap
   ↓
2. Cron roda (a cada 1 minuto)
   ↓
3. Sync busca produtos do FácilZap
   ↓
4. detectarProdutosExcluidos() compara:
   - Produtos no banco
   - Produtos no FácilZap
   ↓
5. Detecta produtos que não existem mais
   ↓
6. EXCLUI automaticamente do banco ✅
   ↓
7. Produto SOME do painel admin ✅
```

### Exclusão Manual (Painel → Permanente):

```
1. Admin exclui produto no painel
   ↓
2. Função excluir_produtos_completo():
   - INSERT INTO produtos_excluidos (id_externo)
   - DELETE FROM produtos
   ↓
3. Cron roda sincronização
   ↓
4. Sync busca produtos do FácilZap
   ↓
5. Verifica produtos_excluidos
   ↓
6. Produto está na lista de excluídos ✅
   ↓
7. Sync IGNORA e não re-insere ✅
   ↓
8. Produto NÃO volta ✅
```

---

## 📊 INFORMAÇÕES TÉCNICAS

**Arquivos Envolvidos:**

- `app/api/sync-produtos/route.ts` - Sync com FácilZap
- `netlify/functions/scheduled-sync.ts` - Cron (a cada 1 minuto)
- `migrations/060_fix_delete_timeout_indices.sql` - Tabela produtos_excluidos
- `migrations/062_fix_rls_exclusao_produtos.sql` - RLS policies

**Funções Críticas:**

- `detectarProdutosExcluidos()` - Detecta e exclui produtos
- `excluir_produtos_completo()` - Exclusão manual
- Sync automático - Roda a cada 1 minuto

**Tabelas:**

- `produtos` - Produtos principais
- `produtos_excluidos` - Lista de exclusões permanentes (criada na migration 060)
- `logs_sincronizacao` - Histórico de sincronizações

---

## ⚠️ IMPORTANTE

**Ordem de Execução:**

1. Migration 060 (PRIMEIRO)
2. Migration 062 (SEGUNDO)
3. Sincronização forçada (TERCEIRO)

**Não pule etapas!**

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após aplicar tudo, teste:

- [ ] Migration 060 aplicada sem erros
- [ ] Migration 062 aplicada sem erros
- [ ] Botão "Sincronizar FácilZap" executado
- [ ] Console mostra: "X produtos DELETADOS do banco"
- [ ] Produtos excluídos do FácilZap SUMIRAM do painel
- [ ] Exclusão manual funciona (teste com 1 produto)
- [ ] Produto excluído manualmente NÃO volta após 1-2 minutos
- [ ] Apenas produtos do FácilZap aparecem no painel

---

## 🆘 SE AINDA NÃO FUNCIONAR

Verifique:

1. **Cron está ativo no Netlify?**

   - Acesse: Netlify Dashboard → Functions → Scheduled Functions
   - Deve ter: `scheduled-sync` com status "Active"

2. **Token do FácilZap está correto?**

   - Verifique variável: `FACILZAP_TOKEN` no Netlify
   - Teste: Clique em "Sincronizar FácilZap" e veja se busca produtos

3. **RLS está bloqueando?**

   - Execute migration 062 novamente
   - Confirme policies no SQL:
     ```sql
     SELECT policyname, cmd FROM pg_policies
     WHERE tablename = 'reseller_products';
     ```

4. **Verifique logs de erro:**
   - Netlify Functions → View logs
   - Procure por: "Erro em detectarProdutosExcluidos"

---

## 🎉 PRONTO!

Após seguir todos os passos, seu painel estará sincronizado corretamente com o FácilZap!
