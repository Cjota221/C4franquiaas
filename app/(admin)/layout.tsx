// Garante que este componente só será usado no lado do cliente
"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar'; // Importa a nossa barra lateral
import { useRouter } from 'next/navigation'; // Importa o hook de navegação do App Router

// Tipagem para os "children", que são as páginas que este layout vai renderizar
type AdminLayoutProps = {
  children: React.ReactNode;
};

// Componente principal do Layout
export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();

  // Função de logout que agora usa o router
  const handleLogout = () => {
    alert('Saindo do sistema...');
    // No futuro, aqui chamaremos a função de logout do Supabase
    router.push('/login'); // Redireciona para a tela de login
  };
  
  // O componente renderiza a estrutura da página
  return (
    <div className="flex h-screen bg-[#FFF5FA]">
      {/* A Sidebar agora não controla mais o estado, apenas o logout */}
      <Sidebar onLogout={handleLogout} />
      
      {/* Área de Conteúdo Principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* O 'children' é onde o Next.js vai colocar o conteúdo 
            das páginas (dashboard, produtos, etc.) */}
        {children}
      </main>
    </div>
  );
}
