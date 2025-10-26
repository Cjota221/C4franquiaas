# 🔧 CORREÇÃO URGENTE - Adicionar Coluna 'imagem' em Categorias

## 🎯 Problema Identificado

O erro que você está vendo:
```
Could not find the 'imagem' column of 'categorias' in the schema cache
```

**Causa**: A tabela `categorias` no Supabase **não tem a coluna `imagem`**.

---

## ✅ Solução: Execute este SQL no Supabase

### 📋 Passo a Passo

1. **Acesse o Supabase Dashboard**
   - [https://supabase.com/dashboard](https://supabase.com/dashboard)

2. **Vá para SQL Editor**
   - No menu lateral: **SQL Editor**
   - Clique em **+ New query**

3. **Cole e Execute este SQL:**

```sql
-- Adicionar coluna 'imagem' na tabela categorias
ALTER TABLE categorias
ADD COLUMN IF NOT EXISTS imagem TEXT;

-- Verificar se foi adicionado (deve retornar 1 linha)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'categorias'
  AND column_name = 'imagem';
```

4. **Clique em RUN** (ou pressione `Ctrl + Enter`)

5. **Resultado Esperado:**
```
| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| imagem      | text      | YES         |
```

---

## 🔄 Depois de Executar

1. **Recarregue a página de admin** (`Ctrl + F5`)
2. **Tente fazer upload de imagem** novamente
3. **Agora deve funcionar!** ✅

---

## 📝 Próximos Passos (depois de corrigir)

Você ainda precisa:
- ✅ **FEITO**: Coluna `imagem` adicionada
- ⏳ **PENDENTE**: Configurar bucket `categorias` no Supabase Storage
  - Siga o guia: `docs/CONFIGURAR_STORAGE_CATEGORIAS.md`

---

## 🆘 Se der erro

**Erro: "permission denied"**
- Você precisa ter permissões de admin no Supabase

**Erro: "relation 'categorias' does not exist"**
- A tabela categorias não existe, me avise!

**Coluna já existe**
- Tudo bem! Significa que já foi adicionada
- Pode continuar normalmente

---

📅 **Criado**: 26/10/2025  
🐛 **Problema**: Coluna 'imagem' não existia na tabela categorias
