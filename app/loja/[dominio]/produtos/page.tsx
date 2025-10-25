/**
 * ============================================================================
 * PARTE 3: CONSOLIDAÇÃO - PÁGINA DE PRODUTOS (SEM BUSCA REDUNDANTE)
 * ============================================================================
 * - Remove barra de busca interna (agora centralizada no Header)
 * - Lê parâmetro 'search' da URL usando useSearchParams
 * - Filtra produtos automaticamente quando vem do Header
 */

"use client";
import React, { useState, useEffect } from 'react';
import { useLojaInfo } from '@/contexts/LojaContext';
import ProductCard from '@/components/loja/ProductCard';
import { Loader2 } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';

// Forçar renderização client-side
export const dynamic = 'force-dynamic';

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
  console.log('[DEBUG Produtos] 1. Componente montado');
  const params = useParams();
  const searchParams = useSearchParams(); // ← PARTE 3: Lê URL search params
  
  console.log('[DEBUG Produtos] 2. Params:', params);
  
  const loja = useLojaInfo();
  console.log('[DEBUG Produtos] 3. Loja do Context:', loja ? 'OK' : 'NULL');
  
  const dominio = params.dominio as string;
  const searchFromUrl = searchParams.get('search') || ''; // ← PARTE 3: Busca da URL
  
  console.log('[DEBUG Produtos] 4. Domínio:', dominio);
  console.log('[DEBUG Produtos] 5. Search da URL:', searchFromUrl);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  // ========================================================================
  // PARTE 3: Carregar produtos baseado no parâmetro 'search' da URL
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
  }, [searchFromUrl, dominio]); // ← PARTE 3: Recarrega quando search muda

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: loja.cor_primaria }}
          >
            {searchFromUrl ? `Resultados para "${searchFromUrl}"` : 'Nossos Produtos'}
          </h1>
          <p className="text-gray-600">
            {searchFromUrl 
              ? 'Produtos encontrados na sua busca'
              : 'Encontre os melhores cosméticos com preços especiais'
            }
          </p>
        </div>

        {/* ========================================================================
            PARTE 3: BARRA DE BUSCA REMOVIDA (agora está no Header)
            ======================================================================== */}

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
            <div className="grid-responsive">
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
