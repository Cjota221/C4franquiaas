"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import { useLojaInfo } from '@/contexts/LojaContext';
import { ShoppingCart, Home, Package, Info, Phone, User, Search } from 'lucide-react';
import CategorySidebar from './CategorySidebar';
import AnnouncementSlider from './AnnouncementSlider';

export default function LojaHeader({ dominio }: { dominio: string }) {
  const loja = useLojaInfo();
  const totalItens = useCarrinhoStore((state) => state.getTotalItens());

  const [logoLoadError, setLogoLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

    // Verifica se a URL da logo é do Supabase
    if (loja.logo?.includes('supabase')) {
      console.log('[LojaHeader] ✅ URL da logo é do Supabase:', {
        url: loja.logo,
        bucket: loja.logo.split('/logos/')[1]
      });
    } else if (loja.logo) {
      console.log('[LojaHeader] ℹ️ URL da logo (outro domínio):', loja.logo);
    } else {
      console.warn('[LojaHeader] ⚠️ Logo está null/undefined');
    }

    // Log quando houver erro ao carregar
    if (logoLoadError) {
      console.error('[LojaHeader] ❌ Erro ao carregar logo:', {
        url: loja.logo,
        fallbackAtivo: true
      });
    }
  }, [loja, logoPos, menuTipo, topoFlutuante, logoLoadError, dominio]);

  // Classes dinâmicas baseadas nas configurações
  const headerClass = topoFlutuante ? 'sticky top-0 z-50' : 'relative';
  
  // Tamanhos recomendados de logo baseados na posição
  const getLogoSize = () => {
    if (logoPos === 'centro') {
      // Logo no centro: maior destaque
      return loja.logo_formato === 'redondo' 
        ? 'w-28 h-28 md:w-32 md:h-32' // Redondo: 112x112px mobile, 128x128px desktop (aumentado)
        : 'h-24 md:h-28 w-auto max-w-[320px]'; // Horizontal: altura 96-112px (aumentado)
    } else {
      // Logo nas laterais: mais compacto
      return loja.logo_formato === 'redondo'
        ? 'w-16 h-16 md:w-20 md:h-20' // Redondo: 64x64px mobile, 80x80px desktop (aumentado)
        : 'h-14 md:h-16 w-auto max-w-[240px]'; // Horizontal: altura 56-64px (aumentado)
    }
  };

  const logoSizeClass = getLogoSize();
  const logoRoundedClass = loja.logo_formato === 'redondo' ? 'rounded-full' : 'rounded-lg';

  // Gera estilos dinâmicos baseados nas customizações
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
      {/* Só exibe UMA barra de topo: se houver mensagens na régua, mostra só a régua; senão, mostra barra fixa */}
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
          {/* SEÇÃO SUPERIOR: Menu + Logo + Carrinho */}
          <div className="flex items-center justify-between py-4">
            {/* Layout baseado em logo_posicao */}
            {logoPos === 'centro' ? (
              <>
                {/* Centro: Menu esquerda + Logo centro (SEM TEXTO) + User/Carrinho direita */}
                <div className="flex items-center gap-2 flex-1">
                  <CategorySidebar />
                </div>
                
                {/* Logo Centralizada */}
                <Link 
                  href={`/loja/${dominio}`} 
                  className="hover:opacity-90 transition flex-shrink-0"
                  title={loja.nome}
                >
                  {(() => {
                    console.log('[LojaHeader] Renderizando logo - Decisão:', {
                      temLogo: !!loja.logo,
                      logoLoadError,
                      logoUrl: loja.logo
                    });
                    
                    if (loja.logo && !logoLoadError) {
                      console.log('[LojaHeader] → Renderizando <img> direto (sem Next/Image)');
                      return (
                        <div 
                          className={`${logoSizeClass} ${logoRoundedClass} overflow-hidden flex items-center justify-center`}
                          style={getLogoContainerStyle()}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={loja.logo}
                            alt={loja.nome}
                            className="w-full h-full object-contain"
                            style={{ 
                              maxWidth: '100%',
                              maxHeight: '100%',
                              display: 'block'
                            }}
                            onError={() => {
                              console.error('[LojaHeader] Falha ao carregar logo:', loja.logo);
                              setLogoLoadError(true);
                            }}
                            onLoad={() => {
                              console.log('[LojaHeader] ✅ Logo carregada com sucesso!');
                            }}
                          />
                        </div>
                      );
                    } else if (loja.logo && logoLoadError) {
                      console.log('[LojaHeader] → Renderizando <img> fallback');
                      return (
                        <div 
                          className={`${logoSizeClass} ${logoRoundedClass} overflow-hidden flex items-center justify-center`}
                          style={getLogoContainerStyle()}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={loja.logo}
                            alt={loja.nome}
                            className="w-full h-full object-contain"
                            onError={() => console.error('[LojaHeader] Falha ao carregar logo (img fallback):', loja.logo)}
                          />
                        </div>
                      );
                    } else {
                      console.log('[LojaHeader] → Renderizando fallback de inicial');
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
                <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
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
                {/* Esquerda/Direita: Menu + Logo (COM TEXTO) à esquerda, User + Carrinho à direita */}
                <div className="flex items-center gap-3 flex-1">
                  <CategorySidebar />
                  <Link href={`/loja/${dominio}`} className="flex items-center gap-3 hover:opacity-90 transition">
                    {loja.logo ? (
                      <div 
                        className={`${logoSizeClass} ${logoRoundedClass} overflow-hidden flex items-center justify-center`}
                        style={getLogoContainerStyle()}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={loja.logo}
                          alt={loja.nome}
                          className="w-full h-full object-contain"
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

          {/* SEÇÃO INFERIOR: Campo de Busca em Formato Pílula */}
          <div className="flex items-center justify-center pb-4 pt-2">
            <div className="relative w-full max-w-[600px]">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="O que você procura?"
                className="w-full rounded-full border border-gray-300 py-3 pl-12 pr-6 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100 hover:border-gray-400"
                style={{
                  fontSize: '15px',
                }}
              />
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
