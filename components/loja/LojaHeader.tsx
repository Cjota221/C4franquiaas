"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import { useLojaInfo } from '@/contexts/LojaContext';
import { ShoppingCart, Home, Package, Info, Phone, User } from 'lucide-react';
import CategorySidebar from './CategorySidebar';

export default function LojaHeader({ dominio }: { dominio: string }) {
  const loja = useLojaInfo();
  const totalItens = useCarrinhoStore((state) => state.getTotalItens());

  return (
    <header className="sticky top-0 z-50 shadow-md bg-white">
      <div className="container mx-auto px-4">
        {/* Linha Principal: Menu Hambúrguer + Logo + Login + Carrinho */}
        <div className="flex items-center justify-between py-4">
          {/* Esquerda: Menu + Logo */}
          <div className="flex items-center gap-4">
            <CategorySidebar />
            <Link href={`/loja/${dominio}`} className="flex items-center gap-3 hover:opacity-90 transition">
              {loja.logo ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
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
                  style={{ backgroundColor: loja.cor_primaria }}
                >
                  {loja.nome.charAt(0).toUpperCase()}
                </div>
              )}
              <span 
                className="font-bold text-xl hidden md:block" 
                style={{ color: loja.cor_primaria }}
              >
                {loja.nome}
              </span>
            </Link>
          </div>

          {/* Direita: Login (Desktop) + Carrinho */}
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="hidden md:flex items-center gap-2 text-gray-700 hover:text-pink-600 transition"
            >
              <User size={20} />
              <span className="text-sm font-medium">Entrar</span>
            </Link>
            
            <Link
              href={`/loja/${dominio}/carrinho`}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ShoppingCart size={24} className="text-gray-700" />
              {totalItens > 0 && (
                <span 
                  className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center rounded-full text-white text-xs font-bold px-1"
                  style={{ backgroundColor: loja.cor_primaria }}
                >
                  {totalItens}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Menu Desktop: abaixo do header principal */}
        <nav className="hidden md:flex items-center justify-center gap-8 py-3 border-t border-gray-200">
          <Link 
            href={`/loja/${dominio}`}
            className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition font-medium"
          >
            <Home size={18} />
            <span>Início</span>
          </Link>
          <Link 
            href={`/loja/${dominio}/produtos`}
            className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition font-medium"
          >
            <Package size={18} />
            <span>Produtos</span>
          </Link>
          <Link 
            href={`/loja/${dominio}/sobre`}
            className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition font-medium"
          >
            <Info size={18} />
            <span>Sobre</span>
          </Link>
          <Link 
            href={`/loja/${dominio}/contato`}
            className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition font-medium"
          >
            <Phone size={18} />
            <span>Contato</span>
          </Link>
        </nav>

        {/* Bottom Bar Mobile (fixed bottom) */}
        <nav className="fixed md:hidden bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
          <div className="flex items-center justify-around py-3">
            <Link 
              href={`/loja/${dominio}`}
              className="flex flex-col items-center gap-1 text-gray-700 hover:text-pink-600 text-xs transition"
            >
              <Home size={20} />
              <span>Início</span>
            </Link>
            <Link 
              href={`/loja/${dominio}/produtos`}
              className="flex flex-col items-center gap-1 text-gray-700 hover:text-pink-600 text-xs transition"
            >
              <Package size={20} />
              <span>Produtos</span>
            </Link>
            <Link 
              href={`/loja/${dominio}/sobre`}
              className="flex flex-col items-center gap-1 text-gray-700 hover:text-pink-600 text-xs transition"
            >
              <Info size={20} />
              <span>Sobre</span>
            </Link>
            <Link 
              href={`/loja/${dominio}/contato`}
              className="flex flex-col items-center gap-1 text-gray-700 hover:text-pink-600 text-xs transition"
            >
              <Phone size={20} />
              <span>Contato</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
