'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type ProdutoRelacionado = {
  id: number | string;
  nome: string;
  preco: number;
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
        
        // Tentar API de catálogo (revendedoras) primeiro
        let response = await fetch(`/api/catalogo/${dominio}/produtos/relacionados/${produtoId}`);
        
        // Se falhar, tentar API de loja (franqueadas)
        if (!response.ok) {
          response = await fetch(`/api/loja/${dominio}/produtos/relacionados/${produtoId}`);
        }
        
        if (!response.ok) {
          setProdutos([]);
          return;
        }

        const data = await response.json();
        setProdutos(data.produtos || []);
      } catch (error) {
        console.error('Erro ao carregar produtos relacionados:', error);
        setProdutos([]);
      } finally {
        setLoading(false);
      }
    }

    if (produtoId && dominio) {
      carregarProdutosRelacionados();
    }
  }, [produtoId, dominio]);

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

        {/* 🎨 CARROSSEL HORIZONTAL - MOBILE E DESKTOP */}
        {!loading && produtos.length > 0 && (
          <div className="relative">
            {/* Gradient esquerda */}
            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
            
            {/* Gradient direita */}
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>

            {/* Container scrollável */}
            <div 
              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {produtos.slice(0, 20).map((produto) => {
                const imagemPrincipal = produto.imagens?.[0] || '/placeholder-produto.png';
                
                return (
                  <Link
                    key={produto.id}
                    href={`/catalogo/${dominio}/produto/${produto.id}`}
                    className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex-none snap-start w-[160px] sm:w-[180px] md:w-[220px] lg:w-[240px]"
                  >
                    {/* Imagem */}
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={imagemPrincipal}
                        alt={produto.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://placehold.co/400x400/e5e7eb/9ca3af?text=Sem+Imagem';
                        }}
                      />
                      
                      {/* Badge "Ver Produto" no hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <span className="bg-white text-gray-900 px-3 py-1.5 rounded-full text-xs font-semibold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          Ver Produto
                        </span>
                      </div>
                    </div>

                    {/* Informações */}
                    <div className="p-3 md:p-4">
                      <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#DB1472] transition-colors min-h-[2.5rem]">
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

            {/* Indicador de scroll (mobile) */}
            <div className="flex md:hidden items-center justify-center gap-1 mt-4">
              <ChevronLeft className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Deslize para ver mais</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {/* CSS customizado para esconder scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}

