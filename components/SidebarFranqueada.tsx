"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, User, Store, LogOut, Settings, Menu, X, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function SidebarFranqueada({ franqueadaNome }: { franqueadaNome: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/franqueada/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/franqueada/produtos', label: 'Meus Produtos', icon: Package },
    { href: '/franqueada/comissoes', label: 'Minhas Comissões', icon: Wallet },
    { href: '/franqueada/loja', label: 'Minha Loja', icon: Store },
    { href: '/franqueada/customizacoes', label: 'Customizações', icon: Settings },
    { href: '/franqueada/perfil', label: 'Meu Perfil', icon: User }
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
    router.push('/franqueada/login');
  }

  return (
    <>
      {/* Header Mobile - Visível apenas em telas pequenas */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-pink-600">C4 Franquias</h1>
          <p className="text-xs text-gray-600 truncate max-w-[200px]">{franqueadaNome}</p>
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
          w-64 bg-white border-r border-gray-200 flex flex-col
          z-50 transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header da Sidebar */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-pink-600">C4 Franquias</h1>
            <p className="text-sm text-gray-600 mt-1 truncate">{franqueadaNome}</p>
          </div>
          {/* Botão fechar (apenas mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fechar menu"
          >
            <X size={20} className="text-gray-700" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-pink-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition active:bg-red-100"
            style={{ minHeight: '44px' }}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
}
