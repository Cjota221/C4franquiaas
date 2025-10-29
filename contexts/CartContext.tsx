"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface CartItem {
  id: string;
  nome: string;
  preco_final: number;
  imagens: string[];
  quantidade: number;
  tamanho?: string;
  sku?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, tamanho?: string) => void;
  updateQuantity: (id: string, quantidade: number, tamanho?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar carrinho do localStorage
  useEffect(() => {
    try {
      // Ler do mesmo localStorage que o Zustand usa
      const savedCart = localStorage.getItem('c4-carrinho-storage');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        // O Zustand salva como { state: { items: [...] } }
        const zustandItems = parsed?.state?.items || [];
        
        // Converter formato do Zustand para CartItem
        const convertedItems: CartItem[] = zustandItems.map((item: {
          id: string;
          nome: string;
          preco: number;
          imagem: string;
          quantidade: number;
          tamanho?: string;
          sku?: string;
        }) => ({
          id: item.id,
          nome: item.nome,
          preco_final: item.preco,
          imagens: [item.imagem],
          quantidade: item.quantidade,
          tamanho: item.tamanho,
          sku: item.sku,
        }));
        
        setItems(convertedItems);
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Nota: Não salvamos no localStorage aqui porque o Zustand já faz isso
  // O CartContext apenas LÊ os dados do Zustand para uso no checkout

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.id === item.id && i.tamanho === item.tamanho
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantidade += item.quantidade;
        return updated;
      }

      return [...prev, item];
    });
  };

  const removeItem = (id: string, tamanho?: string) => {
    setItems(prev => prev.filter(
      item => !(item.id === id && item.tamanho === tamanho)
    ));
  };

  const updateQuantity = (id: string, quantidade: number, tamanho?: string) => {
    setItems(prev => prev.map(item => 
      item.id === id && item.tamanho === tamanho
        ? { ...item, quantidade }
        : item
    ));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + (item.preco_final * item.quantidade), 0);
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantidade, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getTotal,
      getItemCount,
      isLoading,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
