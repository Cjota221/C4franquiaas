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

  // Configurações dinâmicas do banco
  const logoPos = loja.logo_posicao || 'esquerda';
  const menuTipo = loja.menu_tipo || 'horizontal';
  const topoFlutuante = loja.topo_flutuante ?? true;
  const mostrarIcones = loja.mostrar_icones_menu ?? true;
  const barraTopoTexto = loja.barra_topo_texto;
  const barraTopoAtiva = loja.barra_topo_ativa ?? true;

  // Classes dinâmicas baseadas nas configurações
  const headerClass = topoFlutuante ? 'sticky top-0 z-50' : 'relative';
  const logoFormatoClass = loja.logo_formato === 'redondo' 
    ? 'w-12 h-12 rounded-full' 
    : 'w-auto h-12 rounded';

  // Links do menu
  const menuLinks = [
    { href: '', label: 'Início', icon: Home },
    { href: '/produtos', label: 'Produtos', icon: Package },
    { href: '/sobre', label: 'Sobre', icon: Info },
    { href: '/contato', label: 'Contato', icon: Phone },
  ];

  return (
    <>
      {/* Barra de Topo (Anúncio) */}
      {barraTopoAtiva && barraTopoTexto && (
        <div 
          className="w-full py-2 text-center text-sm font-medium text-white"
          style={{ backgroundColor: loja.cor_primaria }}
        >
          {barraTopoTexto}
        </div>
      )}

      <header className={`${headerClass} shadow-md bg-white`}>
        <div className="container mx-auto px-4">
          {/* Linha Principal */}
          <div className="flex items-center justify-between py-4">
            {/* Layout baseado em logo_posicao */}
            {logoPos === 'centro' ? (
              <>
                {/* Centro: Menu esquerda + Logo centro + Carrinho direita */}
                <div className="flex items-center">
                  <CategorySidebar />
                </div>
                
                <Link href={`/loja/${dominio}`} className="flex items-center gap-3 hover:opacity-90 transition">
                  {loja.logo ? (
                    <div className={`relative ${logoFormatoClass} overflow-hidden bg-gray-100`}>
                      <Image
                        src={loja.logo}
                        alt={loja.nome}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                  ) : (
                    <div 
                      className={`${logoFormatoClass} flex items-center justify-center text-white font-bold text-xl`}
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
              </>
            ) : (
              <>
                {/* Esquerda/Direita padrão: Menu + Logo à esquerda, User + Carrinho à direita */}
                <div className="flex items-center gap-4">
                  <CategorySidebar />
                  <Link href={`/loja/${dominio}`} className="flex items-center gap-3 hover:opacity-90 transition">
                    {loja.logo ? (
                      <div className={`relative ${logoFormatoClass} overflow-hidden bg-gray-100`}>
                        <Image
                          src={loja.logo}
                          alt={loja.nome}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    ) : (
                      <div 
                        className={`${logoFormatoClass} flex items-center justify-center text-white font-bold text-xl`}
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
              </>
            )}
          </div>

          {/* Menu Desktop - layout baseado em menu_tipo */}
          {menuTipo === 'horizontal' && (
            <nav className="hidden md:flex items-center justify-center gap-8 py-3 border-t border-gray-200">
              {menuLinks.map(({ href, label, icon: Icon }) => (
                <Link 
                  key={href}
                  href={`/loja/${dominio}${href}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition font-medium"
                >
                  {mostrarIcones && <Icon size={18} />}
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          )}

          {menuTipo === 'vertical' && (
            <nav className="hidden md:flex flex-col items-start gap-2 py-3 border-t border-gray-200">
              {menuLinks.map(({ href, label, icon: Icon }) => (
                <Link 
                  key={href}
                  href={`/loja/${dominio}${href}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition font-medium w-full px-4 py-2 rounded hover:bg-gray-50"
                >
                  {mostrarIcones && <Icon size={18} />}
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          )}

          {/* Bottom Bar Mobile (fixed bottom) - sempre visível no mobile */}
          <nav className="fixed md:hidden bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
            <div className="flex items-center justify-around py-3">
              {menuLinks.map(({ href, label, icon: Icon }) => (
                <Link 
                  key={href}
                  href={`/loja/${dominio}${href}`}
                  className="flex flex-col items-center gap-1 text-gray-700 hover:text-pink-600 text-xs transition"
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
