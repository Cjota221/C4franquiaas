# 🎯 Sistema de Franqueadas e Vinculação Automática de Produtos

## ✅ Implementação Completa

Todo o sistema de gerenciamento de franqueadas e vinculação automática de produtos foi implementado com sucesso!

---

## 📋 O Que Foi Implementado

### 1. **Página de Franqueadas** (`/admin/franqueadas`)

Página completa para gerenciar franqueadas que se cadastraram no sistema:

- ✅ **Listagem de franqueadas** com filtros por status (Todos/Pendentes/Aprovadas/Rejeitadas)
- ✅ **Busca** por nome ou email
- ✅ **Estatísticas visuais** mostrando quantidade de cada status
- ✅ **Aprovação de franqueadas** com vinculação automática de produtos ativos
- ✅ **Rejeição de franqueadas** com campo de observação opcional
- ✅ **Cards informativos** mostrando dados completos de cada franqueada
- ✅ **Feedback visual** com mensagens de sucesso/erro

**Dados exibidos por franqueada:**
- Nome, Email, Telefone, CPF
- Cidade e Estado
- Status (Pendente/Aprovada/Rejeitada)
- Data de cadastro
- Data de aprovação (se aprovada)
- Observações (se rejeitada)

---

### 2. **Aba de Produtos em Franqueados** (`/admin/franqueados`)

Adicionada nova aba "📦 Produtos" na página de franqueados:

- ✅ **Sistema de abas** (Informações | Produtos)
- ✅ **Listagem de produtos vinculados** à franqueada selecionada
- ✅ **Informações do produto:**
  - Imagem (otimizada com Next.js Image)
  - Nome
  - Preço
  - Status (Ativo/Inativo)
  - Data de vinculação
- ✅ **Estado de loading** durante carregamento
- ✅ **Mensagem informativa** quando não há produtos vinculados

---

### 3. **Vinculação Automática de Produtos**

Sistema inteligente que gerencia automaticamente a vinculação de produtos:

#### **Ao Aprovar uma Franqueada:**
1. Status da franqueada muda para "aprovada"
2. **TODOS os produtos ativos** são automaticamente vinculados ao catálogo da franqueada
3. Registros criados na tabela `produtos_franqueadas`
4. Log detalhado no console

#### **Ao Ativar Produtos em Batch:**
1. Produtos são ativados na tabela `produtos`
2. Sistema busca **todas as franqueadas aprovadas**
3. **Vincula automaticamente** os produtos a todas elas
4. Log mostra quantidade de vinculações criadas

#### **Ao Desativar Produtos em Batch:**
1. Produtos são desativados na tabela `produtos`
2. Sistema **desvincula automaticamente** de todas as franqueadas
3. Marca como `ativo: false` e registra data de desvinculação
4. Log confirma operação

---

## 🗄️ Estrutura do Banco de Dados

### **Migração 007** (`migrations/007_add_franqueadas_system.sql`)

Cria duas novas tabelas:

#### **Tabela: `franqueadas`**
```sql
id                UUID PRIMARY KEY
nome              VARCHAR(255) NOT NULL
email             VARCHAR(255) UNIQUE NOT NULL
telefone          VARCHAR(20)
cpf               VARCHAR(14)
cidade            VARCHAR(100)
estado            VARCHAR(2)
status            VARCHAR(20) DEFAULT 'pendente' 
                  CHECK (status IN ('pendente', 'aprovada', 'rejeitada'))
criado_em         TIMESTAMP DEFAULT NOW()
aprovado_em       TIMESTAMP
aprovado_por      UUID
observacoes       TEXT
```

**Índices:**
- `idx_franqueadas_status` - Para filtros por status
- `idx_franqueadas_email` - Para busca e unicidade
- `idx_franqueadas_criado_em` - Para ordenação

---

#### **Tabela: `produtos_franqueadas`** (Junction Table)
```sql
id                UUID PRIMARY KEY
produto_id        INTEGER NOT NULL REFERENCES produtos(id)
franqueada_id     UUID NOT NULL REFERENCES franqueadas(id)
ativo             BOOLEAN DEFAULT true
vinculado_em      TIMESTAMP DEFAULT NOW()
desvinculado_em   TIMESTAMP
UNIQUE(produto_id, franqueada_id)
```

**Índices:**
- `idx_produtos_franqueadas_produto` - Para buscar franqueadas de um produto
- `idx_produtos_franqueadas_franqueada` - Para buscar produtos de uma franqueada
- `idx_produtos_franqueadas_ativo` - Para filtrar ativos
- `idx_produtos_franqueadas_composite` - Para consultas combinadas

**Políticas RLS:**
- Ambas as tabelas têm política "Allow all for authenticated users"

---

## 🚀 APIs Criadas

### **1. Listar Franqueadas**
```
GET /api/admin/franqueadas/list?status={todos|pendente|aprovada|rejeitada}
```

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "nome": "Franquia São Paulo",
      "email": "sp@franquia.com",
      "telefone": "(11) 98765-4321",
      "cpf": "123.456.789-00",
      "cidade": "São Paulo",
      "estado": "SP",
      "status": "pendente",
      "criado_em": "2025-10-21T10:00:00Z",
      "aprovado_em": null,
      "observacoes": null
    }
  ]
}
```

---

### **2. Ações em Franqueadas**
```
POST /api/admin/franqueadas/action
```

**Body (Aprovar):**
```json
{
  "action": "aprovar",
  "franqueada_id": "uuid"
}
```

**Body (Rejeitar):**
```json
{
  "action": "rejeitar",
  "franqueada_id": "uuid",
  "observacoes": "Motivo da rejeição"
}
```

**O que acontece ao aprovar:**
1. Atualiza `status` para "aprovada"
2. Define `aprovado_em` com timestamp atual
3. Busca todos os produtos ativos
4. Cria vinculações em `produtos_franqueadas`
5. Retorna sucesso

---

### **3. Listar Produtos de uma Franqueada**
```
GET /api/admin/franqueados/{franqueada_id}/produtos
```

**Resposta:**
```json
{
  "data": [
    {
      "id": 123,
      "nome": "Produto Exemplo",
      "preco_base": 99.90,
      "imagem": "https://...",
      "ativo": true,
      "vinculado_em": "2025-10-21T10:00:00Z"
    }
  ]
}
```

---

### **4. Batch de Produtos (MODIFICADO)**
```
PATCH /api/produtos/batch
```

**Body:**
```json
{
  "ids": [123, 456, 789],
  "ativo": true
}
```

**Lógica adicional implementada:**
- Se `ativo: true` → Vincula a todas as franqueadas aprovadas
- Se `ativo: false` → Desvincula de todas as franqueadas
- Logs detalhados de cada operação

---

## 📱 Interface do Usuário

### **Cores Utilizadas (Padrão Tailwind)**
- **Amarelo:** `bg-yellow-50`, `text-yellow-700`, `border-yellow-300` (Pendentes)
- **Verde:** `bg-green-50`, `text-green-700`, `border-green-300` (Aprovadas/Ativo)
- **Vermelho:** `bg-red-50`, `text-red-700`, `border-red-300` (Rejeitadas/Inativo)
- **Índigo:** `bg-indigo-600`, `text-indigo-600` (Botões primários, abas ativas)
- **Cinza:** `bg-gray-50`, `text-gray-600`, `border-gray-300` (Neutro)

### **Componentes Responsivos**
- Grid adaptativo: `grid-cols-1 md:grid-cols-3`
- Cards com hover: `hover:shadow-md transition`
- Botões com estados: `hover:bg-green-700 transition`
- Modal lateral: `w-full md:w-2/5`

---

## 🔄 Fluxo Completo do Sistema

### **Cenário 1: Nova Franqueada se Cadastra**

1. ✅ Franqueada preenche formulário no site
2. ✅ Registro criado com `status: 'pendente'`
3. ✅ Admin vê na página `/admin/franqueadas`
4. ✅ Admin clica em "✓ Aprovar"
5. ✅ Status muda para "aprovada"
6. ✅ **TODOS os 50 produtos ativos** são vinculados automaticamente
7. ✅ Franqueada pode ver catálogo completo

---

### **Cenário 2: Admin Ativa Novos Produtos**

1. ✅ Admin seleciona 10 produtos inativos
2. ✅ Clica em "Ativar Selecionados"
3. ✅ Sistema busca **todas as 25 franqueadas aprovadas**
4. ✅ Cria **250 vinculações** (10 produtos × 25 franqueadas)
5. ✅ Log: "✓ 250 vinculações criadas (10 produtos × 25 franqueadas)"
6. ✅ Todas as franqueadas veem os novos produtos instantaneamente

---

### **Cenário 3: Admin Desativa Produtos**

1. ✅ Admin seleciona 5 produtos ativos
2. ✅ Clica em "Desativar Selecionados"
3. ✅ Produtos são desativados
4. ✅ Sistema **desvincula de todas as franqueadas**
5. ✅ Campo `ativo: false` e `desvinculado_em` preenchidos
6. ✅ Produtos somem do catálogo de todas as franqueadas

---

### **Cenário 4: Admin Consulta Produtos de uma Franqueada**

1. ✅ Admin vai em `/admin/franqueados`
2. ✅ Clica em "Ver Detalhes" de uma franqueada
3. ✅ Modal lateral abre
4. ✅ Clica na aba "📦 Produtos"
5. ✅ Sistema carrega produtos vinculados via API
6. ✅ Mostra lista com imagens, preços e status
7. ✅ Exibe data de vinculação de cada produto

---

## 🧪 Como Testar

### **Passo 1: Aplicar Migração 007**

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie todo o conteúdo de `migrations/007_add_franqueadas_system.sql`
4. Cole e execute (Run)
5. Verifique se as tabelas foram criadas:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('franqueadas', 'produtos_franqueadas');
```

---

### **Passo 2: Inserir Franqueadas de Teste**

Execute no SQL Editor:
```sql
INSERT INTO franqueadas (nome, email, telefone, cpf, cidade, estado, status) VALUES
  ('Franquia São Paulo', 'sp@teste.com', '(11) 98765-4321', '123.456.789-00', 'São Paulo', 'SP', 'pendente'),
  ('Franquia Rio de Janeiro', 'rj@teste.com', '(21) 98765-4321', '234.567.890-11', 'Rio de Janeiro', 'RJ', 'pendente'),
  ('Franquia Aprovada', 'aprovada@teste.com', '(31) 98765-4321', '345.678.901-22', 'Belo Horizonte', 'MG', 'aprovada');
```

---

### **Passo 3: Testar Aprovação**

1. Acesse `http://localhost:3001/admin/franqueadas`
2. Veja as franqueadas pendentes
3. Clique em "✓ Aprovar" em uma delas
4. Confirme no modal
5. Veja o status mudar para "aprovada"
6. Abra o console do navegador (F12)
7. Verifique logs de vinculação de produtos

---

### **Passo 4: Testar Visualização de Produtos**

1. Vá em `/admin/franqueados`
2. Clique em "Ver Detalhes" de uma franqueada
3. Clique na aba "📦 Produtos"
4. Veja lista de produtos vinculados
5. Verifique imagens, preços e datas

---

### **Passo 5: Testar Vinculação Automática**

1. Vá em `/admin/produtos`
2. Selecione alguns produtos inativos
3. Clique em "Ativar Selecionados"
4. Abra o console do servidor (terminal onde rodou `npm run dev`)
5. Veja log: `[produtos/batch] ✓ X vinculações criadas`
6. Volte em `/admin/franqueados`
7. Clique em uma franqueada na aba Produtos
8. Veja os novos produtos vinculados

---

## 📊 Logs do Sistema

O sistema gera logs detalhados para debug:

### **Console do Servidor:**
```
[api/admin/franqueadas/list] 3 franqueadas carregadas (filtro: pendente)
[api/admin/franqueadas/action] Ação: aprovar | Franqueada: uuid-123
[api/admin/franqueadas/action] ✓ 50 produtos vinculados à franqueada
[produtos/batch] Iniciando vinculação automática para 10 produtos (ativo: true)
[produtos/batch] ✓ 250 vinculações criadas (10 produtos × 25 franqueadas)
[api/admin/franqueados/:id/produtos] Buscando produtos para franqueada: uuid-123
[api/admin/franqueados/:id/produtos] 50 produtos encontrados
```

---

## 🎨 Componentes Criados

1. **`app/admin/franqueadas/page.tsx`** (215 linhas)
   - Página principal de franqueadas
   - Filtros, busca e estatísticas
   - Cards com aprovação/rejeição

2. **`app/api/admin/franqueadas/list/route.ts`** (50 linhas)
   - API para listar franqueadas com filtros

3. **`app/api/admin/franqueadas/action/route.ts`** (95 linhas)
   - API para aprovar/rejeitar
   - Lógica de vinculação automática na aprovação

4. **`app/api/admin/franqueados/[id]/produtos/route.ts`** (72 linhas)
   - API para listar produtos de uma franqueada

5. **Modificações em `app/admin/franqueados/page.tsx`**
   - Adicionado sistema de abas
   - Aba de produtos vinculados
   - Função `carregarProdutosVinculados()`

6. **Modificações em `app/api/produtos/batch/route.ts`**
   - Lógica de vinculação automática ao ativar
   - Lógica de desvinculação ao desativar
   - Logs detalhados

7. **Modificações em `components/Sidebar.tsx`**
   - Adicionado link "Franqueadas"

---

## ✅ Checklist de Funcionalidades

- [x] Migração 007 criada com tabelas e índices
- [x] Página de franqueadas com listagem completa
- [x] Filtros por status (Todos/Pendente/Aprovada/Rejeitada)
- [x] Busca por nome ou email
- [x] Estatísticas visuais (cards coloridos)
- [x] Aprovação de franqueadas com confirm
- [x] Rejeição com campo de observação
- [x] Vinculação automática de produtos ativos na aprovação
- [x] Aba de produtos na página de franqueados
- [x] API para listar produtos de uma franqueada
- [x] Vinculação automática ao ativar produtos em batch
- [x] Desvinculação automática ao desativar produtos
- [x] Link no Sidebar para franqueadas
- [x] Logs detalhados em todas as operações
- [x] Tratamento de erros e loading states
- [x] Interface responsiva e consistente
- [x] Uso das cores padrão do projeto
- [x] Zero erros de TypeScript

---

## 🚀 Próximos Passos (Opcional)

### **Melhorias Futuras:**

1. **Botão de "Vincular Produtos" manual**
   - Modal para selecionar produtos específicos
   - Vincular/desvincular individualmente

2. **Relatório de vinculações**
   - Página mostrando quais produtos cada franqueada tem
   - Gráficos e estatísticas

3. **Notificações por email**
   - Enviar email quando franqueada for aprovada
   - Notificar sobre novos produtos

4. **Histórico de mudanças**
   - Tabela de auditoria
   - Quem aprovou, quando, etc.

5. **Dashboard de franqueadas**
   - Visão geral com métricas
   - Gráficos de crescimento

---

## 📚 Documentação Relacionada

- **`docs/APLICAR_MIGRACAO.md`** - Como aplicar migração 006 (categorias)
- **`docs/COLOR_GUIDE.md`** - Guia de cores do projeto
- **`migrations/006_COMPLETE_categorias_system.sql`** - Migração de categorias
- **`migrations/007_add_franqueadas_system.sql`** - Migração de franqueadas

---

## 🎉 Conclusão

Sistema completo de gerenciamento de franqueadas e vinculação automática de produtos implementado com sucesso!

**Funciona assim:**
1. Franqueadas se cadastram
2. Admin aprova → Produtos ativos são vinculados automaticamente
3. Admin ativa produtos → Vinculados automaticamente a todas as franqueadas aprovadas
4. Admin desativa produtos → Desvinculados automaticamente de todas

**Tudo automático, tudo rastreável, tudo logado! 🚀**

---

**Commit:** `7855d71`  
**Data:** 21 de outubro de 2025  
**Arquivos modificados:** 8  
**Linhas adicionadas:** +783  
**Linhas removidas:** -44  
