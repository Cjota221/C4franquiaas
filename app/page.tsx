'use client';

import { useEffect } from 'react';

/**
 * Componente da página inicial que redireciona automaticamente
 * para a página de login.
 */
export default function HomePage() {
  useEffect(() => {
    // Redireciona o usuário para a página de login assim que o componente for montado.
    // Usamos 'window.location.replace' para garantir a compatibilidade e
    // para que o usuário não possa voltar para esta página em branco.
    window.location.replace('/login');
  }, []); // O array de dependências vazio garante que isso execute apenas uma vez.

  // Exibe uma mensagem de carregamento enquanto o redirecionamento ocorre.
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <p className="text-lg text-gray-600">Redirecionando para o painel...</p>
      </div>
    </div>
  );
}

