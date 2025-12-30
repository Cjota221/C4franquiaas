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
  lojaId?: string;  // ID da loja para analytics
};

// Função para enviar eventos de analytics
async function trackCartEvent(eventType: string, produto: ProdutoCarrinho, lojaId?: string) {
  try {
    const sessionId = typeof window !== 'undefined' 
      ? sessionStorage.getItem('analytics_session_id') 
      : null;
    
    if (!sessionId) return;

    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        session_id: sessionId,
        loja_id: lojaId || produto.lojaId,
        produto_id: produto.id,
        produto_nome: produto.nome,
        produto_preco: produto.preco,
        quantidade: produto.quantidade,
        variacao: produto.tamanho || produto.sku,
        device_type: typeof window !== 'undefined' 
          ? (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop')
          : 'desktop'
      })
    });

    // Também envia pro GA4 se disponível
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventType, {
        currency: 'BRL',
        value: produto.preco * produto.quantidade,
        items: [{
          item_id: produto.id,
          item_name: produto.nome,
          price: produto.preco,
          quantity: produto.quantidade,
          item_variant: produto.tamanho || produto.sku
        }]
      });
    }
  } catch (error) {
    console.debug('Cart analytics error:', error);
  }
}

// Declaração do gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

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
        
        // 📊 Tracking: add_to_cart
        trackCartEvent('add_to_cart', produto);
        
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
        // 📊 Tracking: remove_from_cart
        const itemToRemove = state.items.find(i => sku ? (i.id === id && i.sku === sku) : i.id === id);
        if (itemToRemove) {
          trackCartEvent('remove_from_cart', itemToRemove);
        }
        
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
