"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Menu, X } from 'lucide-react';

export default function EncomendasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<{ 
    mensagem_topo?: string;
    pedido_minimo_grades?: number;
    prazo_producao_min?: number;
    prazo_producao_max?: number;
    whatsapp_numero?: string;
  } | null>(null);
  const [itemsCarrinho, setItemsCarrinho] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Buscar configurações
    fetch('/api/encomendas/configuracoes')
      .then((res) => res.json())
      .then((data) => setConfig(data.data))
      .catch((err) => console.error('Erro ao carregar configurações:', err));

    // Buscar itens do carrinho do localStorage
    const carrinho = JSON.parse(
      localStorage.getItem('carrinho_encomendas') || '[]'
    );
    setItemsCarrinho(carrinho.length);

    // Atualizar contador quando carrinho mudar
    const handleCarrinhoUpdate = () => {
      const carrinho = JSON.parse(
        localStorage.getItem('carrinho_encomendas') || '[]'
      );
      setItemsCarrinho(carrinho.length);
    };

    window.addEventListener('carrinho-updated', handleCarrinhoUpdate);
    return () =>
      window.removeEventListener('carrinho-updated', handleCarrinhoUpdate);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        {/* Mensagem do topo */}
        {config?.mensagem_topo && (
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-center py-2 text-sm px-4">
            {config.mensagem_topo}
          </div>
        )}

        {/* Navegação */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Link
              href="/encomendas"
              className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
            >
              Encomendas Grade Fechada
            </Link>

            {/* Desktop */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/encomendas"
                className="text-gray-700 hover:text-pink-600 font-medium transition"
              >
                Produtos
              </Link>
              <Link
                href="/encomendas/carrinho"
                className="flex items-center gap-2 text-gray-700 hover:text-pink-600 font-medium transition relative"
              >
                <ShoppingCart className="w-6 h-6" />
                Carrinho
                {itemsCarrinho > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {itemsCarrinho}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex items-center gap-4">
              <Link href="/encomendas/carrinho" className="relative">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {itemsCarrinho > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {itemsCarrinho}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-gray-700"
              >
                {menuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="md:hidden py-4 border-t">
              <Link
                href="/encomendas"
                className="block py-2 text-gray-700 hover:text-pink-600"
                onClick={() => setMenuOpen(false)}
              >
                Produtos
              </Link>
              <Link
                href="/encomendas/carrinho"
                className="block py-2 text-gray-700 hover:text-pink-600"
                onClick={() => setMenuOpen(false)}
              >
                Carrinho ({itemsCarrinho})
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="min-h-[calc(100vh-200px)]">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">
              Encomendas por Grade Fechada
            </h3>
            <p className="text-gray-300 mb-4">
              📦 Pedido mínimo: {config?.pedido_minimo_grades || 2} grades | ⏱️
              Prazo: {config?.prazo_producao_min || 15}-
              {config?.prazo_producao_max || 20} dias úteis
            </p>
            {config?.whatsapp_numero && (
              <a
                href={`https://wa.me/${config.whatsapp_numero}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                💬 Fale Conosco pelo WhatsApp
              </a>
            )}
            <p className="text-gray-400 text-sm mt-6">
              © 2026 Sistema de Encomendas - Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
