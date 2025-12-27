"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ShoppingBag, Instagram, Facebook, MessageCircle, Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Tipos
type Reseller = {
  id: string;
  store_name: string;
  slug: string;
  phone: string;
  logo_url?: string;
  banner_url?: string;
  banner_mobile_url?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  colors?: {
    primary: string;
    secondary: string;
  };
  theme_settings?: {
    button_style?: 'rounded' | 'square';
    card_style?: 'shadow' | 'flat' | 'bordered';
    header_style?: 'gradient' | 'solid' | 'transparent';
    logo_shape?: 'circle' | 'square' | 'rectangle';
    logo_position?: 'left' | 'center' | 'right';
    show_prices?: boolean;
    show_stock?: boolean;
    show_whatsapp_float?: boolean;
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
  removeFromCart: (productId: string, variacaoId?: string) => void;
  updateQuantity: (productId: string, quantidade: number, variacaoId?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTotalItems: () => number;
  primaryColor: string;
  secondaryColor: string;
  themeSettings: Reseller['theme_settings'];
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
  const [socialMenuOpen, setSocialMenuOpen] = useState(false);
  
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
  const themeSettings = reseller?.theme_settings || {
    button_style: 'rounded',
    card_style: 'shadow',
    header_style: 'gradient',
    logo_shape: 'circle',
    logo_position: 'center',
    show_prices: true,
    show_stock: false,
    show_whatsapp_float: true,
  };

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

  const removeFromCart = (productId: string, variacaoId?: string) => {
    setCart(prev => {
      return prev.filter(item => {
        // Se tem variacaoId, comparar com variacao.id
        if (variacaoId) {
          return !(item.productId === productId && item.variacao?.id === variacaoId);
        }
        // Se não tem variacaoId, remover por productId (produto sem variações)
        return item.productId !== productId;
      });
    });
  };

  const updateQuantity = (productId: string, quantidade: number, variacaoId?: string) => {
    if (quantidade < 1) return; // Não permitir quantidade menor que 1
    
    setCart(prev =>
      prev.map(item => {
        // Verificar se é o item correto
        const isMatch = variacaoId 
          ? (item.productId === productId && item.variacao?.id === variacaoId)
          : item.productId === productId;
        
        if (!isMatch) return item;
        
        // Limitar pela estoque disponível (se tiver)
        const maxQtd = item.estoque || 99;
        const novaQuantidade = Math.max(1, Math.min(quantidade, maxQtd));
        
        return { ...item, quantidade: novaQuantidade };
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

  const hasSocialLinks = reseller.instagram || reseller.facebook || reseller.phone;

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
        themeSettings,
      }}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header
          className="sticky top-0 z-40 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        >
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Esquerda: Carrinho */}
              <Link
                href={`/catalogo/${slug}/carrinho`}
                className="relative p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
              >
                <ShoppingBag size={22} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </Link>

              {/* Centro: Logo + Nome */}
              <Link href={`/catalogo/${slug}`} className="flex items-center gap-2">
                {reseller.logo_url && (
                  <Image
                    src={reseller.logo_url}
                    alt={reseller.store_name}
                    width={themeSettings.logo_shape === 'rectangle' ? 100 : 40}
                    height={40}
                    className={`h-10 w-auto object-contain ${
                      themeSettings.logo_shape === 'circle' ? 'rounded-full' : ''
                    }`}
                  />
                )}
                <span className="text-lg font-bold hidden sm:inline">{reseller.store_name}</span>
              </Link>

              {/* Direita: Menu Social */}
              {hasSocialLinks ? (
                <div className="relative">
                  <button
                    onClick={() => setSocialMenuOpen(!socialMenuOpen)}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
                  >
                    {socialMenuOpen ? <X size={22} /> : <Menu size={22} />}
                  </button>

                  {/* Dropdown Menu */}
                  {socialMenuOpen && (
                    <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl py-2 min-w-[180px] z-50">
                      {reseller.phone && (
                        <a
                          href={`https://wa.me/55${reseller.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50"
                          onClick={() => setSocialMenuOpen(false)}
                        >
                          <MessageCircle size={20} className="text-green-500" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                      {reseller.instagram && (
                        <a
                          href={`https://instagram.com/${reseller.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50"
                          onClick={() => setSocialMenuOpen(false)}
                        >
                          <Instagram size={20} className="text-pink-500" />
                          <span>@{reseller.instagram}</span>
                        </a>
                      )}
                      {reseller.facebook && (
                        <a
                          href={reseller.facebook.startsWith('http') ? reseller.facebook : `https://facebook.com/${reseller.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50"
                          onClick={() => setSocialMenuOpen(false)}
                        >
                          <Facebook size={20} className="text-blue-600" />
                          <span>Facebook</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-10" /> /* Espaçador quando não tem redes sociais */
              )}
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

        {/* Botão WhatsApp Flutuante */}
        {themeSettings.show_whatsapp_float && reseller.phone && (
          <a
            href={`https://wa.me/55${reseller.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors z-50"
          >
            <MessageCircle size={28} className="text-white" />
          </a>
        )}
      </div>
    </CatalogoContext.Provider>
  );
}
