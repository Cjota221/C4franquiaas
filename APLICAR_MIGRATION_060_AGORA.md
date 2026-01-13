# 🚀 APLICAR MIGRATION 060 - GUIA DEFINITIVO

## ⚡ INSTRUÇÕES SIMPLES (2 minutos)

### **PASSO 1: Copiar a Migration**

1. Abra o arquivo: **`migrations/060_fix_delete_timeout_indices.sql`**
2. Selecione TODO o conteúdo (`Ctrl+A`)
3. Copie (`Ctrl+C`)

---

### **PASSO 2: Executar no Supabase**

1. Acesse **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Cole o código (`Ctrl+V`)
5. Clique em **RUN** (ou `Ctrl+Enter`)

---

### **PASSO 3: Aguardar Confirmação**

Você verá esta mensagem:

```
✅ Migration 060 aplicada com sucesso!
✅ 3 índices críticos criados
✅ Função excluir_produtos_completo atualizada
⏱️  Timeout aumentado para 120 segundos
📊 Limite de 10 produtos por exclusão
```

**Tempo:** ~30 segundos a 2 minutos

---

### **PASSO 4: Deploy da API**

```powershell
git add .
git commit -m "fix: corrigir timeout na exclusão de produtos"
git push origin main
```

---

### **PASSO 5: Testar**

1. Acesse **Painel Admin** → **Produtos**
2. Selecione **5-10 produtos**
3. Clique em **"Excluir Selecionados"**
4. **Esperado:** ✅ Exclusão concluída em 5-10 segundos

---

## ⚠️ PERGUNTAS COMUNS

### **P: Vai travar o sistema?**

R: Pode travar as tabelas por 10-30 segundos durante a criação dos índices. Se seu sistema tem muito tráfego, execute em horário de baixo uso.

### **P: E o arquivo CONCURRENTLY?**

R: **Ignore-o!** Ele não funciona no Supabase SQL Editor. Use apenas o arquivo `060_fix_delete_timeout_indices.sql`.

### **P: Como saber se funcionou?**

R: Execute no SQL Editor:

```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'reseller_products'
  AND indexname = 'idx_reseller_products_product_id';
```

Se retornar o nome do índice → **Funcionou!** ✅

---

## 🆘 SE DER ERRO

### **Erro: "relation produtos_excluidos does not exist"**

Execute primeiro a migration 059:

```sql
-- Criar tabela de produtos excluídos
CREATE TABLE IF NOT EXISTS produtos_excluidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_externo TEXT NOT NULL UNIQUE,
  excluido_em TIMESTAMPTZ DEFAULT NOW(),
  excluido_por TEXT DEFAULT 'admin'
);

CREATE INDEX IF NOT EXISTS idx_produtos_excluidos_id_externo
ON produtos_excluidos(id_externo);
```

Depois execute a migration 060 novamente.

---

### **Erro: "index already exists"**

Ótimo! Significa que o índice já foi criado. Pode prosseguir para o deploy da API.

---

## ✅ CHECKLIST FINAL

- [ ] Migration 060 executada com sucesso
- [ ] 3 índices criados (verificar com query acima)
- [ ] Deploy da API realizado
- [ ] Teste de exclusão funcionando
- [ ] Sem erros de timeout

---

**🎯 Arquivo correto:** `migrations/060_fix_delete_timeout_indices.sql`  
**❌ Arquivo para ignorar:** `060_fix_delete_timeout_indices_CONCURRENTLY.sql`  
**⏱️ Tempo total:** 3-5 minutos  
**✅ Dificuldade:** Muito fácil
