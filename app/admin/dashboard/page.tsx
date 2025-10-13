"use client";

import React from 'react';

export default function DashboardPage() {
  return (
    <>
      {/* Cabeçalho da Página */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="mt-2 text-gray-600">Bem-vinda ao seu painel administrativo!</p>
        </div>
        <div>
          <button className="px-4 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Verificar Integração
          </button>
        </div>
      </div>
      
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
    </>
  );
}

