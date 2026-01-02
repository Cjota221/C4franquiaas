// Garante que este componente só será usado no lado do cliente
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Importa os ícones que vamos usar
import { LayoutDashboard, Package, Store, BarChart, Settings, LogOut, Coins, UserPlus, Truck, ImageIcon, BarChart3 } from 'lucide-react';

// Define os tipos de dados que o componente Sidebar espera receber
interface SidebarProps {
  view?: string;
  setView?: (view: string) => void;
  onLogout?: () => void;
  mobile?: boolean;
}

// O componente da barra lateral
const Sidebar: React.FC<SidebarProps> = ({ view, setView, onLogout = () => {}, mobile = false }) => {
  // Lista de itens de navegação
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { id: 'produtos', label: 'Produtos', icon: Package, href: '/admin/produtos' },
    { id: 'franqueadas', label: 'Franqueadas', icon: Store, href: '/admin/franqueadas' },
    { id: 'revendedoras', label: 'Revendedoras', icon: UserPlus, href: '/admin/revendedoras' },
    { id: 'afiliados', label: 'Afiliados', icon: UserPlus, href: '/admin/afiliados' },
    { id: 'pedidos', label: 'Pedidos', icon: Truck, href: '/admin/pedidos' },
    { id: 'moderacao', label: 'Moderação', icon: ImageIcon, href: '/admin/moderacao/banners' },
    { id: 'comissoes', label: 'Comissões', icon: Coins, href: '/admin/comissoes' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart, disabled: true },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, href: '/admin/configuracoes' },
  ];

  // Classes de estilo para os botões (ativo vs. inativo)
  const activeClass = "bg-[#DB1472] text-white";
  const inactiveClass = "text-[#333] hover:bg-[#F8B81F]/20";

  const rootClass = mobile
    ? 'w-64 bg-white flex flex-col h-full p-4 border-r border-gray-200 shadow-lg'
    : 'hidden md:flex md:fixed md:top-0 md:left-0 md:w-64 md:bg-white md:flex-col md:h-screen md:p-4 md:border-r md:border-gray-200 md:shadow-lg md:overflow-y-auto';

  const pathname = usePathname();

  return (
    <div className={rootClass}>
      {/* Logo */}
      <div className="flex items-center mb-10 pl-2">
        <h1 className="text-3xl font-bold text-[#DB1472]">C4 Franquias</h1>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-grow">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = item.href ? pathname?.startsWith(item.href) : view === item.id;

          const classes = `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-lg transition-all mb-2 ${isActive ? activeClass : inactiveClass} ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

          if (item.disabled) {
            return (
              <button key={item.id} disabled className={classes}>
                <Icon className="w-6 h-6" />
                {item.label}
              </button>
            );
          }

          return (
            <Link key={item.id} href={item.href ?? '#'} onClick={() => setView?.(item.id)} className={classes}>
              <Icon className="w-6 h-6" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Botão de Sair */}
      <div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-lg text-[#333] hover:bg-[#F8B81F]/20 transition-all"
        >
          <LogOut className="w-6 h-6" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

