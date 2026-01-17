/**
 * ============================================================================
 * PARTE 3: CONSOLIDAÇÃO - PÁGINA DE PRODUTOS (SEM BUSCA REDUNDANTE)
 * ============================================================================
 * - Remove barra de busca interna (agora centralizada no Header)
 * - Lê parâmetro 'search' da URL usando useSearchParams
 * - Filtra produtos automaticamente quando vem do Header
 */

"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useLojaInfo } from '@/contexts/LojaContext';
import ProductCard from '@/components/loja/ProductCard';
import FilterBar, { FilterState, SortOption } from '@/components/loja/FilterBar';
import { VideoFeedPreview } from '@/components/video';
import { Loader2 } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import { trackSearch } from '@/lib/meta-pixel';

// Forçar renderização client-side
export const dynamic = 'force-dynamic';

type Variacao = {
  sku: string;
  tamanho: string;
  disponivel: boolean;
  estoque?: number;
};

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
  categoria_slug?: string;
  variacoes?: Variacao[];
  variacoes_meta?: Record<string, unknown>;
  destaque: boolean;
  tag?: string;
  video_url?: string;
  video_thumbnail?: string;
  parcelamento: {
    parcelas: number;
    valor: number;
    total: number;
  };
};

export default function ProdutosPage() {
  console.log('[DEBUG Produtos] 1. Componente montado');
  const params = useParams();
  const searchParams = useSearchParams();
  
  console.log('[DEBUG Produtos] 2. Params:', params);
  
  const loja = useLojaInfo();
  console.log('[DEBUG Produtos] 3. Loja do Context:', loja ? 'OK' : 'NULL');
  
  const dominio = params.dominio as string;
  const searchFromUrl = searchParams.get('search') || '';
  const categoriaFromUrl = searchParams.get('categoria') || '';
  
  console.log('[DEBUG Produtos] 4. Domínio:', dominio);
  console.log('[DEBUG Produtos] 5. Search da URL:', searchFromUrl);
  console.log('[DEBUG Produtos] 6. Categoria da URL:', categoriaFromUrl);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Array<{ id: string; nome: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de filtro e ordenação
  const [filters, setFilters] = useState<FilterState>({
    categorias: categoriaFromUrl ? [categoriaFromUrl] : [],
    tamanhos: [],
  });
  const [sortBy, setSortBy] = useState<SortOption>('relevante');

  // ========================================================================
  // Carregar categorias disponíveis
  // ========================================================================
  useEffect(() => {
    async function carregarCategorias() {
      try {
        const res = await fetch(`/api/loja/${dominio}/categorias`);
        if (res.ok) {
          const data = await res.json();
          setCategorias(data || []);
        }
      } catch (error) {
        console.error('[DEBUG Produtos] Erro ao carregar categorias:', error);
      }
    }
    carregarCategorias();
  }, [dominio]);

  // ========================================================================
  // Carregar produtos baseado no parâmetro 'search' da URL
  // ========================================================================
  useEffect(() => {
    async function carregarProdutos() {
      try {
        console.log('[DEBUG Produtos] Iniciando carregamento de produtos');
        setLoading(true);
        const queryParams = new URLSearchParams();
        
        // Se houver busca na URL, adiciona como parâmetro
        if (searchFromUrl) {
          queryParams.append('q', searchFromUrl);
          console.log('[DEBUG Produtos] Aplicando filtro de busca:', searchFromUrl);
          
          // 🎯 Meta Pixel: Search
          trackSearch({
            search_string: searchFromUrl,
            content_category: categoriaFromUrl || undefined,
          });
        }
        
        const url = `/api/loja/${dominio}/produtos?${queryParams.toString()}`;
        console.log('[DEBUG Produtos] URL da API:', url);

        const res = await fetch(url);
        console.log('[DEBUG Produtos] Response status:', res.status);
        
        if (!res.ok) {
          const text = await res.text();
          console.error('[DEBUG Produtos] ERRO - Response:', text);
          throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log('[DEBUG Produtos] Produtos recebidos:', data.produtos?.length || 0);
        setProdutos(data.produtos || []);
      } catch (error) {
        console.error('[DEBUG Produtos] EXCEÇÃO:', error);
        console.error('[DEBUG Produtos] Stack:', error instanceof Error ? error.stack : 'N/A');
        setProdutos([]);
      } finally {
        console.log('[DEBUG Produtos] Finalizando loading');
        setLoading(false);
      }
    }
    
    carregarProdutos();
  }, [searchFromUrl, dominio]);

  // ========================================================================
  // Processar produtos com filtros e ordenação
  // ========================================================================
  const produtosFiltradosEOrdenados = useMemo(() => {
    let resultado = [...produtos];

    // Aplicar filtros de categoria
    if (filters.categorias.length > 0) {
      resultado = resultado.filter(p => 
        p.categoria_slug && filters.categorias.includes(p.categoria_slug)
      );
    }

    // Aplicar filtros de tamanho
    if (filters.tamanhos.length > 0) {
      resultado = resultado.filter(p => {
        if (!p.variacoes || p.variacoes.length === 0) return false;
        return p.variacoes.some(v => filters.tamanhos.includes(v.tamanho));
      });
    }

    // Aplicar ordenação
    if (sortBy === 'preco-asc') {
      resultado.sort((a, b) => a.preco_final - b.preco_final);
    } else if (sortBy === 'preco-desc') {
      resultado.sort((a, b) => b.preco_final - a.preco_final);
    }
    // 'relevante' mantém a ordem original da API

    return resultado;
  }, [produtos, filters, sortBy]);

  // Extrair todos os tamanhos únicos disponíveis
  const tamanhosDisponiveis = useMemo(() => {
    const tamanhos = new Set<string>();
    produtos.forEach(p => {
      if (p.variacoes) {
        p.variacoes.forEach(v => tamanhos.add(v.tamanho));
      }
    });
    return Array.from(tamanhos).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [produtos]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header - Título e Contagem */}
        <div className="mb-4">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: loja.cor_primaria }}
          >
            {searchFromUrl 
              ? `Resultados para "${searchFromUrl}"` 
              : 'Nossos Produtos'
            }
          </h1>
          
          {!loading && (
            <p className="text-sm text-gray-600">
              {produtosFiltradosEOrdenados.length} {produtosFiltradosEOrdenados.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
            </p>
          )}
        </div>

        {/* 🎬 Preview de Reels - Mostra se tiver produtos com vídeo */}
        {!loading && !searchFromUrl && produtos.filter(p => p.video_url).length > 0 && (
          <div className="mb-8">
            <VideoFeedPreview
              products={produtos
                .filter(p => p.video_url)
                .slice(0, 8)
                .map(p => ({
                  id: p.id,
                  nome: p.nome,
                  videoUrl: p.video_url!,
                  posterUrl: p.video_thumbnail || p.imagens?.[0],
                  preco: p.preco_final || p.preco_venda || p.preco_base,
                }))}
              dominio={dominio}
              corPrimaria={loja.cor_primaria}
              title="Reels"
              maxItems={4}
            />
          </div>
        )}

        {/* Barra de Filtros e Ordenação */}
        {!loading && produtos.length > 0 && (
          <FilterBar
            corPrimaria={loja.cor_primaria}
            categorias={categorias}
            tamanhos={tamanhosDisponiveis}
            onFilterChange={setFilters}
            onSortChange={setSortBy}
          />
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin" size={40} style={{ color: loja.cor_primaria }} />
          </div>
        )}

        {/* Grid de Produtos */}
        {!loading && produtosFiltradosEOrdenados.length > 0 && (
          <div className="grid-responsive">
            {produtosFiltradosEOrdenados.map((produto) => (
              <ProductCard
                key={produto.id}
                produto={produto}
                dominio={dominio}
              />
            ))}
          </div>
        )}

        {/* Vazio - Nenhum produto após filtros */}
        {!loading && produtos.length > 0 && produtosFiltradosEOrdenados.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-2">
              Nenhum produto encontrado com os filtros aplicados
            </p>
            <button
              onClick={() => setFilters({ categorias: [], tamanhos: [] })}
              className="text-sm hover:underline inline-block mt-2"
              style={{ color: loja.cor_primaria }}
            >
              Limpar filtros
            </button>
          </div>
        )}

        {/* Vazio - Nenhum produto na busca */}
        {!loading && produtos.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-2">
              {searchFromUrl 
                ? `Nenhum produto encontrado para "${searchFromUrl}"` 
                : 'Nenhum produto disponível'
              }
            </p>
            {searchFromUrl && (
              <a
                href={`/loja/${dominio}/produtos`}
                className="text-sm hover:underline inline-block mt-2"
                style={{ color: loja.cor_primaria }}
              >
                Ver todos os produtos
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
