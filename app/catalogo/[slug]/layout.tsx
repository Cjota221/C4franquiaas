"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Tipos
type Reseller = {
  id: string;
  store_name: string;
  slug: string;
  phone: string;
  logo_url?: string;
  colors?: {
    primary: string;
    secondary: string;
  };
};

type CartItem = {
  id?: string;
  productId: string;
  nome: string;
  preco: number;
  imagem?: string;
  quantidade: number;
  tamanho?: string;
  sku?: string;
  estoque?: number;
  variacao?: {
    id: string;
    tamanho: string;
    cor?: string;
  };
};

type CatalogoContextType = {
  reseller: Reseller | null;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, sku?: string) => void;
  updateQuantity: (id: string, quantidade: number, sku?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTotalItems: () => number;
  primaryColor: string;
  secondaryColor: string;
};

const CatalogoContext = createContext<CatalogoContextType | null>(null);

export function useCatalogo() {
  const context = useContext(CatalogoContext);
  if (!context) {
    throw new Error('useCatalogo must be used within CatalogoProvider');
  }
  return context;
}

export default function CatalogoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [slug, setSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  const supabase = createClientComponentClient();

  // Carregar slug
  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  // Carregar dados do revendedor
  useEffect(() => {
    if (!slug) return;

    async function loadReseller() {
      const { data } = await supabase
        .from('resellers')
        .select('*')
        .eq('slug', slug)
        .single();

      if (data) {
        setReseller(data);
      }
      setLoading(false);
    }

    loadReseller();
  }, [slug, supabase]);

  // Carregar carrinho do localStorage
  useEffect(() => {
    if (!slug) return;
    const saved = localStorage.getItem(`cart_${slug}`);
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {
        setCart([]);
      }
    }
  }, [slug]);

  // Salvar carrinho no localStorage
  useEffect(() => {
    if (slug && cart.length >= 0) {
      localStorage.setItem(`cart_${slug}`, JSON.stringify(cart));
    }
  }, [cart, slug]);

  const primaryColor = reseller?.colors?.primary || '#ec4899';
  const secondaryColor = reseller?.colors?.secondary || '#8b5cf6';

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      // Usar variacao.id se existir, senão sku, senão productId
      const key = item.variacao?.id 
        ? `${item.productId}-${item.variacao.id}` 
        : item.sku 
          ? `${item.productId}-${item.sku}` 
          : item.productId;
      
      const existing = prev.find(i => {
        const itemKey = i.variacao?.id 
          ? `${i.productId}-${i.variacao.id}` 
          : i.sku 
            ? `${i.productId}-${i.sku}` 
            : i.productId;
        return itemKey === key;
      });

      if (existing) {
        return prev.map(i => {
          const itemKey = i.variacao?.id 
            ? `${i.productId}-${i.variacao.id}` 
            : i.sku 
              ? `${i.productId}-${i.sku}` 
              : i.productId;
          return itemKey === key
            ? { ...i, quantidade: i.quantidade + item.quantidade }
            : i;
        });
      }

      return [...prev, { ...item, id: key }];
    });
  };

  const removeFromCart = (id: string, sku?: string) => {
    setCart(prev => {
      if (sku) {
        return prev.filter(i => !(i.productId === id && i.sku === sku));
      }
      return prev.filter(i => i.productId !== id);
    });
  };

  const updateQuantity = (id: string, quantidade: number, sku?: string) => {
    setCart(prev =>
      prev.map(i => {
        const isMatch = sku ? (i.productId === id && i.sku === sku) : i.productId === id;
        return isMatch ? { ...i, quantidade: Math.max(1, Math.min(quantidade, i.estoque)) } : i;
      })
    );
  };

  const clearCart = () => setCart([]);

  const getTotal = () => cart.reduce((sum, item) => sum + item.preco * item.quantidade, 0);

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantidade, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!reseller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Catálogo não encontrado</h1>
          <p className="text-gray-600">O catálogo que você procura não existe.</p>
        </div>
      </div>
    );
  }

  return (
    <CatalogoContext.Provider
      value={{
        reseller,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getTotalItems,
        primaryColor,
        secondaryColor,
      }}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header
          className="sticky top-0 z-40 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href={`/catalogo/${slug}`} className="flex items-center gap-3">
                {reseller.logo_url && (
                  <div className="w-12 h-12 bg-white rounded-lg p-1.5 flex-shrink-0">
                    <Image
                      src={reseller.logo_url}
                      alt={reseller.store_name}
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold">{reseller.store_name}</h1>
                </div>
              </Link>

              {/* Carrinho */}
              <Link
                href={`/catalogo/${slug}/carrinho`}
                className="relative p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
              >
                <ShoppingBag size={24} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} {reseller.store_name}. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </CatalogoContext.Provider>
  );
}
