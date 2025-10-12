// Garante que este componente só será usado no lado do cliente
"use client";

import React from 'react';
import { Package, Store, ShoppingCart, DollarSign } from 'lucide-react';

// Dados de exemplo para o dashboard (serão dinâmicos no futuro)
const stats = [
  {
    title: "Total de Produtos",
    value: "78",
    icon: Package,
    color: "bg-pink-500",
  },
  {
    title: "Franquias Ativas",
    value: "12",
    icon: Store,
    color: "bg-yellow-500",
  },
  {
    title: "Pedidos Hoje",
    value: "34",
    icon: ShoppingCart,
    color: "bg-green-500",
  },
  {
    title: "Faturamento (mês)",
    value: "R$ 45.8k",
    icon: DollarSign,
    color: "bg-blue-500",
  },
];

// Componente da página Dashboard
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Título da Página */}
      <header>
        <h1 className="text-4xl font-bold text-[#333]">Dashboard</h1>
        <p className="text-lg text-gray-500 mt-1">Bem-vindo ao painel da Matriz C4 Franquias.</p>
      </header>

      {/* Grid com os cartões de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white p-6 rounded-2xl shadow-lg flex items-center gap-6 transition-transform hover:scale-105">
            <div className={`p-4 rounded-full text-white ${stat.color}`}>
              <stat.icon size={32} />
            </div>
            <div>
              <p className="text-gray-500 text-md">{stat.title}</p>
              <p className="text-3xl font-bold text-[#333]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Área para futuros gráficos ou tabelas */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-[#333]">Visão Geral de Vendas</h2>
        <div className="mt-4 h-64 flex items-center justify-center text-gray-400">
          <p>(Área reservada para o gráfico de vendas futuras)</p>
        </div>
      </div>
    </div>
  );
}
