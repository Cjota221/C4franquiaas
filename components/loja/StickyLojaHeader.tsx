"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import { ShoppingCart, Menu, ArrowLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StickyLojaHeaderProps {
  dominio: string;
  logoUrl?: string;
  nomeLoja?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onMenuClick?: () => void;
  corPrimaria?: string;
}

/**
 * Header Sticky com Shrinking Effect
 * - Começa normal, encolhe ao rolar
 * - Mantém sempre o mesmo header (não duplica)
 * - Adiciona sombra ao rolar
 */
export function StickyLojaHeader({
  dominio,
  logoUrl,
  nomeLoja = 'Loja',
  showBackButton = false,
  onBackClick,
  onMenuClick,
  corPrimaria = '#000000',
}: StickyLojaHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const items = useCarrinhoStore(state => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.quantidade, 0);

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/loja/${dominio}/produtos?search=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Header Sticky */}
      <header
        className={`
          sticky top-0 z-50 bg-white
          transition-all duration-300 ease-in-out
          ${isScrolled 
            ? 'shadow-md py-2' 
            : 'shadow-sm py-3 md:py-4'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* COLUNA 1: Menu/Voltar */}
            <div className="flex-1 flex items-center">
              {showBackButton ? (
                <button
                  onClick={onBackClick}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
                </button>
              ) : (
                <button
                  onClick={onMenuClick}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Abrir menu"
                >
                  <Menu className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
                </button>
              )}
            </div>

            {/* COLUNA 2: Logo (Centro) */}
            <div className="flex-1 flex justify-center">
              <Link 
                href={`/loja/${dominio}`}
                className="flex items-center transition-transform hover:scale-105"
              >
                {logoUrl ? (
                  <div 
                    className={`relative transition-all duration-300 ${
                      isScrolled 
                        ? 'h-8 w-auto max-w-[100px]' 
                        : 'h-10 w-auto max-w-[140px]'
                    }`}
                  >
                    <Image
                      src={logoUrl}
                      alt={nomeLoja}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                ) : (
                  <span 
                    className={`font-bold transition-all duration-300 ${
                      isScrolled ? 'text-lg' : 'text-xl md:text-2xl'
                    }`}
                    style={{ color: corPrimaria }}
                  >
                    {nomeLoja}
                  </span>
                )}
              </Link>
            </div>

            {/* COLUNA 3: Busca + Carrinho */}
            <div className="flex-1 flex items-center justify-end gap-2">
              {/* Busca */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Buscar"
              >
                <Search className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
              </button>

              {/* Carrinho */}
              <Link
                href={`/loja/${dominio}/carrinho`}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Carrinho de compras"
              >
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
                
                {/* Badge de Contador */}
                {totalItems > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                    style={{ backgroundColor: corPrimaria }}
                  >
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de Busca Expansível */}
      {showSearch && (
        <div className="sticky top-[56px] md:top-[64px] z-40 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos..."
                autoFocus
                className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-gray-200 focus:border-gray-900 focus:outline-none transition-colors text-gray-900 placeholder-gray-400"
              />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
