# 📚 Sistema de Categorias - Guia Completo

## 🎯 Visão Geral

Sistema completo de gerenciamento de categorias para produtos, permitindo:
- ✅ Criar categorias e subcategorias ilimitadas
- ✅ Vincular múltiplos produtos a categorias
- ✅ Filtrar produtos por categoria
- ✅ Busca instantânea sem paginação
- ✅ Interface moderna e intuitiva

---

## 🚀 Como Usar

### 1️⃣ Gerenciar Categorias

#### Criar Nova Categoria
1. Clique no botão **"📁 Gerenciar Categorias"**
2. Digite o nome da categoria no campo **"➕ Nova Categoria"**
3. Pressione **Enter** ou clique em **"Criar"**

**Exemplo:** "Eletrônicos", "Roupas", "Alimentos"

#### Criar Subcategoria
1. Na lista de categorias, clique no botão **"+ Sub"** da categoria pai
2. Digite o nome da subcategoria
3. Pressione **Enter** ou clique em **"Criar"**

**Exemplo:**
```
Eletrônicos
  └─ Smartphones
  └─ Notebooks
  └─ Acessórios
```

#### Editar Categoria
1. Clique no botão **"✎"** (lápis) ao lado da categoria
2. Edite o nome
3. Clique em **"✓"** para salvar ou **"✕"** para cancelar

#### Deletar Categoria
1. Clique no botão **"🗑"** (lixeira) ao lado da categoria
2. Confirme a exclusão
3. ⚠️ **ATENÇÃO:** Isso também remove todas as subcategorias!

---

### 2️⃣ Vincular Produtos a Categorias

#### Passo a Passo:
1. **Selecione os produtos** usando os checkboxes
2. Clique em **"🔗 Vincular/Desvincular (X)"**
3. Escolha o modo:
   - **➕ Vincular:** Adiciona produtos à categoria
   - **➖ Desvincular:** Remove produtos da categoria
4. Selecione a categoria no dropdown
5. Clique em **"Vincular"** ou **"Desvincular"**

**Exemplo de Uso:**
```
Cenário: Vincular 10 smartphones à categoria "Eletrônicos > Smartphones"

1. Busque "smartphone" na barra de busca
2. Selecione todos os produtos desejados
3. Clique em "🔗 Vincular/Desvincular (10)"
4. Escolha modo "➕ Vincular"
5. Selecione "Smartphones" no dropdown
6. Confirme
```

#### Dica: Seleção Múltipla
- Você pode selecionar produtos de diferentes páginas
- O contador mostra quantos produtos estão selecionados
- Use **"Limpar Seleção"** para desmarcar todos

---

### 3️⃣ Filtrar Produtos por Categoria

1. Use o dropdown **"🏷️ Todas as categorias"**
2. Selecione a categoria desejada
3. A lista é filtrada automaticamente

**Exemplo:**
- Selecione "Eletrônicos" → Mostra apenas produtos eletrônicos
- Selecione "Todas as categorias" → Mostra todos os produtos

---

### 4️⃣ Busca Inteligente

#### Como Funciona:
- **SEM busca:** Mostra 30 produtos por vez (paginação)
- **COM busca:** Mostra TODOS os resultados instantaneamente (sem paginação)

#### Exemplo:
```
Digite: "samsung"
Resultado: Todos os produtos com "samsung" no nome aparecem
           Sem necessidade de navegar páginas
```

#### O que você pode buscar:
- ✅ Nome do produto
- ✅ ID interno
- ✅ ID externo (FácilZap)

---

## 🎨 Interface Visual

### Indicadores de Status

| Cor | Significado |
|-----|-------------|
| 🟢 Verde | Produto ativo |
| 🔴 Vermelho | Produto inativo |
| 🔵 Azul | Produto selecionado (anel azul) |
| 🟣 Roxo | Badge de categoria |

### Botões e Ações

| Botão | Função |
|-------|--------|
| 📁 Gerenciar Categorias | Abre modal de categorias |
| 🔗 Vincular/Desvincular | Abre modal para vincular produtos |
| ⚡ Ações (X) | Menu de ações em massa |
| 👁️ Ver Detalhes | Abre modal com detalhes do produto |
| ✓ Ativo / ✕ Inativo | Toggle de status do produto |

---

## 💡 Casos de Uso

### Caso 1: Organizar Catálogo de Eletrônicos
```
1. Crie categorias:
   - Eletrônicos
     ├─ Smartphones
     ├─ Notebooks
     ├─ Tablets
     └─ Acessórios

2. Busque "smartphone"
3. Selecione todos os smartphones
4. Vincule à categoria "Smartphones"
5. Repita para outras categorias
```

### Caso 2: Promoção de Categoria Específica
```
1. Filtre por categoria "Smartphones"
2. Selecione todos os produtos exibidos
3. Use "⚡ Ações" → "✅ Ativar Selecionados"
4. Todos os smartphones ficam ativos
```

### Caso 3: Remover Produtos de Categoria
```
1. Filtre pela categoria desejada
2. Selecione produtos a remover
3. "🔗 Vincular/Desvincular"
4. Modo "➖ Desvincular"
5. Confirme
```

---

## ⚙️ Configurações Técnicas

### Estrutura do Banco de Dados

```sql
-- Tabela principal de categorias
categorias (
  id: integer PRIMARY KEY
  nome: text NOT NULL
  pai_id: integer (referencia categorias.id)
)

-- Tabela de junção (muitos-para-muitos)
produto_categorias (
  id: serial PRIMARY KEY
  produto_id: integer (referencia produtos.id)
  categoria_id: integer (referencia categorias.id)
  UNIQUE(produto_id, categoria_id)
)
```

### Relacionamentos
- Um produto pode ter múltiplas categorias
- Uma categoria pode ter múltiplos produtos
- Categorias podem ter subcategorias (hierarquia ilimitada)
- Ao deletar produto → remove vínculos automaticamente (CASCADE)
- Ao deletar categoria → remove vínculos automaticamente (CASCADE)

---

## 🐛 Problemas Comuns

### ❌ "Erro ao carregar categorias"
**Causa:** Tabela `categorias` não existe ou sem permissão
**Solução:** Verifique se a migração foi aplicada

### ❌ "Erro ao vincular produtos"
**Causa:** Tabela `produto_categorias` não existe
**Solução:** Execute a migração `006_add_produto_categorias.sql`

### ❌ Produtos não aparecem ao filtrar
**Causa:** Produtos não estão vinculados à categoria
**Solução:** Use "🔗 Vincular/Desvincular" para criar os vínculos

### ❌ Subcategoria não aparece no filtro
**Causa:** Apenas categorias principais aparecem no filtro
**Solução:** Isso é intencional. Vincule produtos à subcategoria desejada.

---

## 📊 Limitações e Restrições

| Item | Limite | Observação |
|------|--------|------------|
| Níveis de subcategorias | Ilimitado | Mas mantenha até 3-4 níveis para usabilidade |
| Categorias por produto | Ilimitado | Recomendado: 1-3 categorias principais |
| Produtos por categoria | Ilimitado | Performance testada até 10.000 produtos |
| Nome da categoria | 255 caracteres | Recomendado: 20-50 caracteres |

---

## 🔮 Próximas Melhorias (Roadmap)

- [ ] Importar/exportar categorias via CSV
- [ ] Ordenar categorias por drag-and-drop
- [ ] Cores personalizadas para categorias
- [ ] Ícones para categorias
- [ ] Filtro de múltiplas categorias
- [ ] Analytics por categoria
- [ ] Sugestão automática de categorias

---

## 📞 Suporte

Precisa de ajuda? Verifique:
1. Console do navegador (F12) para erros
2. Guia de migração: `docs/MIGRATION_006_GUIDE.md`
3. Logs do servidor Next.js

**Status:** ✅ Sistema totalmente funcional após aplicar migração 006

---

*Última atualização: 21 de outubro de 2025*
