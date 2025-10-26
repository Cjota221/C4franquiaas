'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ProdutoRelacionado = {
  id: number;
  nome: string;
  preco: number;
  slug: string;
  imagens: string[] | null;
};

type ProdutosRelacionadosProps = {
  produtoId: string;
  dominio: string;
  titulo?: string;
  subtitulo?: string;
};

export default function ProdutosRelacionados({
  produtoId,
  dominio,
  titulo = 'Produtos Relacionados',
  subtitulo = 'Você também pode gostar',
}: ProdutosRelacionadosProps) {
  const [produtos, setProdutos] = useState<ProdutoRelacionado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarProdutosRelacionados() {
      try {
        setLoading(true);
        const response = await fetch(`/api/produtos/relacionados/${produtoId}`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar produtos relacionados');
        }

        const data = await response.json();
        setProdutos(data.produtos || []);
      } catch (error) {
        console.error('[ProdutosRelacionados] Erro:', error);
        setProdutos([]);
      } finally {
        setLoading(false);
      }
    }

    if (produtoId) {
      carregarProdutosRelacionados();
    }
  }, [produtoId]);

  // Não mostrar nada se não tiver produtos
  if (!loading && produtos.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-8 md:py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Cabeçalho */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {titulo}
          </h2>
          <p className="text-gray-600">{subtitulo}</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DB1472]"></div>
          </div>
        )}

        {/* Grade de Produtos */}
        {!loading && produtos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {produtos.map((produto) => {
              const imagemPrincipal = produto.imagens?.[0] || '/placeholder-produto.png';
              
              return (
                <Link
                  key={produto.id}
                  href={`/loja/${dominio}/produto/${produto.id}`}
                  className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  {/* Imagem */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={imagemPrincipal}
                      alt={produto.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://placehold.co/400x400/e5e7eb/9ca3af?text=Sem+Imagem';
                      }}
                    />
                    
                    {/* Badge "Ver Produto" no hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                      <span className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-semibold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        Ver Produto
                      </span>
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="p-3 md:p-4">
                    <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#DB1472] transition-colors">
                      {produto.nome}
                    </h3>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg md:text-xl font-bold text-[#DB1472]">
                        R$ {produto.preco.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Scroll hint para mobile */}
        {!loading && produtos.length > 2 && (
          <div className="md:hidden text-center mt-4">
            <p className="text-xs text-gray-500">
              ← Deslize para ver mais →
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
