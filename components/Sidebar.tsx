// Garante que este componente só será usado no lado do cliente
"use client";

import React from 'react';
// Importa os ícones que vamos usar
import { LayoutDashboard, Package, Store, BarChart, Settings, LogOut } from 'lucide-react';

// Define os tipos de dados que o componente Sidebar espera receber
interface SidebarProps {
  view?: string;
  setView?: (view: string) => void;
  onLogout: () => void;
}

// O componente da barra lateral
const Sidebar: React.FC<SidebarProps> = ({ view, setView, onLogout }) => {
  // Lista de itens de navegação
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'franquias', label: 'Franqueadas', icon: Store },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart, disabled: true },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, disabled: true },
  ];

  // Classes de estilo para os botões (ativo vs. inativo)
  const activeClass = "bg-[#DB1472] text-white";
  const inactiveClass = "text-[#333] hover:bg-[#F8B81F]/20";

  return (
    <div className="w-64 bg-white flex flex-col h-screen p-4 border-r border-gray-200 shadow-lg fixed">
      {/* Logo */}
      <div className="flex items-center mb-10 pl-2">
        <h1 className="text-3xl font-bold text-[#DB1472]">C4 Franquias</h1>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-grow">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && setView?.(item.id)}
              disabled={item.disabled}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-lg transition-all mb-2 ${view === item.id ? activeClass : inactiveClass} ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon className="w-6 h-6" />
              {item.label}
            </button>
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
