"use client";

import React from 'react';
import { Package, Store, ShoppingCart, DollarSign } from 'lucide-react';

// Dados de exemplo para o dashboard (serão dinâmicos no futuro)
const stats = [
  { title: 'Total de Produtos', value: '78', icon: Package, color: 'bg-pink-500' },
  { title: 'Franquias Ativas', value: '12', icon: Store, color: 'bg-yellow-500' },
  { title: 'Pedidos Hoje', value: '34', icon: ShoppingCart, color: 'bg-green-500' },
  { title: 'Faturamento (mês)', value: 'R$ 45.8k', icon: DollarSign, color: 'bg-blue-500' },
];

// Componente da página Dashboard — será renderizado dentro de app/(admin)/layout.tsx
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Cabeçalho da Página */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="mt-2 text-gray-600">Bem-vinda ao seu painel administrativo!</p>
        </div>

        <div>
          <button className="px-4 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Verificar Integração
          </button>
        </div>
      </header>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="font-bold text-lg text-gray-700">Faturamento Total</h3>
          <p className="mt-2 text-3xl font-semibold text-[#DB1472]">R$ 0,00</p>
          <p className="mt-1 text-sm text-gray-500">(Em desenvolvimento)</p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="font-bold text-lg text-gray-700">Comissões a Pagar</h3>
          <p className="mt-2 text-3xl font-semibold text-[#DB1472]">R$ 0,00</p>
          <p className="mt-1 text-sm text-gray-500">(Em desenvolvimento)</p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="font-bold text-lg text-gray-700">Franquias Ativas</h3>
          <p className="mt-2 text-3xl font-semibold text-[#DB1472]">0</p>
          <p className="mt-1 text-sm text-gray-500">(Em desenvolvimento)</p>
        </div>
      </div>
    </div>
  );
}
