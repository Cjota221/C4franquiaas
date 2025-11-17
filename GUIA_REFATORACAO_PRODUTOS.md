#  GUIA RÁPIDO - Refatoração Produtos Admin

##  JÁ ESTÁ PRONTO:
1.  Migration 034 criada (migrations/034_add_created_at_to_produtos.sql)
2.  API vincular revendedoras criada
3.  Commit feito (1c458b9)

##  FAZER AGORA:

### 1. APLICAR MIGRATION NO SUPABASE
Abra: https://supabase.com/dashboard/project/[seu-projeto]/sql/new

Cole e execute:
```sql
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
UPDATE produtos SET created_at = NOW() WHERE created_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_produtos_created_at ON produtos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo_created_at ON produtos(ativo, created_at DESC) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_produtos_estoque_created_at ON produtos(estoque, created_at DESC) WHERE estoque > 0;
```

### 2. REFATORAR app/admin/produtos/page.tsx

#### Mudança 1: Adicionar estados (linha ~67)
```typescript
const [filtroApenasComEstoque, setFiltroApenasComEstoque] = useState(true); // Padrão: remove esgotados
const [ordenacao, setOrdenacao] = useState<'nome' | 'data-desc' | 'data-asc' | 'preco-desc' | 'preco-asc' | 'estoque-desc'>('data-desc');
const [vinculandoRevendedoras, setVinculandoRevendedoras] = useState(false);
```

#### Mudança 2: Modificar carregarProdutos (após filtro ativo, linha ~100)
```typescript
// ADICIONAR APÓS: if (filtroApenaAtivos) { query = query.eq('ativo', true); }
if (filtroApenasComEstoque) {
  query = query.gt('estoque', 0); //  REMOVE ESGOTADOS!
}

// SUBSTITUIR: query.order('nome', { ascending: true });
// POR:
switch (ordenacao) {
  case 'nome': query = query.order('nome', { ascending: true }); break;
  case 'data-desc': query = query.order('created_at', { ascending: false, nullsFirst: false }); break;
  case 'data-asc': query = query.order('created_at', { ascending: true, nullsFirst: false }); break;
  case 'preco-desc': query = query.order('preco_base', { ascending: false, nullsFirst: false }); break;
  case 'preco-asc': query = query.order('preco_base', { ascending: true, nullsFirst: false }); break;
  case 'estoque-desc': query = query.order('estoque', { ascending: false }); break;
  default: query = query.order('created_at', { ascending: false, nullsFirst: false });
}
```

#### Mudança 3: Adicionar dependências do useEffect (linha ~220)
```typescript
// MODIFICAR:
}, [pagina, debouncedSearchTerm, filtroCategoria, carregarProdutos]);

// PARA:
}, [pagina, debouncedSearchTerm, filtroCategoria, filtroApenasComEstoque, ordenacao, carregarProdutos]);
```

#### Mudança 4: Modificar selecionarTodos (linha ~410)
```typescript
const selecionarTodos = () => {
  const ids = produtosFiltrados.filter(p => p.ativo).map(p => p.id); //  SÓ ATIVOS!
  selectAll(ids);
  setStatusMsg({ type: 'success', text: `${ids.length} produto(s) ativo(s) selecionado(s)` });
  setTimeout(() => setStatusMsg(null), 2000);
};
```

#### Mudança 5: Adicionar vincularTodasRevendedoras (após vincularTodasFranqueadas, linha ~395)
```typescript
const vincularTodasRevendedoras = async () => {
  try {
    setVinculandoRevendedoras(true);
    setStatusMsg({ type: 'info', text: ' Vinculando produtos às revendedoras...' });

    const response = await fetch('/api/admin/produtos/vincular-todas-revendedoras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erro ao vincular produtos');
    }

    setStatusMsg({ 
      type: 'success', 
      text: ` ${data.detalhes.vinculacoes} vinculações criadas! (${data.detalhes.produtos} produtos  ${data.detalhes.revendedoras} revendedoras)` 
    });

    setTimeout(() => setStatusMsg(null), 5000);

  } catch (err) {
    console.error(' Erro ao vincular:', err);
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    setStatusMsg({ type: 'error', text: ` Erro: ${errorMessage}` });
    setTimeout(() => setStatusMsg(null), 5000);
  } finally {
    setVinculandoRevendedoras(false);
  }
};
```

#### Mudança 6: Modificar handleBatchAction (quando ativar, linha ~275)
```typescript
// ENCONTRAR:
const resFranqueadas = await fetch('/api/admin/produtos/vincular-todas-franqueadas', ...);

// ADICIONAR LOGO APÓS:
const resRevendedoras = await fetch('/api/admin/produtos/vincular-todas-revendedoras', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ produto_ids: selected }),
});

const dataRevendedoras = await resRevendedoras.json();

// MODIFICAR mensagem de sucesso para incluir revendedoras:
setStatusMsg({ 
  type: 'success', 
  text: ` ${selected.length} produto(s) ativado(s) e vinculados às franqueadas (${dataFranqueadas.detalhes.vinculacoes}) e revendedoras (${dataRevendedoras.detalhes.vinculacoes})!` 
});
```

#### Mudança 7: Adicionar filtros na UI (linha ~450)
```jsx
{/* ADICIONAR APÓS campo de busca */}
<select
  value={ordenacao}
  onChange={(e) => setOrdenacao(e.target.value as OrdenacaoTipo)}
  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#DB1472] transition-all bg-white font-medium"
>
  <option value="data-desc"> Mais recentes</option>
  <option value="data-asc"> Mais antigos</option>
  <option value="nome"> Nome (A-Z)</option>
  <option value="preco-desc"> Maior preço</option>
  <option value="preco-asc"> Menor preço</option>
  <option value="estoque-desc"> Maior estoque</option>
</select>

{/* ADICIONAR checkbox Com estoque */}
<label className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-green-500 transition-all cursor-pointer">
  <input 
    type="checkbox" 
    checked={filtroApenasComEstoque}
    onChange={(e) => setFiltroApenasComEstoque(e.target.checked)}
    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
  />
  <span className="text-sm font-medium text-gray-700"> Com estoque</span>
</label>
```

#### Mudança 8: Adicionar botão Vincular Revendedoras (linha ~495)
```jsx
{/* ADICIONAR APÓS botão "Vincular às Franqueadas" */}
<button 
  onClick={vincularTodasRevendedoras}
  disabled={vinculandoRevendedoras}
  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md font-medium flex items-center gap-2"
>
  {vinculandoRevendedoras ? (
    <>
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
      Vinculando...
    </>
  ) : (
    <>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      Vincular às Revendedoras
    </>
  )}
</button>
```

#### Mudança 9: Modificar botão "Selecionar Todos" (linha ~515)
```jsx
{/* MODIFICAR texto do botão */}
Selecionar Todos Ativos ({produtosFiltrados.filter(p => p.ativo).length})
```

##  RESULTADO FINAL:

 Produtos esgotados NÃO aparecem (filtro padrão)
 "Selecionar Todos" só seleciona ativos
 Botão "Vincular Revendedoras" funcionando
 Ativar produto  vincula automático franqueadas + revendedoras
 Ordenação por data/nome/preço/estoque
 Filtro "Com estoque" remove esgotados

##  TESTAR:
1. Sincronizar produtos do FacilZap
2. Ativar um produto  verificar vinculação automática
3. Filtrar "Com estoque"  esgotados não aparecem
4. Ordenar por "Mais recentes"  produtos novos primeiro
5. Clicar "Selecionar Todos"  só ativos selecionados
