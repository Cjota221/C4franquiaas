/**
 * Layout principal para a área administrativa.
 * Inclui uma barra lateral de navegação e uma área de conteúdo.
 */
"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import EstoqueNotifications from '@/components/EstoqueNotifications';

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between p-3 bg-white shadow-sm">
        <button aria-label="Abrir menu" onClick={() => setDrawerOpen(true)} className="p-2">
          <svg className="w-6 h-6 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="font-bold text-lg text-[#DB1472]">C4 Franquias</div>
        <div className="w-8" />
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <Sidebar mobile={false} />

        {/* Mobile drawer overlay */}
        {drawerOpen && (
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-white p-4 overflow-auto">
              <Sidebar mobile={true} setView={() => {}} onLogout={() => {}} />
            </div>
          </div>
        )}

        {/* Main content - com margem esquerda para compensar sidebar fixo */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto md:ml-64">
          {/* Notificações de Estoque em Tempo Real */}
          <EstoqueNotifications />
          
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
