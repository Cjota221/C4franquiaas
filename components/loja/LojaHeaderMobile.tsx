"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import { useLojaInfo } from '@/contexts/LojaContext';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';
import MobileMenu from './MobileMenu';
import AnnouncementSlider from './AnnouncementSlider';

type Suggestion = {
  id: string;
  nome: string;
  preco: number;
  imagem: string | null;
};

export default function LojaHeaderMobile({ dominio }: { dominio: string }) {
  const loja = useLojaInfo();
  const totalItens = useCarrinhoStore((state) => state.getTotalItens());  const router = useRouter();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Configurações dinâmicas
  const barraTopoTexto = loja.barra_topo_texto;
  const barraTopoAtiva = loja.barra_topo_ativa ?? true;
  const mensagensRegua = Array.isArray(loja.mensagens_regua) ? loja.mensagens_regua : [];
  
  // Customizações da Logo
  const logoBorderRadius = loja.logo_border_radius ?? 0;
  const logoMostrarSombra = loja.logo_mostrar_sombra ?? false;

  // Debounce para busca
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/loja/${dominio}/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
        const data = await res.json();
        setSuggestions(data.produtos || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Erro ao buscar:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, dominio]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/loja/${dominio}/produtos?search=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

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

      {/* Header Mobile */}
      <header className="sticky top-0 z-50 bg-white shadow-md md:hidden" style={{ backgroundColor: loja.cor_primaria }}>
        {/* Linha 1: Menu + Logo + Carrinho */}
        <div className="flex items-center justify-between px-4 py-2">
          {/* Menu Hambúrguer */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
            aria-label="Abrir menu"
            style={{
              minWidth: '44px',
              minHeight: '44px',
            }}
          >
            <Menu 
              size={26} 
              className="text-white"
            />
          </button>

          {/* Logo Centralizada */}
          <Link 
            href={`/loja/${dominio}`}
            className="flex-1 flex justify-center items-center px-3"
          >
            {loja.logo ? (
              <div 
                className="relative overflow-hidden flex items-center justify-center"
                style={{
                  ...getLogoStyle(),
                  width: 'clamp(110px, 32vw, 160px)',
                  height: 'clamp(45px, 14vw, 65px)',
                }}
              >
                <Image
                  src={loja.logo}
                  alt={loja.nome}
                  fill
                  className="object-contain"
                  sizes="160px"
                />
              </div>
            ) : (
              <h1 
                className="font-bold truncate text-white"
                style={{ 
                  fontSize: 'clamp(18px, 5vw, 24px)',
                }}
              >
                {loja.nome}
              </h1>
            )}
          </Link>

          {/* Carrinho */}
          <Link
            href={`/loja/${dominio}/carrinho`}
            className="relative p-2 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
            style={{
              minWidth: '44px',
              minHeight: '44px',
            }}
          >
            <ShoppingCart 
              size={26} 
              className="text-white"
            />
            {totalItens > 0 && (
              <span 
                className="absolute top-0 right-0 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-white text-xs font-bold px-1"
                style={{ 
                  color: loja.cor_primaria,
                }}
              >
                {totalItens > 99 ? '99+' : totalItens}
              </span>
            )}
          </Link>
        </div>

        {/* Linha 2: Barra de Busca - Dentro do header colorido */}
        <div className="px-4 pb-3" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center">
              <Search 
                size={20} 
                className="absolute left-4 pointer-events-none" 
                style={{ color: loja.cor_primaria }}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                placeholder="Buscar produtos..."
                className="w-full pl-11 pr-10 py-2.5 bg-white border-0 rounded-full focus:outline-none focus:ring-2 transition-colors"
                style={{
                  fontSize: 'clamp(14px, 4vw, 16px)',
                  minHeight: '44px',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 p-1.5 hover:bg-gray-100 rounded-full"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* Sugestões de Busca */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-80 overflow-y-auto z-50">
                {suggestions.map((produto) => (
                  <Link
                    key={produto.id}
                    href={`/loja/${dominio}/produto/${produto.id}`}
                    onClick={() => {
                      setShowSuggestions(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100 last:border-0"
                  >
                    {produto.imagem ? (
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                        <Image 
                          src={produto.imagem} 
                          alt={produto.nome}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-200 rounded-lg" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate" style={{ fontSize: 'clamp(13px, 3.5vw, 15px)' }}>
                        {produto.nome}
                      </p>
                      <p className="font-bold text-green-600" style={{ fontSize: 'clamp(14px, 4vw, 16px)' }}>
                        R$ {produto.preco.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </form>
        </div>
      </header>

      {/* Menu Drawer */}
      <MobileMenu 
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        dominio={dominio}
        lojaNome={loja.nome}
        corPrimaria={loja.cor_primaria}
      />
    </>
  );
}
