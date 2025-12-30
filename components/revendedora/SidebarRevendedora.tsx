"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Package, Palette, LogOut, Menu, X, ShoppingCart, Tag, Settings } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SidebarRevendedora() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', href: '/revendedora/dashboard', icon: Home },
    { label: 'Produtos', href: '/revendedora/produtos', icon: Package },
    { label: 'Carrinhos Abandonados', href: '/revendedora/carrinhos-abandonados', icon: ShoppingCart },
    { label: 'Promoções', href: '/revendedora/promocoes', icon: Tag },
    { label: 'Personalização', href: '/revendedora/personalizacao', icon: Palette },
    { label: 'Configurações', href: '/revendedora/configuracoes', icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login/revendedora');
  };

  return (
    <>
      <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg">
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Painel Revendedora</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie seu catálogo</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.href) ? 'bg-pink-50 text-pink-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button className="flex items-center gap-3 px-4 py-3 w-full text-gray-700 hover:bg-gray-50 rounded-lg transition-all" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
      {mobileMenuOpen && (<div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileMenuOpen(false)} />)}
    </>
  );
}