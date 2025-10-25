// ============================================================================
// EXEMPLO PRÁTICO: MIGRAÇÃO PARA TANSTACK QUERY
// ============================================================================
// Este arquivo mostra o ANTES e DEPOIS da otimização de data fetching
// ============================================================================

// ============================================================================
// ❌ ANTES - Código atual (LENTO, SEM CACHE)
// ============================================================================
/*
"use client";
import { useEffect, useState } from 'react';

export default function LojaHomePage({ params }: { params: Promise<{ dominio: string }> }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [lojaInfo, setLojaInfo] = useState<LojaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [dominio, setDominio] = useState<string>('');

  // ❌ PROBLEMAS:
  // 1. Sem cache - busca toda vez que volta para a página
  // 2. Sem deduplicação - se abrir várias abas, faz múltiplas requests
  // 3. Sem retry automático
  // 4. Gerenciamento manual de loading/error states
  
  useEffect(() => {
    async function loadData() {
      try {
        const { dominio: dom } = await params;
        setDominio(dom);
        
        // Busca 1: Info da loja
        const infoRes = await fetch(`/api/loja/${dom}/info`);
        if (infoRes.ok) {
          const infoJson = await infoRes.json();
          setLojaInfo(infoJson.loja);
        }

        // Busca 2: Produtos
        const prodRes = await fetch(`/api/loja/${dom}/produtos`);
        if (prodRes.ok) {
          const prodJson = await prodRes.json();
          setProdutos(prodJson.produtos.slice(0, 6));
        }
      } catch (err) {
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [params]);

  if (loading) return <LoadingSpinner />;
  
  return <div>...</div>;
}
*/

// ============================================================================
// ✅ DEPOIS - Com TanStack Query (RÁPIDO, COM CACHE)
// ============================================================================

"use client";
import { useQuery } from '@tanstack/react-query';
import { use } from 'react';

// ✅ PASSO 1: Extrair funções de fetch (reutilizáveis)
async function fetchLojaInfo(dominio: string) {
  const res = await fetch(`/api/loja/${dominio}/info`);
  if (!res.ok) throw new Error('Erro ao carregar loja');
  const data = await res.json();
  return data.loja;
}

async function fetchProdutosDestaque(dominio: string, limit = 6) {
  const res = await fetch(`/api/loja/${dominio}/produtos?limit=${limit}`);
  if (!res.ok) throw new Error('Erro ao carregar produtos');
  const data = await res.json();
  return data.produtos;
}

// ✅ PASSO 2: Componente otimizado
export default function LojaHomePage({ params }: { params: Promise<{ dominio: string }> }) {
  const { dominio } = use(params);

  // ✅ Query 1: Informações da loja (cache longo - dados estáticos)
  const { 
    data: lojaInfo, 
    isLoading: lojaLoading,
    error: lojaError 
  } = useQuery({
    queryKey: ['loja-info', dominio],
    queryFn: () => fetchLojaInfo(dominio),
    staleTime: 10 * 60 * 1000, // 10 minutos - loja não muda frequentemente
    gcTime: 30 * 60 * 1000, // 30 minutos em cache
    retry: 2, // Tenta 2 vezes se falhar
  });

  // ✅ Query 2: Produtos em destaque (cache médio - dados semi-dinâmicos)
  const { 
    data: produtos = [], 
    isLoading: produtosLoading,
    error: produtosError 
  } = useQuery({
    queryKey: ['produtos-destaque', dominio],
    queryFn: () => fetchProdutosDestaque(dominio, 6),
    staleTime: 2 * 60 * 1000, // 2 minutos - produtos mudam mais
    gcTime: 10 * 60 * 1000, // 10 minutos em cache
    enabled: !!dominio, // Só executa se dominio estiver disponível
  });

  // ✅ BENEFÍCIOS AUTOMÁTICOS:
  // 1. Cache entre navegações - voltar para página é instantâneo
  // 2. Deduplicação - múltiplas chamadas ao mesmo endpoint = 1 request
  // 3. Background refetch - atualiza dados enquanto mostra cache
  // 4. Loading/error states gerenciados automaticamente
  // 5. DevTools para debug (em development)

  if (lojaLoading || produtosLoading) {
    return <LoadingSpinner />;
  }

  if (lojaError || produtosError) {
    return <ErrorMessage error={lojaError || produtosError} />;
  }

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative h-[60vh]">
        <h1>{lojaInfo?.nome}</h1>
      </section>

      {/* Produtos */}
      <section className="py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {produtos.map((produto) => (
            <div key={produto.id}>
              {/* ProdutoCard component aqui */}
              <h3>{produto.nome}</h3>
              <p>R$ {produto.preco_final}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// ✅ PASSO 3: Componentes auxiliares otimizados
// ============================================================================

function LoadingSpinner() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mx-auto" />
      <p className="mt-4 text-gray-600">Carregando...</p>
    </div>
  );
}

function ErrorMessage({ error }: { error: Error | null }) {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-600 mb-2">Erro ao carregar</h2>
        <p className="text-red-700">{error?.message || 'Erro desconhecido'}</p>
      </div>
    </div>
  );
}

// ============================================================================
// ✅ BONUS: Hook customizado reutilizável
// ============================================================================

// hooks/useLojaData.ts
export function useLojaData(dominio: string) {
  const lojaQuery = useQuery({
    queryKey: ['loja-info', dominio],
    queryFn: () => fetchLojaInfo(dominio),
    staleTime: 10 * 60 * 1000,
  });

  const produtosQuery = useQuery({
    queryKey: ['produtos-destaque', dominio],
    queryFn: () => fetchProdutosDestaque(dominio, 6),
    staleTime: 2 * 60 * 1000,
    enabled: !!dominio,
  });

  return {
    loja: lojaQuery.data,
    produtos: produtosQuery.data || [],
    isLoading: lojaQuery.isLoading || produtosQuery.isLoading,
    error: lojaQuery.error || produtosQuery.error,
  };
}

// USO:
// const { loja, produtos, isLoading } = useLojaData(dominio);

// ============================================================================
// 📊 MÉTRICAS ESPERADAS
// ============================================================================
/*
ANTES:
- Primeira carga: 2.5s
- Voltar para página: 2.5s (busca tudo de novo)
- Múltiplas requests simultâneas para mesmo endpoint

DEPOIS:
- Primeira carga: 1.8s (com índices no banco)
- Voltar para página: <50ms (pega do cache)
- Requests deduplicadas automaticamente
- Background refetch mantém dados atualizados
*/
