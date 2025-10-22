"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import { ShoppingCart, Home, Package, Info, Phone } from 'lucide-react';

type Loja = {
  nome: string;
  logo: string | null;
  cor_primaria: string;
  cor_secundaria: string;
};

export default function LojaHeader({ loja, dominio }: { loja: Loja; dominio: string }) {
  const totalItens = useCarrinhoStore((state) => state.getTotalItens());

  return (
    <header 
      className="sticky top-0 z-50 shadow-md"
      style={{ backgroundColor: loja.cor_primaria }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo e Nome */}
          <Link href={`/loja/${dominio}`} className="flex items-center gap-3 hover:opacity-90 transition">
            {loja.logo ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white">
                <Image
                  src={loja.logo}
                  alt={loja.nome}
                  fill
                  className="object-contain p-1"
                />
              </div>
            ) : (
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: loja.cor_secundaria }}
              >
                {loja.nome.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-white font-bold text-xl hidden md:block">
              {loja.nome}
            </span>
          </Link>

          {/* Menu Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href={`/loja/${dominio}`} 
              className="flex items-center gap-2 text-white hover:opacity-80 transition"
            >
              <Home size={18} />
              <span>Início</span>
            </Link>
            <Link 
              href={`/loja/${dominio}/produtos`} 
              className="flex items-center gap-2 text-white hover:opacity-80 transition"
            >
              <Package size={18} />
              <span>Produtos</span>
            </Link>
            <Link 
              href={`/loja/${dominio}/sobre`} 
              className="flex items-center gap-2 text-white hover:opacity-80 transition"
            >
              <Info size={18} />
              <span>Sobre</span>
            </Link>
            <Link 
              href={`/loja/${dominio}/contato`} 
              className="flex items-center gap-2 text-white hover:opacity-80 transition"
            >
              <Phone size={18} />
              <span>Contato</span>
            </Link>
          </nav>

          {/* Carrinho */}
          <Link
            href={`/loja/${dominio}/carrinho`}
            className="relative"
          >
            <button 
              className="p-3 rounded-lg hover:opacity-90 transition"
              style={{ backgroundColor: loja.cor_secundaria }}
            >
              <ShoppingCart size={24} className="text-white" />
              {totalItens > 0 && (
                <span 
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: loja.cor_primaria }}
                >
                  {totalItens}
                </span>
              )}
            </button>
          </Link>
        </div>

        {/* Menu Mobile */}
        <nav className="flex md:hidden items-center justify-around py-2 border-t border-white/20">
          <Link 
            href={`/loja/${dominio}`} 
            className="flex flex-col items-center gap-1 text-white text-xs hover:opacity-80 transition"
          >
            <Home size={20} />
            <span>Início</span>
          </Link>
          <Link 
            href={`/loja/${dominio}/produtos`} 
            className="flex flex-col items-center gap-1 text-white text-xs hover:opacity-80 transition"
          >
            <Package size={20} />
            <span>Produtos</span>
          </Link>
          <Link 
            href={`/loja/${dominio}/sobre`} 
            className="flex flex-col items-center gap-1 text-white text-xs hover:opacity-80 transition"
          >
            <Info size={20} />
            <span>Sobre</span>
          </Link>
          <Link 
            href={`/loja/${dominio}/contato`} 
            className="flex flex-col items-center gap-1 text-white text-xs hover:opacity-80 transition"
          >
            <Phone size={20} />
            <span>Contato</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
