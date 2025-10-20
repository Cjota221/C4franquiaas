"use client";

import { useEffect } from "react";

/**
 * A página inicial agora é um Client Component.
 * Sua única responsabilidade é redirecionar o usuário para a página de login.
 * O redirecionamento foi movido para dentro de um `useEffect` para garantir
 * que ele só seja executado no lado do cliente, evitando erros de renderização no servidor.
 */
export default function Home() {
  useEffect(() => {
    // Usamos 'window.location.replace' para garantir a compatibilidade e
    // evitar que o usuário possa voltar para esta página no histórico do navegador.
    window.location.replace("/login");
  }, []);

  // Renderiza um loader ou uma página em branco enquanto o redirecionamento ocorre.
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <p className="text-gray-600">Redirecionando para a página de login...</p>
    </div>
  );
}

