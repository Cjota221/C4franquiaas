"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, User, LogOut, Store } from 'lucide-react';

interface SidebarFranqueadoProps {
  onLogout: () => void;
  franqueadaNome?: string;
}

const SidebarFranqueado: React.FC<SidebarFranqueadoProps> = ({ onLogout, franqueadaNome = 'Franqueado' }) => {
  const pathname = usePathname();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/franqueado/dashboard' },
    { id: 'produtos', label: 'Meus Produtos', icon: Package, href: '/franqueado/produtos' },
    { id: 'perfil', label: 'Meu Perfil', icon: User, href: '/franqueado/perfil' },
  ];

  const activeClass = "bg-pink-600 text-white";
  const inactiveClass = "text-gray-700 hover:bg-pink-50";

  return (
    <div className="hidden md:flex md:w-64 md:bg-white md:flex-col md:h-screen md:p-4 md:border-r md:border-gray-200 md:shadow-lg">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 pl-2">
        <Store className="w-8 h-8 text-pink-600" />
        <div>
          <h1 className="text-2xl font-bold text-pink-600">C4 Franquias</h1>
          <p className="text-xs text-gray-500">{franqueadaNome}</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-grow">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname?.startsWith(item.href);
          const classes = `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all mb-2 ${isActive ? activeClass : inactiveClass}`;

          return (
            <Link key={item.id} href={item.href} className={classes}>
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Botão de Sair */}
      <div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-pink-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default SidebarFranqueado;
