# 🚀 Como Aplicar a Migração 006 - Sistema de Categorias

## ⚠️ IMPORTANTE
**Você PRECISA aplicar esta migração para que o sistema de categorias funcione!**

Sem a migração, você verá erros como:
- ❌ "Erro ao criar: {}"
- ❌ "Erro ao carregar produtos: {}"
- ❌ "Tabela de categorias não encontrada"

---

## 📋 Passo a Passo (5 minutos)

### **Passo 1: Acesse o Supabase Dashboard**
1. Abra seu navegador
2. Vá para: https://supabase.com/dashboard
3. Faça login (se necessário)
4. Selecione o projeto **c4-franquias-admin**

### **Passo 2: Abra o SQL Editor**
1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique no botão **New query** (ou **+ New query**)

### **Passo 3: Cole o SQL da Migração**
1. Abra o arquivo `migrations/006_COMPLETE_categorias_system.sql`
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. **Cole no SQL Editor** do Supabase (Ctrl+V)

### **Passo 4: Execute a Migração**
1. Clique no botão **Run** (ou pressione Ctrl+Enter)
2. Aguarde alguns segundos
3. Você verá a mensagem: **"Success. No rows returned"**

### **Passo 5: Verifique se Funcionou**
Execute esta query no SQL Editor para confirmar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('categorias', 'produto_categorias');
```

**Resultado esperado:**
```
categorias
produto_categorias
```

---

## ✅ Teste o Sistema

Depois de aplicar a migração:

1. Volte para o seu aplicativo: http://localhost:3001
2. Vá para **Produtos** no menu
3. Clique no botão **Gerenciar Categorias**
4. Tente criar uma categoria de teste
5. **Sucesso!** Agora deve funcionar! 🎉

---

## 🆘 Solução de Problemas

### Erro: "relation already exists"
**Não é problema!** Significa que a tabela já foi criada. Continue normalmente.

### Erro: "permission denied"
1. Verifique se você está logado no Supabase
2. Verifique se tem permissões de administrador no projeto
3. Tente fazer logout e login novamente

### Ainda vendo erros no aplicativo?
1. **Recarregue a página** do aplicativo (F5)
2. Abra o console do navegador (F12)
3. Verifique se ainda há erros
4. Se persistir, execute novamente a migração

### Verificar RLS (Row Level Security)
Se após a migração você consegue criar mas não consegue ver as categorias:

```sql
-- Verificar se as policies existem
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('categorias', 'produto_categorias');
```

Deve retornar 2 policies chamadas "Allow all for authenticated users".

---

## 📊 O Que Esta Migração Cria

### 1. Tabela `categorias`
```
id          | SERIAL PRIMARY KEY
nome        | TEXT NOT NULL
pai_id      | INTEGER (referência recursiva para subcategorias)
created_at  | TIMESTAMP
updated_at  | TIMESTAMP
```

### 2. Tabela `produto_categorias`
```
id           | SERIAL PRIMARY KEY
produto_id   | INTEGER (FK → produtos)
categoria_id | INTEGER (FK → categorias)
created_at   | TIMESTAMP
```

### 3. Índices para Performance
- `idx_categorias_pai_id` - Para buscar subcategorias
- `idx_categorias_nome` - Para buscar por nome
- `idx_produto_categorias_produto_id` - Para listar categorias de um produto
- `idx_produto_categorias_categoria_id` - Para listar produtos de uma categoria

### 4. Políticas RLS (Row Level Security)
- Permite todas as operações (SELECT, INSERT, UPDATE, DELETE) para usuários autenticados

### 5. Trigger
- Atualiza automaticamente o campo `updated_at` nas categorias

---

## 🎯 Próximos Passos

Após aplicar a migração com sucesso:

1. ✅ Criar suas primeiras categorias
2. ✅ Criar subcategorias dentro das categorias
3. ✅ Vincular produtos às categorias
4. ✅ Filtrar produtos por categoria
5. ✅ Editar e excluir categorias conforme necessário

---

## 📝 Notas Importantes

- **Backup:** O Supabase mantém backups automáticos, mas é sempre bom ter cuidado
- **Reversão:** Se precisar reverter, use as queries de verificação no final do arquivo SQL
- **Dados de Exemplo:** O SQL inclui dados de exemplo comentados. Descomente se quiser usá-los
- **Produção:** Execute primeiro em ambiente de desenvolvimento/teste

---

## 💡 Dica Pro

Salve a query no SQL Editor do Supabase com o nome **"Migration 006 - Categories"** para referência futura.

---

**Dúvidas?** Revise o arquivo `docs/MIGRATION_006_GUIDE.md` para mais detalhes técnicos.
