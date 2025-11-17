# 📋 Plano de Implementação - Tabela de Produtos

**Baseado em:** Documento de Especificação Técnica (PT) - Melhoria do Gerenciador de Produtos
**Data:** 17 de Novembro de 2025
**Status:** 🟡 Planejamento

---

## 🎯 Objetivo

Transformar a visualização de produtos de **Grid (Cards)** para **Tabela (List View)** com filtros avançados, ordenação e maior densidade de informação.

---

## 📊 Estado Atual vs. Estado Desejado

| Aspecto       | Atual               | Desejado             |
| ------------- | ------------------- | -------------------- |
| **Layout**    | Grid de Cards       | Tabela de Dados      |
| **Densidade** | Baixa (3 colunas)   | Alta (9+ colunas)    |
| **Ordenação** | Fixa (sem controle) | Clicável em colunas  |
| **Filtros**   | 3 filtros básicos   | 7+ filtros avançados |
| **Paginação** | Sim (30 itens)      | Sim (manter)         |
| **Seleção**   | Checkbox no card    | Checkbox na tabela   |

---

## 🗂️ Arquivos a Modificar

### 1️⃣ **Principais**

- ✅ `app/admin/produtos/page.tsx` - Componente principal
- ✅ `lib/store/produtoStore.ts` - Store de estado (se necessário)
- ✅ `migrations/034_add_created_at_to_produtos.sql` - Campo created_at

### 2️⃣ **Novos Componentes** (opcionais)

- `components/admin/TabelaProdutos.tsx` - Tabela isolada
- `components/admin/FiltrosProdutos.tsx` - Barra de filtros
- `components/admin/ColunaOrdenavel.tsx` - Header clicável

---

## 🔧 Implementação Fase a Fase

### **FASE 1: Preparação do Backend** ✅ (Já iniciada)

#### 1.1. Aplicar Migration 034

- ✅ SQL criado: `migrations/034_add_created_at_to_produtos.sql`
- ⏳ **Ação:** Executar no Supabase SQL Editor
- ✅ Guia criado: `APLICAR_MIGRATION_034.md`

**Resultado:** Campo `created_at` disponível para ordenação.

---

### **FASE 2: Criar Estrutura da Tabela** 🔨

#### 2.1. Definir Interface de Dados

```typescript
// Adicionar ao tipo Produto existente
export type Produto = {
  id: number | string;
  id_externo?: string;
  nome: string;
  estoque: number;
  preco_base: number | null;
  ativo: boolean;
  imagem?: string | null;
  imagens?: string[];
  created_at?: string; // 🆕 NOVO
  categorias?: { id?: number; nome: string }[] | null;
  temMargem?: boolean;
  // ... outros campos
};
```

#### 2.2. Criar Componente de Tabela

**Arquivo:** `components/admin/TabelaProdutos.tsx`

**Estrutura:**

```tsx
interface TabelaProdutosProps {
  produtos: Produto[];
  loading: boolean;
  selectedIds: Record<number | string, boolean>;
  onSelectOne: (id: number | string, checked: boolean) => void;
  onSelectAll: () => void;
  onSort: (campo: string) => void;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onVerDetalhes: (produto: Produto) => void;
  onToggleStatus: (id: number | string) => void;
}

export default function TabelaProdutos({ ... }: TabelaProdutosProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            {/* Colunas definidas na spec */}
          </tr>
        </thead>
        <tbody>
          {/* Linhas de produtos */}
        </tbody>
      </table>
    </div>
  );
}
```

#### 2.3. Colunas da Tabela

| #   | Coluna       | Width | Ordenável | Componente                  |
| --- | ------------ | ----- | --------- | --------------------------- |
| 1   | Checkbox     | 40px  | ❌        | `<input type="checkbox">`   |
| 2   | Imagem       | 60px  | ❌        | `<Image>` miniatura         |
| 3   | Nome         | Auto  | ✅        | `<button>` clicável         |
| 4   | ID           | 80px  | ✅        | Texto                       |
| 5   | Preço        | 100px | ✅        | `R$ X.XXX,XX`               |
| 6   | Estoque      | 100px | ✅        | Badge (Disponível/Esgotado) |
| 7   | Status       | 80px  | ✅        | Badge (Ativo/Inativo)       |
| 8   | Data Criação | 120px | ✅        | `DD/MM/YYYY`                |
| 9   | Ações        | 150px | ❌        | Botões                      |

---

### **FASE 3: Implementar Ordenação** 🔨

#### 3.1. Estados de Ordenação

```typescript
const [sortBy, setSortBy] = useState<string>('created_at');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
```

#### 3.2. Função de Ordenação

```typescript
const handleSort = (campo: string) => {
  if (sortBy === campo) {
    // Alternar direção
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  } else {
    // Novo campo
    setSortBy(campo);
    setSortDirection('asc');
  }
};
```

#### 3.3. Aplicar Ordenação na Query

```typescript
let query = createClient().from('produtos').select('*', { count: 'exact' });

// Aplicar ordenação
if (sortBy === 'nome') {
  query = query.order('nome', { ascending: sortDirection === 'asc' });
} else if (sortBy === 'preco_base') {
  query = query.order('preco_base', { ascending: sortDirection === 'asc' });
} else if (sortBy === 'created_at') {
  query = query.order('created_at', { ascending: sortDirection === 'asc' });
} else if (sortBy === 'estoque') {
  query = query.order('estoque', { ascending: sortDirection === 'asc' });
}
```

---

### **FASE 4: Expandir Filtros** 🔨

#### 4.1. Novos Estados de Filtro

```typescript
// Estados existentes
const [searchTerm, setSearchTerm] = useState('');
const [filtroCategoria, setFiltroCategoria] = useState<number | null>(null);

// 🆕 NOVOS FILTROS
const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
const [filtroEstoque, setFiltroEstoque] = useState<'todos' | 'disponivel' | 'esgotado'>('todos');
const [filtroNovos, setFiltroNovos] = useState(false);
const [precoMin, setPrecoMin] = useState<string>('');
const [precoMax, setPrecoMax] = useState<string>('');
```

#### 4.2. Componente de Barra de Filtros

**Arquivo:** `components/admin/FiltrosProdutos.tsx`

```tsx
interface FiltrosProdutosProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categorias: Array<{ id: number; nome: string }>;
  categoriaId: number | null;
  onCategoriaChange: (id: number | null) => void;
  status: 'todos' | 'ativo' | 'inativo';
  onStatusChange: (status: string) => void;
  estoque: 'todos' | 'disponivel' | 'esgotado';
  onEstoqueChange: (estoque: string) => void;
  apenasNovos: boolean;
  onApenasNovosChange: (checked: boolean) => void;
  precoMin: string;
  precoMax: string;
  onPrecoMinChange: (value: string) => void;
  onPrecoMaxChange: (value: string) => void;
  onLimparFiltros: () => void;
}

export default function FiltrosProdutos({ ... }: FiltrosProdutosProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Busca */}
        <input type="text" placeholder="Buscar..." />

        {/* Categoria */}
        <select>...</select>

        {/* Status */}
        <select>...</select>

        {/* Estoque */}
        <select>...</select>

        {/* Preço Mínimo/Máximo */}
        <div className="flex gap-2">
          <input type="number" placeholder="Preço mín" />
          <input type="number" placeholder="Preço máx" />
        </div>

        {/* Apenas Novos */}
        <label>
          <input type="checkbox" /> Apenas produtos novos
        </label>

        {/* Botão Limpar */}
        <button onClick={onLimparFiltros}>Limpar Filtros</button>
      </div>
    </div>
  );
}
```

#### 4.3. Aplicar Filtros na Query

```typescript
// Filtro de status
if (filtroStatus === 'ativo') {
  query = query.eq('ativo', true);
} else if (filtroStatus === 'inativo') {
  query = query.eq('ativo', false);
}

// Filtro de estoque
if (filtroEstoque === 'disponivel') {
  query = query.gt('estoque', 0);
} else if (filtroEstoque === 'esgotado') {
  query = query.eq('estoque', 0);
}

// Filtro de preço
if (precoMin) {
  query = query.gte('preco_base', parseFloat(precoMin));
}
if (precoMax) {
  query = query.lte('preco_base', parseFloat(precoMax));
}

// Filtro de novos (últimos 7 dias)
if (filtroNovos) {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 7);
  query = query.gte('created_at', dataLimite.toISOString());
}
```

---

### **FASE 5: Persistência em URL (Query Parameters)** 🔨

#### 5.1. Usar useSearchParams e useRouter

```typescript
import { useSearchParams, useRouter } from 'next/navigation';

const searchParams = useSearchParams();
const router = useRouter();

// Ler da URL na montagem
useEffect(() => {
  const urlSortBy = searchParams.get('sort_by') || 'created_at';
  const urlSortDir = searchParams.get('sort_direction') || 'desc';
  const urlStatus = searchParams.get('status') || 'todos';

  setSortBy(urlSortBy);
  setSortDirection(urlSortDir as 'asc' | 'desc');
  setFiltroStatus(urlStatus as any);
  // ... outros filtros
}, []);

// Atualizar URL ao mudar filtros
useEffect(() => {
  const params = new URLSearchParams();

  params.set('sort_by', sortBy);
  params.set('sort_direction', sortDirection);
  if (filtroStatus !== 'todos') params.set('status', filtroStatus);
  if (searchTerm) params.set('search', searchTerm);
  // ... outros filtros

  router.replace(`/admin/produtos?${params.toString()}`, { scroll: false });
}, [sortBy, sortDirection, filtroStatus, searchTerm /* ... */]);
```

---

### **FASE 6: Melhorias de UX** 🔨

#### 6.1. Indicadores Visuais de Ordenação

```tsx
<th onClick={() => handleSort('nome')}>
  Nome
  {sortBy === 'nome' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
</th>
```

#### 6.2. Loading States

```tsx
{
  loading && (
    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
    </div>
  );
}
```

#### 6.3. Filtros Ativos (Tags)

```tsx
<div className="flex gap-2 mb-4">
  {filtroStatus !== 'todos' && (
    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
      Status: {filtroStatus}
      <button onClick={() => setFiltroStatus('todos')}>×</button>
    </span>
  )}
  {/* Outros filtros ativos */}
</div>
```

---

## 📅 Cronograma Sugerido

| Fase                            | Duração | Status      |
| ------------------------------- | ------- | ----------- |
| **FASE 1** - Preparação Backend | 30min   | ✅ Pronta   |
| **FASE 2** - Estrutura Tabela   | 2-3h    | ⏳ Pendente |
| **FASE 3** - Ordenação          | 1-2h    | ⏳ Pendente |
| **FASE 4** - Filtros Avançados  | 2-3h    | ⏳ Pendente |
| **FASE 5** - URL Parameters     | 1h      | ⏳ Pendente |
| **FASE 6** - Melhorias UX       | 1-2h    | ⏳ Pendente |
| **Testes e Ajustes**            | 2h      | ⏳ Pendente |
| **TOTAL**                       | ~10-14h | -           |

---

## ✅ Checklist de Implementação

### Backend

- [ ] Aplicar migration 034 (created_at)
- [ ] Verificar campo created_at preenchido
- [ ] Testar ordenação por created_at no Supabase

### Frontend - Tabela

- [ ] Criar componente TabelaProdutos
- [ ] Implementar colunas conforme spec
- [ ] Adicionar checkbox de seleção
- [ ] Implementar miniatura de imagem
- [ ] Botão "Ver Detalhes" funcional
- [ ] Toggle de status funcional

### Frontend - Ordenação

- [ ] Implementar estado de ordenação
- [ ] Headers clicáveis com indicador visual
- [ ] Ordenação por: Nome, Preço, Data, Estoque
- [ ] Persistir ordenação na URL

### Frontend - Filtros

- [ ] Criar componente FiltrosProdutos
- [ ] Filtro por Status (Ativo/Inativo)
- [ ] Filtro por Estoque (Disponível/Esgotado)
- [ ] Filtro por Faixa de Preço (min/max)
- [ ] Filtro "Apenas Novos" (últimos 7 dias)
- [ ] Manter filtros existentes (busca, categoria)
- [ ] Exibir tags de filtros ativos
- [ ] Botão "Limpar Filtros"
- [ ] Persistir filtros na URL

### Frontend - UX

- [ ] Loading states durante requisições
- [ ] Empty states (sem resultados)
- [ ] Mensagens de erro amigáveis
- [ ] Responsividade mobile (scroll horizontal)
- [ ] Indicadores visuais claros
- [ ] Animações suaves

### Testes

- [ ] Testar ordenação em todas as colunas
- [ ] Testar combinação de filtros
- [ ] Testar seleção em massa
- [ ] Testar ações em massa
- [ ] Testar paginação com filtros
- [ ] Testar compartilhamento de URL
- [ ] Testar performance com 300+ produtos

---

## 🚀 Próximos Passos Imediatos

1. **Aplicar Migration 034** no Supabase
2. **Criar branch** de desenvolvimento: `git checkout -b feature/tabela-produtos`
3. **Iniciar FASE 2** - Criar componente TabelaProdutos
4. **Testar incrementalmente** cada fase

---

## 📝 Notas Técnicas

### Manter Compatibilidade

- ✅ Não alterar API de produtos
- ✅ Manter lógica de vinculação
- ✅ Manter modais existentes
- ✅ Manter ações em massa

### Performance

- Usar índices criados na migration 034
- Limitar resultados com paginação
- Debounce em campos de busca (já implementado)
- Considerar virtualização se necessário

### Acessibilidade

- Labels corretos em filtros
- Tabela semântica (`<table>`, `<thead>`, `<tbody>`)
- Keyboard navigation
- Screen reader friendly

---

**Documentação criada em:** 17/11/2025
**Última atualização:** 17/11/2025
