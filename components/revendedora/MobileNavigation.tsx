"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Package, 
  GraduationCap, 
  User,
  Menu,
  X,
  Palette,
  FolderOpen,
  Settings,
  Tag,
  ShoppingCart,
  BookOpen,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Itens da Bottom Navigation (principais)
const bottomNavItems = [
  { href: '/revendedora/dashboard', icon: Home, label: 'Início' },
  { href: '/revendedora/produtos', icon: Package, label: 'Produtos' },
  { href: '/revendedora/academy', icon: GraduationCap, label: 'Academy' },
  { href: '/revendedora/configuracoes', icon: User, label: 'Perfil' },
];

// Itens do Drawer (secundários)
const drawerItems = [
  { href: '/revendedora/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/revendedora/personalizacao', icon: Palette, label: 'Personalização' },
  { href: '/revendedora/produtos', icon: Package, label: 'Produtos' },
  { href: '/revendedora/promocoes', icon: Tag, label: 'Promoções' },
  { href: '/revendedora/carrinhos-abandonados', icon: ShoppingCart, label: 'Carrinhos Abandonados' },
  { href: '/revendedora/material-divulgacao', icon: FolderOpen, label: 'Material de Divulgação' },
  { href: '/revendedora/academy', icon: GraduationCap, label: 'C4 Academy', highlight: true },
  { href: '/revendedora/tutoriais', icon: BookOpen, label: 'Tutoriais' },
  { href: '/revendedora/configuracoes', icon: Settings, label: 'Configurações' },
];

export default function MobileNavigation() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login/revendedora';
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Bottom Navigation - Fixo no rodapé (Mobile Only) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[64px]
                  transition-colors
                  ${active 
                    ? 'text-pink-600' 
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <div className={`
                  p-1.5 rounded-xl transition-colors
                  ${active ? 'bg-pink-100' : ''}
                `}>
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          {/* Botão Menu */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[64px]
                     text-gray-500 hover:text-gray-700 transition-colors"
          >
            <div className="p-1.5">
              <Menu className="w-5 h-5" strokeWidth={2} />
            </div>
            <span className="text-xs font-medium">Menu</span>
          </button>
        </div>
      </nav>

      {/* Drawer/Sidebar */}
      <div className={`
        lg:hidden fixed inset-0 z-50 transition-opacity duration-300
        ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}>
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={() => setDrawerOpen(false)}
        />
        
        {/* Drawer Panel */}
        <div className={`
          absolute top-0 right-0 bottom-0 w-[280px] bg-white
          transform transition-transform duration-300 ease-out
          ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Menu</h2>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              {drawerItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const highlight = 'highlight' in item && item.highlight;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${active 
                        ? 'bg-pink-50 text-pink-600' 
                        : highlight
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 font-medium">{item.label}</span>
                    {highlight && !active && (
                      <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                        Novo
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer - Logout */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair da Conta</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
