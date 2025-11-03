import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProdutoFavorito = {
  id: string;
  nome: string;
  preco: number;
  imagem: string;
  slug?: string;
  favoritadoEm: number; // timestamp
};

type FavoritosStore = {
  items: ProdutoFavorito[];
  addItem: (produto: Omit<ProdutoFavorito, 'favoritadoEm'>) => void;
  removeItem: (id: string) => void;
  isFavorito: (id: string) => boolean;
  toggleFavorito: (produto: Omit<ProdutoFavorito, 'favoritadoEm'>) => void;
  clearFavoritos: () => void;
  getTotalItens: () => number;
};

export const useFavoritosStore = create<FavoritosStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (produto) => set((state) => {
        const existing = state.items.find(i => i.id === produto.id);
        
        if (existing) {
          // Já existe, não adiciona duplicado
          return state;
        }
        
        return {
          items: [...state.items, { ...produto, favoritadoEm: Date.now() }]
        };
      }),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),
      
      isFavorito: (id) => {
        return get().items.some(i => i.id === id);
      },
      
      toggleFavorito: (produto) => {
        const { isFavorito, addItem, removeItem } = get();
        
        if (isFavorito(produto.id)) {
          removeItem(produto.id);
        } else {
          addItem(produto);
        }
      },
      
      clearFavoritos: () => set({ items: [] }),
      
      getTotalItens: () => get().items.length,
    }),
    {
      name: 'favoritos-storage',
    }
  )
);
