"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StickyLojaHeaderProps {
  dominio: string;
  logoUrl?: string;
  nomeLoja?: string;
  corPrimaria?: string;
}

/**
 * Header da Página de Produto com Shrinking Effect
 * - ÚNICO header sticky (sem duplicação)
 * - Encolhe suavemente ao rolar (h-16 → h-12)
 * - Sombra forte quando rolado
 * - Layout: ← Seta Voltar | Logo Centralizada (clicável) | Carrinho 🛒
 */
export function StickyLojaHeader({
  dominio,
  logoUrl,
  nomeLoja = 'Loja',
  corPrimaria = '#000000',
}: StickyLojaHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const items = useCarrinhoStore(state => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.quantidade, 0);

  // Debug: verificar se logoUrl está chegando
  console.log('[StickyLojaHeader] logoUrl recebido:', logoUrl);
  console.log('[StickyLojaHeader] nomeLoja:', nomeLoja);

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`
        sticky top-0 z-50 bg-white
        transition-all duration-300 ease-in-out
        ${isScrolled 
          ? 'shadow-lg py-2' 
          : 'py-4'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* COLUNA 1: Seta de Voltar */}
          <div className="flex-1 flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft 
                className={`text-gray-700 transition-all duration-300 ${
                  isScrolled ? 'w-5 h-5' : 'w-6 h-6'
                }`}
              />
            </button>
          </div>

          {/* COLUNA 2: Logo Centralizada (Clicável para Home) */}
          <div className="flex-1 flex justify-center">
            <Link 
              href={`/loja/${dominio}`}
              className="flex items-center transition-transform hover:scale-105"
            >
              {logoUrl ? (
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    isScrolled 
                      ? 'h-8' 
                      : 'h-12'
                  }`}
                >
                  <Image
                    src={logoUrl}
                    alt={nomeLoja}
                    width={160}
                    height={48}
                    className={`object-contain transition-all duration-300 ${
                      isScrolled ? 'h-8' : 'h-12'
                    }`}
                    style={{ width: 'auto', height: '100%' }}
                    priority
                  />
                </div>
              ) : (
                <span 
                  className={`font-bold transition-all duration-300 ${
                    isScrolled ? 'text-xl' : 'text-2xl md:text-3xl'
                  }`}
                  style={{ color: corPrimaria }}
                >
                  {nomeLoja}
                </span>
              )}
            </Link>
          </div>

          {/* COLUNA 3: Carrinho (Único) */}
          <div className="flex-1 flex items-center justify-end">
            <Link
              href={`/loja/${dominio}/carrinho`}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Carrinho de compras"
            >
              <ShoppingCart 
                className={`text-gray-700 transition-all duration-300 ${
                  isScrolled ? 'w-5 h-5' : 'w-6 h-6'
                }`}
              />
              
              {/* Badge de Contador */}
              {totalItems > 0 && (
                <span 
                  className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transition-all duration-300"
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
  );
}
