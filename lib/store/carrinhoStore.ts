import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProdutoCarrinho = {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  imagem: string;
  estoque: number;
  sku?: string;  // SKU da variação selecionada
  tamanho?: string;  // Nome do tamanho/variação
  variacaoId?: string | null;
  variacaoSku?: string;
};

type CarrinhoStore = {
  items: ProdutoCarrinho[];
  addItem: (produto: ProdutoCarrinho) => void;
  removeItem: (id: string, sku?: string) => void;
  updateQuantidade: (id: string, quantidade: number, sku?: string) => void;
  clearCarrinho: () => void;
  getTotal: () => number;
  getTotalItens: () => number;
};

export const useCarrinhoStore = create<CarrinhoStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (produto) => set((state) => {
        // ⭐ Considerar SKU ao verificar se produto já existe
        // Se tem SKU, a chave única é id+sku, senão apenas id
        const chaveUnica = produto.sku 
          ? `${produto.id}-${produto.sku}`
          : produto.id;
        
        const existing = state.items.find(i => {
          const chaveItem = i.sku 
            ? `${i.id}-${i.sku}`
            : i.id;
          return chaveItem === chaveUnica;
        });
        
        if (existing) {
          // ✅ Atualizar quantidade se produto (com mesmo SKU) já existe
          return {
            items: state.items.map(i => {
              const chaveItem = i.sku 
                ? `${i.id}-${i.sku}`
                : i.id;
              
              return chaveItem === chaveUnica
                ? { ...i, quantidade: Math.min(i.quantidade + produto.quantidade, i.estoque) }
                : i;
            })
          };
        }
        
        // ✅ Adicionar novo produto
        return { items: [...state.items, produto] };
      }),
      
      removeItem: (id, sku?) => set((state) => {
        if (sku) {
          // Remover item com SKU específico
          return {
            items: state.items.filter(i => !(i.id === id && i.sku === sku))
          };
        }
        // Remover por ID apenas
        return {
          items: state.items.filter(i => i.id !== id)
        };
      }),
      
      updateQuantidade: (id, quantidade, sku?) => set((state) => ({
        items: state.items.map(i => {
          // Se SKU fornecido, match por id+sku, senão apenas id
          const isMatch = sku 
            ? (i.id === id && i.sku === sku)
            : i.id === id;
          
          return isMatch 
            ? { ...i, quantidade: Math.max(1, Math.min(quantidade, i.estoque)) } 
            : i;
        })
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
