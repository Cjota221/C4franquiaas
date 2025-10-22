"use client";
import React, { useEffect, useState } from 'react';
import ProdutoCard from '@/components/loja/ProdutoCard';
import { Package, Search } from 'lucide-react';

type Produto = {
  id: string;
  nome: string;
  preco_final: number;
  imagem: string | null;
  estoque: number;
  categoria?: string;
};

type LojaInfo = {
  nome: string;
  cor_primaria: string;
};

export default function ProdutosPage({ params }: { params: { dominio: string } }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [lojaInfo, setLojaInfo] = useState<LojaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        // Carregar informações da loja
        const infoRes = await fetch(`/api/loja/${params.dominio}/info`);
        if (infoRes.ok) {
          const infoJson = await infoRes.json();
          setLojaInfo(infoJson.loja);
        }

        // Carregar todos os produtos
        const prodRes = await fetch(`/api/loja/${params.dominio}/produtos`);
        if (prodRes.ok) {
          const prodJson = await prodRes.json();
          setProdutos(prodJson.produtos);
          setProdutosFiltrados(prodJson.produtos);
        }
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [params.dominio]);

  // Filtrar produtos quando o termo de busca mudar
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setProdutosFiltrados(produtos);
    } else {
      const termo = searchTerm.toLowerCase();
      const filtrados = produtos.filter(p => 
        p.nome.toLowerCase().includes(termo) ||
        p.categoria?.toLowerCase().includes(termo)
      );
      setProdutosFiltrados(filtrados);
    }
  }, [searchTerm, produtos]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-md p-4 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Nossos Produtos</h1>
        
        {/* Barra de Pesquisa */}
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-600"
          />
          <Search 
            size={20} 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
        </div>

        {/* Contador de resultados */}
        <p className="text-gray-600 mt-4">
          {produtosFiltrados.length} {produtosFiltrados.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
        </p>
      </div>

      {/* Grid de Produtos */}
      {produtosFiltrados.length === 0 ? (
        <div className="text-center py-16">
          <Package size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold mb-2 text-gray-800">
            {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
          </h3>
          <p className="text-gray-600">
            {searchTerm ? 'Tente buscar com outros termos' : 'Em breve teremos novidades para você!'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 px-6 py-2 rounded-lg text-white transition hover:opacity-90"
              style={{ backgroundColor: lojaInfo?.cor_primaria || '#DB1472' }}
            >
              Limpar Busca
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {produtosFiltrados.map((produto) => (
            <ProdutoCard 
              key={produto.id} 
              produto={produto} 
              dominio={params.dominio}
              corPrimaria={lojaInfo?.cor_primaria || '#DB1472'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
