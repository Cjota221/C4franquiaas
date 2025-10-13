/**
 * Layout principal para a área administrativa.
 * Inclui uma barra lateral de navegação e uma área de conteúdo.
 */
"use client";

import React from 'react';

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Barra Lateral de Navegação */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-[#DB1472]">C4 Franquias</h2>
          <p className="text-sm text-gray-500 mt-1">Painel Admin</p>
        </div>
        <nav className="mt-6 flex-1">
          <a href="/admin/dashboard" className="block px-6 py-3 text-gray-700 bg-gray-200 font-bold">
            Dashboard
          </a>
          <a href="/admin/produtos" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
            Produtos
          </a>
          <a href="/admin/franquias" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
            Franquias
          </a>
          <a href="/admin/vendas" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
            Vendas
          </a>
           <a href="/admin/comissoes" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
            Comissões
          </a>
        </nav>
        <div className="p-6">
           <a href="/admin/configuracoes" className="block px-6 py-3 text-gray-700 hover:bg-gray-200">
            Configurações
          </a>
        </div>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 flex flex-col p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
