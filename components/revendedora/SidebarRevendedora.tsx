"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Package, Palette, LogOut, Menu, X, ShoppingCart, Tag, Settings, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import NotificationBell from './NotificationBell';
import { useNewProductsCount } from '@/hooks/useNewProductsCount';

const SidebarRevendedora = React.memo(function SidebarRevendedora() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { count: newProductsCount } = useNewProductsCount();

  const menuItems = [
    { label: 'Dashboard', href: '/revendedora/dashboard', icon: Home },
    { label: 'Produtos', href: '/revendedora/produtos', icon: Package, badge: newProductsCount },
    { label: 'Carrinhos Abandonados', href: '/revendedora/carrinhos-abandonados', icon: ShoppingCart },
    { label: 'Promoções', href: '/revendedora/promocoes', icon: Tag },
    { label: 'Personalização', href: '/revendedora/personalizacao', icon: Palette },
    { label: 'Configurações', href: '/revendedora/configuracoes', icon: Settings },
    { label: 'Tutoriais', href: '/revendedora/tutoriais', icon: BookOpen, highlight: true },
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login/revendedora');
  };

  return (
    <>
      {/* Botão Hamburger - Fixo no topo */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
        aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar - Mobile: Full Height | Desktop: Sticky */}
      <aside className={`
        fixed lg:sticky 
        top-0 left-0 
        h-screen 
        w-64 
        bg-white 
        border-r border-gray-200 
        flex flex-col 
        z-40 
        transition-transform duration-300 
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header da Sidebar */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Painel Revendedora</h1>
              <p className="text-sm text-gray-500 mt-1">Gerencie seu catálogo</p>
            </div>
            <NotificationBell />
          </div>
        </div>

        {/* Menu Items - Flex-1 para ocupar espaço disponível */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const showBadge = item.badge && item.badge > 0;
            const isHighlight = 'highlight' in item && item.highlight;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={() => setMobileMenuOpen(false)} 
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative
                  ${isActive(item.href) 
                    ? 'bg-pink-50 text-pink-600 font-medium shadow-sm' 
                    : isHighlight
                      ? 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon size={20} className={isHighlight && !isActive(item.href) ? 'text-purple-500' : ''} />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="ml-auto bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
                {isHighlight && !isActive(item.href) && (
                  <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                    Novo
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer - Botão Sair */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button 
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all" 
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Overlay escuro quando menu mobile está aberto */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}
    </>
  );
});

export default SidebarRevendedora;