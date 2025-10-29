/**
 * Header Minimalista para Página de Produto
 * Design: Fundo preto, 3 colunas (Menu | Logo | Carrinho)
 * Baseado no layout Cacau Shoes
 */

"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';

interface ProductHeaderMobileProps {
  dominio: string;
  logoUrl?: string;
  nomeLoja?: string;
  onMenuClick?: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export function ProductHeaderMobile({
  dominio,
  logoUrl,
  nomeLoja = 'Loja',
  onMenuClick,
  showBackButton = false,
  onBackClick,
}: ProductHeaderMobileProps) {
  const items = useCarrinhoStore(state => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <header className="sticky top-0 z-50 bg-black text-white">
      <div className="flex items-center justify-between px-4 py-3 md:py-4">
        {/* COLUNA 1: Menu/Voltar */}
        <div className="flex-1">
          {showBackButton ? (
            <button
              onClick={onBackClick}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* COLUNA 2: Logo */}
        <div className="flex-1 flex justify-center">
          <Link 
            href={`/loja/${dominio}`}
            className="flex items-center"
          >
            {logoUrl ? (
              <div className="relative h-8 w-auto max-w-[120px]">
                <Image
                  src={logoUrl}
                  alt={nomeLoja}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <span className="text-xl font-bold tracking-tight">
                {nomeLoja}
              </span>
            )}
          </Link>
        </div>

        {/* COLUNA 3: Carrinho */}
        <div className="flex-1 flex justify-end">
          <Link
            href={`/loja/${dominio}/carrinho`}
            className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Carrinho de compras"
          >
            <ShoppingCart className="w-6 h-6" />
            
            {/* Badge de Contador */}
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
