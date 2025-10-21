# 🚀 Guia de Aplicação da Migração 006 - Sistema de Categorias

## ⚠️ IMPORTANTE: Execute esta migração antes de usar o novo sistema de categorias!

A migração cria a tabela `produto_categorias` necessária para vincular produtos a categorias.

## Opção 1: Executar via Dashboard do Supabase (RECOMENDADO)

1. **Acesse o Dashboard do Supabase:**
   - Vá para: https://supabase.com/dashboard
   - Entre no seu projeto

2. **Abra o SQL Editor:**
   - No menu lateral, clique em **SQL Editor**
   - Ou acesse: https://supabase.com/dashboard/project/_/editor

3. **Cole e execute o SQL:**
   - Copie todo o conteúdo do arquivo `migrations/006_add_produto_categorias.sql`
   - Cole no editor
   - Clique em **RUN** (ou Ctrl+Enter)

4. **Verifique o sucesso:**
   - Você deve ver: `Success. No rows returned`
   - Vá em **Table Editor** → Verifique se a tabela `produto_categorias` existe

## Opção 2: Executar via Script Node.js

```powershell
# No terminal do VS Code, execute:
node scripts/apply_migration_006.mjs
```

**Nota:** Se der erro, use a Opção 1 (mais confiável).

## Opção 3: Executar SQL Manualmente

Copie e execute o seguinte SQL no Dashboard do Supabase:

```sql
-- Create produto_categorias table
CREATE TABLE IF NOT EXISTS produto_categorias (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER NOT NULL,
  categoria_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(produto_id, categoria_id)
);

-- Add foreign key constraints
ALTER TABLE produto_categorias
  ADD CONSTRAINT fk_produto_categorias_produto
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE;

ALTER TABLE produto_categorias
  ADD CONSTRAINT fk_produto_categorias_categoria
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_produto_categorias_produto_id ON produto_categorias(produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_categorias_categoria_id ON produto_categorias(categoria_id);

-- Enable RLS
ALTER TABLE produto_categorias ENABLE ROW LEVEL SECURITY;

-- Allow all for authenticated users
CREATE POLICY "Allow all for authenticated users" ON produto_categorias
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## ✅ Verificar se a Migração Foi Aplicada

Execute este SQL no Dashboard:

```sql
SELECT COUNT(*) FROM produto_categorias;
```

Se retornar `0` sem erro = Migração aplicada com sucesso! ✅

## 🎯 Novo Sistema de Categorias

Após aplicar a migração, você terá:

### 1. **Gerenciar Categorias**
- Botão "📁 Gerenciar Categorias"
- Criar categorias principais
- Criar subcategorias de qualquer categoria
- Editar nomes de categorias
- Deletar categorias (remove subcategorias também)

### 2. **Vincular Produtos a Categorias**
- Selecione produtos (checkbox)
- Clique em "🔗 Vincular/Desvincular"
- Escolha: Vincular ou Desvincular
- Selecione a categoria
- Confirme

### 3. **Filtrar por Categoria**
- Dropdown "🏷️ Todas as categorias"
- Filtra produtos em tempo real

### 4. **Busca Melhorada**
- Digite o nome do produto
- Mostra TODOS os resultados instantaneamente
- Sem paginação durante a busca

## 🐛 Troubleshooting

### Erro: "relation produto_categorias does not exist"
**Solução:** A migração não foi aplicada. Execute novamente seguindo a Opção 1.

### Erro: "foreign key constraint violation"
**Solução:** Certifique-se que as tabelas `produtos` e `categorias` existem.

### Erro: "permission denied"
**Solução:** Use a SERVICE_ROLE_KEY, não a ANON_KEY.

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs no console do navegador (F12)
2. Verifique se as variáveis de ambiente estão corretas
3. Execute `SELECT * FROM categorias LIMIT 5;` para confirmar que a tabela existe

---

**Status da Migração:** 🟡 Pendente (Execute agora!)
**Arquivo:** `migrations/006_add_produto_categorias.sql`
**Data de Criação:** 21/10/2025
