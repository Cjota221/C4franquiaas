"use client";

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Package, 
  GraduationCap, 
  User,
  X,
  Palette,
  FolderOpen,
  Settings,
  Tag,
  ShoppingCart,
  BookOpen,
  LogOut,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import MobileHeader from './MobileHeader';

// Itens da Bottom Navigation (principais)
const bottomNavItems = [
  { href: '/revendedora/dashboard', icon: Home, label: 'Início' },
  { href: '/revendedora/produtos', icon: Package, label: 'Produtos' },
  { href: '/revendedora/academy', icon: GraduationCap, label: 'Academy' },
  { href: '/revendedora/configuracoes', icon: User, label: 'Perfil' },
];

// Itens principais do Drawer
const drawerMainItems = [
  { href: '/revendedora/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/revendedora/personalizacao', icon: Palette, label: 'Personalização' },
  { href: '/revendedora/produtos', icon: Package, label: 'Produtos' },
  { href: '/revendedora/promocoes', icon: Tag, label: 'Promoções' },
  { href: '/revendedora/carteira', icon: Wallet, label: 'Carteira', highlight: true },
  { href: '/revendedora/carrinhos-abandonados', icon: ShoppingCart, label: 'Carrinhos Abandonados' },
  { href: '/revendedora/material-divulgacao', icon: FolderOpen, label: 'Material de Divulgação' },
  { href: '/revendedora/academy', icon: GraduationCap, label: 'C4 Academy', highlight: true },
  { href: '/revendedora/tutoriais', icon: BookOpen, label: 'Tutoriais' },
];

// Itens fixos no rodapé do Drawer
const drawerFooterItems = [
  { href: '/revendedora/configuracoes', icon: Settings, label: 'Configurações' },
];

export default function MobileNavigation() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login/revendedora';
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* ========== HEADER (App Bar) ========== */}
      <MobileHeader onMenuClick={openDrawer} />

      {/* ========== BOTTOM BAR ========== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-bottom">
        <div className="bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-around h-16 px-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex flex-col items-center justify-center gap-0.5 flex-1 py-2
                    transition-all duration-200
                    ${active 
                      ? 'text-pink-600' 
                      : 'text-gray-500 active:text-gray-700'
                    }
                  `}
                >
                  <div className={`
                    p-1.5 rounded-xl transition-all duration-200
                    ${active ? 'bg-pink-100' : ''}
                  `}>
                    <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span className={`
                    text-[10px] leading-tight
                    ${active ? 'font-bold' : 'font-medium'}
                  `}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ========== DRAWER (Slide da Esquerda) ========== */}
      <div className={`
        lg:hidden fixed inset-0 z-50 transition-opacity duration-300
        ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}>
        {/* Backdrop escuro */}
        <div 
          className={`
            absolute inset-0 bg-black/60 backdrop-blur-sm
            transition-opacity duration-300
            ${drawerOpen ? 'opacity-100' : 'opacity-0'}
          `}
          onClick={closeDrawer}
        />
        
        {/* Drawer Panel - ESQUERDA */}
        <div className={`
          absolute top-0 left-0 bottom-0 w-[280px] max-w-[85vw] bg-white
          flex flex-col
          transform transition-transform duration-300 ease-out shadow-2xl
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Header do Drawer */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 
                        bg-gradient-to-r from-pink-500 to-purple-500 text-white">
            <div>
              <h2 className="text-lg font-bold">Painel C4</h2>
              <p className="text-xs text-white/80">Gerencie sua loja</p>
            </div>
            {/* Botão X */}
            <button
              onClick={closeDrawer}
              className="p-2 -mr-2 hover:bg-white/20 rounded-xl transition-all active:scale-95"
              aria-label="Fechar menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Menu Items - Área scrollável */}
          <nav className="flex-1 overflow-y-auto py-3 px-3">
            <div className="space-y-1">
              {drawerMainItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const highlight = 'highlight' in item && item.highlight;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeDrawer}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-[0.98]
                      ${active 
                        ? 'bg-pink-50 text-pink-600 shadow-sm' 
                        : highlight
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-100'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }
                    `}
                  >
                    <div className={`
                      w-9 h-9 rounded-lg flex items-center justify-center
                      ${active 
                        ? 'bg-pink-100' 
                        : highlight 
                          ? 'bg-purple-100' 
                          : 'bg-gray-100'
                      }
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="flex-1 font-medium text-[15px]">{item.label}</span>
                    {highlight && !active && (
                      <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-semibold">
                        NOVO
                      </span>
                    )}
                    <ChevronRight className={`w-4 h-4 ${active ? 'text-pink-400' : 'text-gray-300'}`} />
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer - Configurações e Logout fixos */}
          <div className="border-t border-gray-100 bg-gray-50/50 p-3 space-y-1">
            {/* Configurações */}
            {drawerFooterItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeDrawer}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${active 
                      ? 'bg-pink-50 text-pink-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? 'bg-pink-100' : 'bg-gray-100'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="flex-1 font-medium text-[15px]">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              );
            })}
            
            {/* Botão Sair */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 
                       rounded-xl transition-all active:scale-[0.98]"
            >
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-medium text-[15px]">Sair da Conta</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
