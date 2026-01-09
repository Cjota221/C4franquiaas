"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  User, 
  Store, 
  LogOut, 
  Menu, 
  X, 
  Wallet,
  ShoppingBag,
  Tag
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface SidebarSection {
  title: string;
  items: {
    href: string;
    label: string;
    icon: React.ElementType;
  }[];
}

export default function SidebarFranqueada({ franqueadaNome }: { franqueadaNome: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sections: SidebarSection[] = [
    {
      title: 'Visao Geral',
      items: [
        { href: '/revendedora-pro/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Catalogo',
      items: [
        { href: '/revendedora-pro/produtos', label: 'Produtos', icon: Package },
      ]
    },
    {
      title: 'Vendas',
      items: [
        { href: '/revendedora-pro/vendas', label: 'Minhas Vendas', icon: ShoppingBag },
        { href: '/revendedora-pro/comissoes', label: 'Comissoes', icon: Wallet },
      ]
    },
    {
      title: 'Loja',
      items: [
        { href: '/revendedora-pro/loja', label: 'Minha Loja', icon: Store },
        { href: '/revendedora-pro/promocoes', label: 'Promocoes', icon: Tag },
      ]
    },
    {
      title: 'Conta',
      items: [
        { href: '/revendedora-pro/perfil', label: 'Meu Perfil', icon: User },
      ]
    }
  ];

  // Fechar menu ao mudar de página
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevenir scroll do body quando menu mobile está aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login/revendedorapro');
  }

  return (
    <>
      {/* Header Mobile - Visivel apenas em telas pequenas */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Revendedora Pro</p>
          <p className="text-xs text-gray-500 truncate max-w-[200px]">{franqueadaNome}</p>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Abrir menu"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <Menu size={24} className="text-gray-700" />
        </button>
      </div>

      {/* Overlay Mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop + Mobile Drawer */}
      <div
        className={`
          fixed lg:static top-0 left-0 h-screen
          w-64 bg-white border-r border-gray-100 flex flex-col
          z-50 transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header da Sidebar */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-gray-900">Revendedora Pro</p>
              <p className="text-sm text-gray-500 truncate mt-0.5">{franqueadaNome}</p>
            </div>
            {/* Botao fechar (apenas mobile) */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
              aria-label="Fechar menu"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation com secoes */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {sections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
              <p className="px-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-pink-50 text-pink-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-pink-600' : 'text-gray-400'}`} />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Encerrar sessao</span>
          </button>
        </div>
      </div>
    </>
  );
}
