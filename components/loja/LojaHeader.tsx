"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import { useFavoritosStore } from '@/lib/store/favoritosStore';
import { useLojaInfo } from '@/contexts/LojaContext';
import { ShoppingCart, Home, Package, Info, Phone, User, Search, Heart } from 'lucide-react';
import CategorySidebar from './CategorySidebar';
import AnnouncementSlider from './AnnouncementSlider';

type Suggestion = {
  id: string;
  nome: string;
  preco: number;
  imagem: string | null;
  categoria: string | null;
  codigo_barras: string | null;
};

export default function LojaHeader({ dominio }: { dominio: string }) {
  const loja = useLojaInfo();
  const totalItens = useCarrinhoStore((state) => state.getTotalItens());
  const totalFavoritos = useFavoritosStore((state) => state.getTotalItens());
  const router = useRouter();

  const [logoLoadError, setLogoLoadError] = useState(false);
  
  // ========================================================================
  // PARTE 2: FRONTEND - SISTEMA DE BUSCA COM AUTOCOMPLETE
  // ========================================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Configurações dinâmicas do banco
  const logoPos = loja.logo_posicao || 'centro';
  const menuTipo = loja.menu_tipo || 'horizontal';
  const topoFlutuante = loja.topo_flutuante ?? true;
  const mostrarIcones = loja.mostrar_icones_menu ?? true;
  const barraTopoTexto = loja.barra_topo_texto;
  const barraTopoAtiva = loja.barra_topo_ativa ?? true;
  const mensagensRegua = Array.isArray(loja.mensagens_regua) ? loja.mensagens_regua : [];

  // Customizações da Logo (Migration 017)
  const logoLarguraMax = loja.logo_largura_max ?? 280;
  const logoAlturaMax = loja.logo_altura_max ?? 80;
  const logoPadding = loja.logo_padding ?? 0;
  const logoFundoTipo = loja.logo_fundo_tipo || 'transparente';
  const logoFundoCor = loja.logo_fundo_cor || null;
  const logoBorderRadius = loja.logo_border_radius ?? 0;
  const logoMostrarSombra = loja.logo_mostrar_sombra ?? false;

  // ========================================================================
  // DEBOUNCE: Atraso de 300ms para otimizar chamadas à API
  // ========================================================================
  useEffect(() => {
    // Se a query estiver vazia, limpa as sugestões imediatamente
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Define um timeout de 300ms
    const debounceTimer = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);

    // Cleanup: cancela o timeout anterior se o usuÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡rio continuar digitando
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // ========================================================================
  // FUNÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢O DE BUSCA: Chama a API e atualiza as sugestÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âµes
  // ========================================================================
  async function fetchSuggestions(query: string) {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      setIsSearching(true);
      console.log('[LojaHeader] Buscando:', query);

      const response = await fetch(
        `/api/loja/${dominio}/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        console.error('[LojaHeader] Erro na API:', response.status);
        setSuggestions([]);
        return;
      }

      const data = await response.json();

      setSuggestions(data.suggestions || []);
      setShowSuggestions((data.suggestions || []).length > 0);
    } catch (error) {
      console.error('[LojaHeader] Erro ao buscar sugestões:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }

  // ========================================================================
  // CLICK OUTSIDE: Fecha o dropdown ao clicar fora
  // ========================================================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ========================================================================
  // SUBMIT: Redireciona para pÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡gina de produtos com query
  // ========================================================================
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/loja/${dominio}/produtos?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // ========================================================================
  // CLICK NA SUGESTÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢O: Fecha dropdown e limpa busca
  // ========================================================================
  const handleSuggestionClick = () => {
    setShowSuggestions(false);
    setSearchQuery('');
    setSuggestions([]);
  };

  // Debug
  useEffect(() => {
    console.log('[LojaHeader] Estado do componente (cjotarasteirinhas):', {
      logo: loja.logo,
      nome: loja.nome,
      logoPos,
      menuTipo,
      logoFormato: loja.logo_formato,
      topoFlutuante,
      logoLoadError,
      dominio
    });

    // Verifica se a URL da logo ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© do Supabase
    if (loja.logo?.includes('supabase')) {
      // Debug log removed
    } else if (loja.logo) {
          } else {
          }

    // Log quando houver erro ao carregar
    if (logoLoadError) {
      console.error('[LojaHeader]  Erro ao carregar logo:', {
        url: loja.logo,
        fallbackAtivo: true
      });
    }
  }, [loja, logoPos, menuTipo, topoFlutuante, logoLoadError, dominio]);

  // Classes dinÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢micas baseadas nas configuraÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âµes
  const headerClass = topoFlutuante ? 'sticky top-0 z-50' : 'relative';
  
  // Tamanhos recomendados de logo baseados na posiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£o
  const getLogoSize = () => {
    if (logoPos === 'centro') {
      // Logo no centro: maior destaque
      return loja.logo_formato === 'redondo' 
        ? 'w-20 h-20 md:w-32 md:h-32' // Redondo: 112x112px mobile, 128x128px desktop (aumentado)
        : 'h-16 md:h-28 w-auto max-w-[160px] md:max-w-[320px]'; // Horizontal: altura 96-112px (aumentado)
    } else {
      // Logo nas laterais: mais compacto
      return loja.logo_formato === 'redondo'
        ? 'w-14 h-14 md:w-20 md:h-20' // Redondo: 64x64px mobile, 80x80px desktop (aumentado)
        : 'h-12 md:h-16 w-auto max-w-[140px] md:max-w-[240px]'; // Horizontal: altura 56-64px (aumentado)
    }
  };

  const logoSizeClass = getLogoSize();
  const logoRoundedClass = loja.logo_formato === 'redondo' ? 'rounded-full' : 'rounded-lg';

  // Gera estilos dinÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢micos baseados nas customizaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âµes
  const getLogoContainerStyle = (): React.CSSProperties => {
    const styles: React.CSSProperties = {
      maxWidth: `${logoLarguraMax}px`,
      maxHeight: `${logoAlturaMax}px`,
      padding: `${logoPadding}px`,
    };

    // Aplicar fundo baseado no tipo
    if (logoFundoTipo === 'solido' || logoFundoTipo === 'redondo') {
      styles.backgroundColor = logoFundoCor || '#FFFFFF';
    }

    // Border radius
    if (logoFundoTipo === 'redondo') {
      styles.borderRadius = '50%';
    } else {
      styles.borderRadius = `${logoBorderRadius}px`;
    }

    // Sombra
    if (logoMostrarSombra) {
      styles.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    }

    return styles;
  };

  // Links do menu
  const menuLinks = [
    { href: '', label: 'Início', icon: Home },
    { href: '/produtos', label: 'Produtos', icon: Package },
    { href: '/sobre', label: 'Sobre', icon: Info },
    { href: '/contato', label: 'Contato', icon: Phone },
  ];

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
              style={{ backgroundColor: loja.cor_primaria }}
            >
              {barraTopoTexto}
            </div>
          )
        )
      )}

      <header className={`${headerClass} shadow-md bg-white`}>
        <div className="container mx-auto px-4 flex flex-col">
          {/* Barra de topo */}
          <div className="flex items-center justify-between py-4">
            {/* Layout baseado em logo_posicao */}
            {logoPos === 'centro' ? (
              <>
                {/* Centro: Menu esquerda + Logo centro (SEM TEXTO) + User/Carrinho direita */}
                <div className="flex items-center gap-2 flex-shrink min-w-0">                  <CategorySidebar />
                </div>
                
                {/* Logo Centralizada */}
                <Link 
                  href={`/loja/${dominio}`} 
                  className="hover:opacity-90 transition flex-shrink-0 mx-auto"
                  title={loja.nome}
                >
                  {(() => {
                    // Debug log removed
                    
                    if (loja.logo && !logoLoadError) {
                      // Debug log removed
                      return (
                        <div 
                          className={`${logoSizeClass} ${logoRoundedClass} overflow-hidden flex items-center justify-center relative`}
                          style={getLogoContainerStyle()}
                        >
                          <Image
                            src={loja.logo}
                            alt={loja.nome}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 160px, 280px"
                            onError={() => {
                              console.error('[LojaHeader] Falha ao carregar logo:', loja.logo);
                              setLogoLoadError(true);
                            }}
                          />
                        </div>
                      );
                    } else if (loja.logo && logoLoadError) {
                      // Debug log removed
                      return (
                        <div 
                          className={`${logoSizeClass} ${logoRoundedClass} overflow-hidden flex items-center justify-center relative`}
                          style={getLogoContainerStyle()}
                        >
                          <Image
                            src={loja.logo}
                            alt={loja.nome}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 160px, 280px"
                            onError={() => console.error('[LojaHeader] Falha ao carregar logo (img fallback):', loja.logo)}
                          />
                        </div>
                      );
                    } else {
                      // Debug log removed
                      return (
                        <div 
                          className={`${logoSizeClass} ${logoRoundedClass} flex items-center justify-center text-white font-bold text-2xl shadow-md`}
                          style={{ backgroundColor: loja.cor_primaria }}
                        >
                          {loja.nome.charAt(0).toUpperCase()}
                        </div>
                      );
                    }
                  })()}
                </Link>

                {/* User + Carrinho */}
                <div className="flex items-center gap-1 md:gap-4 flex-1 justify-end min-w-[100px]">
                  <Link 
                    href="/login" 
                    className="hidden md:flex items-center gap-2 hover:opacity-80 transition"
                    style={{ color: loja.cor_primaria }}
                  >
                    <User size={20} />
                    <span className="text-sm font-medium">Entrar</span>
                  </Link>
                  
                  <Link
                    href={`/loja/${dominio}/favoritos`}
                    data-testid="favoritos-button"
                    className="relative p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition flex items-center justify-center flex-shrink-0"
                    title="Meus Favoritos"
                  >
                    <Heart 
                      className="w-5 h-5 md:w-6 md:h-6" 
                      style={{ color: loja.cor_primaria }} 
                    />
                    {totalFavoritos > 0 && (
                      <span 
                        className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 min-w-[16px] md:min-w-[20px] h-4 md:h-5 flex items-center justify-center rounded-full text-white text-[10px] md:text-xs font-bold px-1"
                        style={{ backgroundColor: loja.cor_primaria }}
                      >
                        {totalFavoritos}
                      </span>
                    )}
                  </Link>
                  
                  <Link
                    href={`/loja/${dominio}/carrinho`}
                    className="relative p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition flex items-center justify-center flex-shrink-0"
                  >
                    <ShoppingCart 
                      className="w-5 h-5 md:w-6 md:h-6" 
                      style={{ color: loja.cor_primaria }} 
                    />
                    {totalItens > 0 && (
                      <span 
                        className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 min-w-[16px] md:min-w-[20px] h-4 md:h-5 flex items-center justify-center rounded-full text-white text-[10px] md:text-xs font-bold px-1"
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
                {/* Barra de topo */}
                <div className="flex items-center gap-3 flex-1">
                  <CategorySidebar />
                  <Link href={`/loja/${dominio}`} className="flex items-center gap-3 hover:opacity-90 transition">
                    {loja.logo ? (
                      <div 
                        className={`${logoSizeClass} ${logoRoundedClass} overflow-hidden flex items-center justify-center relative`}
                        style={getLogoContainerStyle()}
                      >
                        <Image
                          src={loja.logo}
                          alt={loja.nome}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 160px, 280px"
                        />
                      </div>
                    ) : (
                      <div 
                        className={`${logoSizeClass} ${logoRoundedClass} flex items-center justify-center text-white font-bold`}
                        style={{ backgroundColor: loja.cor_primaria }}
                      >
                        {loja.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span 
                      className="font-bold text-lg md:text-xl hidden sm:block" 
                      style={{ color: loja.cor_primaria }}
                    >
                      {loja.nome}
                    </span>
                  </Link>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                  <Link 
                    href="/login" 
                    className="hidden md:flex items-center gap-2 hover:opacity-80 transition"
                    style={{ color: loja.cor_primaria }}
                  >
                    <User size={20} />
                    <span className="text-sm font-medium">Entrar</span>
                  </Link>
                  
                  <Link
                    href={`/loja/${dominio}/favoritos`}
                    data-testid="favoritos-button"
                    className="relative p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition flex items-center justify-center flex-shrink-0"
                    title="Meus Favoritos"
                  >
                    <Heart 
                      className="w-5 h-5 md:w-6 md:h-6" 
                      style={{ color: loja.cor_primaria }} 
                    />
                    {totalFavoritos > 0 && (
                      <span 
                        className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 min-w-[16px] md:min-w-[20px] h-4 md:h-5 flex items-center justify-center rounded-full text-white text-[10px] md:text-xs font-bold px-1"
                        style={{ backgroundColor: loja.cor_primaria }}
                      >
                        {totalFavoritos}
                      </span>
                    )}
                  </Link>
                  
                  <Link
                    href={`/loja/${dominio}/carrinho`}
                    className="relative p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition flex items-center justify-center flex-shrink-0"
                  >
                    <ShoppingCart 
                      className="w-5 h-5 md:w-6 md:h-6" 
                      style={{ color: loja.cor_primaria }} 
                    />
                    {totalItens > 0 && (
                      <span 
                        className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 min-w-[16px] md:min-w-[20px] h-4 md:h-5 flex items-center justify-center rounded-full text-white text-[10px] md:text-xs font-bold px-1"
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

          {/* Barra de topo */}
          <div className="flex items-center justify-center pb-4 pt-2">
            <div ref={searchRef} className="relative w-full max-w-[600px]">
              {/* Barra de topo */}
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={20} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="O que você procura?"
                    className="w-full rounded-full border border-gray-300 py-3 pl-12 pr-6 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100 hover:border-gray-400"
                    style={{
                      fontSize: '15px',
                    }}
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-pink-500"></div>
                    </div>
                  )}
                </div>
              </form>

              {/* Barra de topo */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[400px] overflow-y-auto z-50">
                  {suggestions.map((suggestion) => (
                    <Link
                      key={suggestion.id}
                      href={`/loja/${dominio}/produto/${suggestion.id}`}
                      onClick={handleSuggestionClick}
                      className="flex items-center gap-4 p-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-0"
                    >
                      {/* Imagem do Produto */}
                      <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                        {suggestion.imagem ? (
                          <Image
                            src={suggestion.imagem}
                            alt={suggestion.nome}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-5 h-5 md:w-6 md:h-6" />
                          </div>
                        )}
                      </div>

                      {/* Barra de topo */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.nome}
                        </h4>
                        {suggestion.categoria && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {suggestion.categoria}
                          </p>
                        )}
                        {suggestion.codigo_barras && (
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">
                            Cód: {suggestion.codigo_barras}
                          </p>
                        )}
                      </div>

                      {/* Barra de topo */}
                      <div className="flex-shrink-0">
                        <p className="text-sm font-bold" style={{ color: loja.cor_primaria }}>
                          R$ {suggestion.preco.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </Link>
                  ))}
                  
                  {/* Footer: Ver todos os resultados */}
                  <Link
                    href={`/loja/${dominio}/produtos?search=${encodeURIComponent(searchQuery)}`}
                    onClick={handleSuggestionClick}
                    className="block p-3 text-center text-sm font-medium transition"
                    style={{ color: loja.cor_primaria }}
                  >
                    Ver todos os resultadosÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢
                  </Link>
                </div>
              )}
            </div>
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

          {/* Barra de topo */}
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
              
              {/* Favoritos - Mobile */}
              <Link
                href={`/loja/${dominio}/favoritos`}
                className="flex flex-col items-center gap-1 text-gray-700 hover:text-pink-600 text-xs transition relative"
              >
                <Heart size={20} style={{ color: loja.cor_primaria }} />
                <span>Favoritos</span>
                {totalFavoritos > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1"
                    style={{ backgroundColor: loja.cor_primaria }}
                  >
                    {totalFavoritos}
                  </span>
                )}
              </Link>
              
              {/* Carrinho - Mobile */}
              <Link
                href={`/loja/${dominio}/carrinho`}
                className="flex flex-col items-center gap-1 text-gray-700 hover:text-pink-600 text-xs transition relative"
              >
                <ShoppingCart size={20} style={{ color: loja.cor_primaria }} />
                <span>Carrinho</span>
                {totalItens > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1"
                    style={{ backgroundColor: loja.cor_primaria }}
                  >
                    {totalItens}
                  </span>
                )}
              </Link>
              
            </div>
          </nav>
        </div>
      </header>    </>
  );
}