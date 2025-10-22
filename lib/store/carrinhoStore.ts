import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProdutoCarrinho = {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  imagem: string;
  estoque: number;
};

type CarrinhoStore = {
  items: ProdutoCarrinho[];
  addItem: (produto: ProdutoCarrinho) => void;
  removeItem: (id: string) => void;
  updateQuantidade: (id: string, quantidade: number) => void;
  clearCarrinho: () => void;
  getTotal: () => number;
  getTotalItens: () => number;
};

export const useCarrinhoStore = create<CarrinhoStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (produto) => set((state) => {
        const existing = state.items.find(i => i.id === produto.id);
        
        if (existing) {
          // Atualizar quantidade se produto já existe
          return {
            items: state.items.map(i =>
              i.id === produto.id
                ? { ...i, quantidade: Math.min(i.quantidade + produto.quantidade, i.estoque) }
                : i
            )
          };
        }
        
        // Adicionar novo produto
        return { items: [...state.items, produto] };
      }),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),
      
      updateQuantidade: (id, quantidade) => set((state) => ({
        items: state.items.map(i =>
          i.id === id ? { ...i, quantidade: Math.max(1, Math.min(quantidade, i.estoque)) } : i
        )
      })),
      
      clearCarrinho: () => set({ items: [] }),
      
      getTotal: () => {
        const items = get().items;
        return items.reduce((total, item) => total + (item.preco * item.quantidade), 0);
      },
      
      getTotalItens: () => {
        const items = get().items;
        return items.reduce((total, item) => total + item.quantidade, 0);
      }
    }),
    { 
      name: 'c4-carrinho-storage',
      version: 1
    }
  )
);
