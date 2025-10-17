import { create } from 'zustand';

export type Produto = {
  id: number;
  id_externo?: string;
  nome: string;
  estoque: number;
  preco_base: number | null;
  ativo: boolean;
  imagem?: string | null;
  imagens?: string[];
  variacoes_meta?: unknown[];
  codigo_barras?: string | null;
  estoque_display?: number;
  categorias?: { id?: number; nome: string }[] | null;
};

type ProdutoStore = {
  produtos: Produto[];
  visibleProdutos: Produto[];
  pagina: number;
  total: number;
  loading: boolean;

  searchTerm: string;
  selectedCategoryFilter: number | null;
  sortBy: 'none' | 'price_desc' | 'price_asc' | 'date_new' | 'date_old';

  selectedIds: Record<number, boolean>;

  setProdutos: (produtos: Produto[]) => void;
  setVisibleProdutos: (produtos: Produto[]) => void;
  setPagina: (p: number) => void;
  setTotal: (t: number) => void;
  setLoading: (l: boolean) => void;

  setSearchTerm: (s: string) => void;
  setSelectedCategoryFilter: (c: number | null) => void;
  setSortBy: (s: 'none' | 'price_desc' | 'price_asc' | 'date_new' | 'date_old') => void;

  toggleSelected: (id: number) => void;
  setSelected: (ids: Record<number, boolean>) => void;
  clearSelected: () => void;
  selectAll: (ids: number[]) => void;
  setSelectedId: (id: number, checked: boolean) => void;
  updateProduto: (id: number, patch: Partial<Produto>) => void;

  getFilteredProducts: () => Produto[];
  getSelectedCount: () => number;
};

export const useProdutoStore = create<ProdutoStore>((set, get) => ({
  produtos: [],
  visibleProdutos: [],
  pagina: 1,
  total: 0,
  loading: false,

  searchTerm: '',
  selectedCategoryFilter: null,
  sortBy: 'none',

  selectedIds: {},

  setProdutos: (produtos) => set({ produtos }),
  setVisibleProdutos: (visibleProdutos) => set({ visibleProdutos }),
  setPagina: (pagina) => set({ pagina }),
  setTotal: (total) => set({ total }),
  setLoading: (loading) => set({ loading }),

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setSelectedCategoryFilter: (selectedCategoryFilter) => set({ selectedCategoryFilter }),
  setSortBy: (sortBy) => set({ sortBy }),

  toggleSelected: (id) =>
    set((state) => ({
      selectedIds: {
        ...state.selectedIds,
        [id]: !state.selectedIds[id],
      },
    })),

  // Set or clear a single selected id
  // helper to set one id explicitly
  setSelectedId: (id: number, checked: boolean) =>
    set((state) => ({
      selectedIds: {
        ...state.selectedIds,
        [id]: checked,
      },
    })),

  setSelected: (selectedIds) => set({ selectedIds }),

  clearSelected: () => set({ selectedIds: {} }),

  selectAll: (ids) => {
    const newSelected: Record<number, boolean> = {};
    ids.forEach((id) => {
      newSelected[id] = true;
    });
    set({ selectedIds: newSelected });
  },

  // update a single produto in the store by id (partial update)
  updateProduto: (id: number, patch: Partial<Produto>) =>
    set((state) => ({
      produtos: state.produtos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      visibleProdutos: state.visibleProdutos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),

  getFilteredProducts: () => {
    const { visibleProdutos } = get();
    return visibleProdutos;
  },

  getSelectedCount: () => {
    const { selectedIds } = get();
    return Object.values(selectedIds).filter(Boolean).length;
  },
}));
