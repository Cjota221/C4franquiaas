"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import { useLojaInfo } from '@/contexts/LojaContext';
import { ShoppingCart, Search, Menu } from 'lucide-react';
import MobileMenu from './MobileMenu';
import MobileSearchModal from './MobileSearchModal';
import AnnouncementSlider from './AnnouncementSlider';

export default function LojaHeaderMobile({ dominio }: { dominio: string }) {
  const loja = useLojaInfo();
  const totalItens = useCarrinhoStore((state) => state.getTotalItens());
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Configurações dinâmicas
  const barraTopoTexto = loja.barra_topo_texto;
  const barraTopoAtiva = loja.barra_topo_ativa ?? true;
  const mensagensRegua = Array.isArray(loja.mensagens_regua) ? loja.mensagens_regua : [];
  
  // Customizações da Logo
  const logoBorderRadius = loja.logo_border_radius ?? 0;
  const logoMostrarSombra = loja.logo_mostrar_sombra ?? false;

  const getLogoStyle = (): React.CSSProperties => {
    const styles: React.CSSProperties = {
      borderRadius: `${logoBorderRadius}px`,
    };

    if (logoMostrarSombra) {
      styles.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    }

    return styles;
  };

  return (
    <>
      {/* Barra de topo */}
      {barraTopoAtiva && (
        mensagensRegua.length > 0 ? (
          <AnnouncementSlider 
            messages={mensagensRegua}
            backgroundColor={loja.barra_topo_cor || loja.cor_primaria}
            textColor={loja.barra_topo_texto_cor || '#FFFFFF'}
            speed={loja.barra_topo_speed ?? 50}
            fontSize={loja.barra_topo_font_size ?? 14}
          />
        ) : (
          barraTopoTexto && (
            <div 
              className="w-full py-2 text-center text-sm font-medium text-white"
              style={{ 
                backgroundColor: loja.cor_primaria,
                fontSize: 'clamp(12px, 3.5vw, 14px)'
              }}
            >
              {barraTopoTexto}
            </div>
          )
        )
      )}

      {/* Header Mobile - Linha Única */}
      <header className="sticky top-0 z-50 bg-white shadow-md md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu Hambúrguer */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
            aria-label="Abrir menu"
            style={{
              minWidth: '44px',
              minHeight: '44px',
            }}
          >
            <Menu size={24} className="text-gray-700" />
          </button>

          {/* Logo Centralizada */}
          <Link 
            href={`/loja/${dominio}`}
            className="flex-1 flex justify-center items-center px-2"
          >
            {loja.logo ? (
              <div 
                className="relative overflow-hidden flex items-center justify-center"
                style={{
                  ...getLogoStyle(),
                  width: 'clamp(80px, 25vw, 120px)',
                  height: 'clamp(40px, 12vw, 56px)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={loja.logo}
                  alt={loja.nome}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <h1 
                className="font-bold truncate"
                style={{ 
                  color: loja.cor_primaria,
                  fontSize: 'clamp(16px, 4vw, 20px)',
                }}
              >
                {loja.nome}
              </h1>
            )}
          </Link>

          {/* Ícones da direita */}
          <div className="flex items-center gap-1">
            {/* Busca */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
              aria-label="Buscar produtos"
              style={{
                minWidth: '44px',
                minHeight: '44px',
              }}
            >
              <Search size={22} className="text-gray-700" />
            </button>

            {/* Carrinho */}
            <Link
              href={`/loja/${dominio}/carrinho`}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
              style={{
                minWidth: '44px',
                minHeight: '44px',
              }}
            >
              <ShoppingCart size={22} className="text-gray-700" />
              {totalItens > 0 && (
                <span 
                  className="absolute top-0 right-0 min-w-[20px] h-5 flex items-center justify-center rounded-full text-white text-xs font-bold px-1.5"
                  style={{ 
                    backgroundColor: loja.cor_primaria,
                    fontSize: 'clamp(10px, 2.5vw, 12px)',
                  }}
                >
                  {totalItens > 99 ? '99+' : totalItens}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Componentes Modal */}
      <MobileMenu 
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        dominio={dominio}
        lojaNome={loja.nome}
        corPrimaria={loja.cor_primaria}
      />

      <MobileSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        dominio={dominio}
        corPrimaria={loja.cor_primaria}
      />
    </>
  );
}
