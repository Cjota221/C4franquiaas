// Garante que este componente só será usado no lado do cliente
"use client";

import React, { useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';

// Dados de exemplo dos produtos (virão do Supabase no futuro)
const mockProdutos = [
  { id: 1, nome: 'Plano Bronze C4', preco_base: 99.90, estoque: 50, ativo: true, imagem: 'https://placehold.co/64x64/DB1472/FFF?text=C4' },
  { id: 2, nome: 'Plano Prata C4', preco_base: 149.90, estoque: 30, ativo: true, imagem: 'https://placehold.co/64x64/DB1472/FFF?text=C4' },
  { id: 3, nome: 'Plano Ouro C4', preco_base: 249.90, estoque: 15, ativo: false, imagem: 'https://placehold.co/64x64/DB1472/FFF?text=C4' },
  { id: 4, nome: 'Consultoria VIP', preco_base: 499.00, estoque: 5, ativo: true, imagem: 'https://placehold.co/64x64/DB1472/FFF?text=C4' },
];

// Componente da página de Produtos
export default function ProdutosPage() {
  // Estado para gerenciar os produtos e o loading da sincronização
  const [produtos, setProdutos] = useState(mockProdutos);
  const [loading, setLoading] = useState(false);

  // Função para simular a sincronização de produtos
  const handleSync = () => {
    setLoading(true);
    console.log("Iniciando sincronização...");
    // Simula uma chamada de API
    setTimeout(() => {
      alert(`Sincronização concluída! ${mockProdutos.length} produtos atualizados.`);
      setLoading(false);
      console.log("Sincronização finalizada.");
    }, 2000); // Espera 2 segundos
  };

  // Função para mudar o status de um produto
  const toggleAtivo = (id: number) => {
    setProdutos(produtos.map(p => 
      p.id === id ? { ...p, ativo: !p.ativo } : p
    ));
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho com título e botão de ação */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#333]">Gerenciamento de Produtos</h1>
          <p className="text-lg text-gray-500 mt-1">Sincronize e gerencie os produtos disponíveis para as franquias.</p>
        </div>
        <button
          onClick={handleSync}
          disabled={loading}
          className="flex items-center gap-2 bg-[#F8B81F] text-[#333] font-bold py-3 px-6 rounded-lg shadow-md hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Sincronizando...' : 'Sincronizar Produtos'}
        </button>
      </header>

      {/* Tabela de produtos */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-4">Produto</th>
                <th className="p-4">Preço Base</th>
                <th className="p-4">Estoque</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 flex items-center gap-4">
                    <img src={produto.imagem} alt={produto.nome} className="w-12 h-12 rounded-lg object-cover" />
                    <span className="font-semibold">{produto.nome}</span>
                  </td>
                  <td className="p-4">R$ {produto.preco_base.toFixed(2)}</td>
                  <td className="p-4">{produto.estoque}</td>
                  <td className="p-4 text-center">
                    {/* Switch para ativar/desativar */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={produto.ativo}
                        onChange={() => toggleAtivo(produto.id)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DB1472]"></div>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
