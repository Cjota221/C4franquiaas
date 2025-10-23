"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLojaInfo } from '@/contexts/LojaContext';
import ProductCard from '@/components/loja/ProductCard';
import { Search, Loader2 } from 'lucide-react';

type Produto = {
  id: string;
  nome: string;
  descricao: string;
  imagem: string | null;
  imagens: string[];
  preco_base: number;
  preco_venda?: number;
  preco_final: number;
  codigo_barras?: string;
  categoria_id?: string;
  variacoes_meta?: Record<string, unknown>;
  destaque: boolean;
  tag?: string;
  parcelamento: {
    parcelas: number;
    valor: number;
    total: number;
  };
};

export default function ProdutosPage() {
  const params = useParams();
  const loja = useLojaInfo();
  const dominio = params.dominio as string;

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [buscaDebounce, setBuscaDebounce] = useState('');

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounce(busca);
    }, 500);

    return () => clearTimeout(timer);
  }, [busca]);

  // Carregar produtos
  useEffect(() => {
    async function carregarProdutos() {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        
        if (buscaDebounce) queryParams.append('q', buscaDebounce);

        const res = await fetch(`/api/loja/${dominio}/produtos?${queryParams.toString()}`);
        
        if (!res.ok) {
          throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        setProdutos(data.produtos || []);
      } catch (error) {
        console.error('[ProdutosPage] Erro ao carregar:', error);
        setProdutos([]);
      } finally {
        setLoading(false);
      }
    }
    
    carregarProdutos();
  }, [buscaDebounce, dominio]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: loja.cor_primaria }}
          >
            Nossos Produtos
          </h1>
          <p className="text-gray-600">
            Encontre os melhores cosméticos com preços especiais
          </p>
        </div>

        {/* Busca */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              size={20} 
            />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition"
              style={{ 
                '--tw-ring-color': loja.cor_primaria 
              } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin" size={40} style={{ color: loja.cor_primaria }} />
          </div>
        )}

        {/* Grid de Produtos */}
        {!loading && produtos.length > 0 && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {produtos.length} {produtos.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {produtos.map((produto) => (
                <ProductCard
                  key={produto.id}
                  produto={produto}
                  dominio={dominio}
                />
              ))}
            </div>
          </>
        )}

        {/* Vazio */}
        {!loading && produtos.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-2">
              {busca ? 'Nenhum produto encontrado com essa busca' : 'Nenhum produto disponível'}
            </p>
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="text-sm hover:underline"
                style={{ color: loja.cor_primaria }}
              >
                Limpar busca
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
