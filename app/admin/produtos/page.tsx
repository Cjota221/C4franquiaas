"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';

import { useProdutoStore, Produto as ProdutoType } from '@/lib/store/produtoStore';
import { useCategoriaStore } from '@/lib/store/categoriaStore';
import { useStatusStore } from '@/lib/store/statusStore';
import { useModalStore } from '@/lib/store/modalStore';
import ProductDetailsModal from '@/components/ProductDetailsModal';
import { supabase } from '@/lib/supabaseClient';
import PageWrapper from '@/components/PageWrapper';

const PAGE_SIZE = 30;

// Tipagem para a linha de dados vinda do Supabase
type ProdutoRow = {
    id: number;
    id_externo: string | null;
    nome: string | null;
    estoque: number | null;
    preco_base: number | null;
    ativo: boolean | null;
    imagem: string | null;
    imagens: string[] | null;
    categorias: { id: number; nome: string }[] | null;
};


// simple in-memory page cache to avoid refetching when navigating back/forth
const pageCache = new Map<number, { items: ProdutoType[]; total: number }>();

export default function ProdutosPage(): React.JSX.Element {
  const visibleProdutos = useProdutoStore((s) => s.visibleProdutos);
  const pagina = useProdutoStore((s) => s.pagina);
  const total = useProdutoStore((s) => s.total);
  const setPagina = useProdutoStore((s) => s.setPagina);
  const setProdutos = useProdutoStore((s) => s.setProdutos);
  const setVisibleProdutos = useProdutoStore((s) => s.setVisibleProdutos);
  const setTotal = useProdutoStore((s) => s.setTotal);
  const setLoading = useProdutoStore((s) => s.setLoading);
  const selectedIds = useProdutoStore((s) => s.selectedIds);
  const setSelectedId = useProdutoStore((s) => s.setSelectedId);
  const getSelectedCount = useProdutoStore((s) => s.getSelectedCount);

  const setCategoryPanelOpen = useCategoriaStore((s) => s.setCategoryPanelOpen);
  const statusMsg = useStatusStore((s) => s.statusMsg);
  const setStatusMsg = useStatusStore((s) => s.setStatusMsg);
  const setToggling = useStatusStore((s) => s.setToggling);
  const clearToggling = useStatusStore((s) => s.clearToggling);
  // subscribe once to the toggling map and read per-item below
  const toggling = useStatusStore((s) => s.toggling);
  const openModal = useModalStore((s) => s.openModal);
  const setModalLoading = useModalStore((s) => s.setModalLoading);
  const setModalVariacoes = useModalStore((s) => s.setModalVariacoes);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        // Verifica se o Supabase está configurado
        if (!supabase || typeof supabase.from !== 'function') {
          throw new Error('Supabase não está configurado corretamente. Verifique as variáveis de ambiente.');
        }

        const from = (pagina - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        
        const cached = pageCache.get(pagina);
        if (cached) {
          setProdutos(cached.items);
          setTotal(cached.total);
          setLoading(false);
          return;
        }

        const { data, error, count } = await supabase
          .from('produtos')
          .select('id,id_externo,nome,estoque,preco_base,ativo,imagem,imagens,categorias(id,nome)', { count: 'exact' })
          .range(from, to)
          .order('nome', { ascending: true });

        if (!cancelled) {
          if (error) {
            console.error('[admin/produtos] supabase list error', error);
            setStatusMsg({ type: 'error', text: `Erro ao carregar produtos: ${error.message}` });
          } else {
            function safeDecodeUrl(v?: unknown) {
              if (!v) return null;
              const s = String(v);
              try {
                let d = decodeURIComponent(s);
                if (/%25/.test(d) || /%3A/i.test(d) && /%2F/i.test(d)) {
                  try { d = decodeURIComponent(d); } catch {}
                }
                return d;
              } catch {
                return s;
              }
            }

            const mapped: ProdutoType[] = (data ?? []).map((r: ProdutoRow) => {
              const id = Number(r.id ?? 0);
              const id_externo = r.id_externo ?? undefined;
              const nome = r.nome ?? '';
              const estoque = r.estoque ?? 0;
              const preco_base = r.preco_base ?? null;
              const ativo = r.ativo ?? false;
              const rawImagem = r.imagem;
              const decodedImagem = safeDecodeUrl(rawImagem);
              const imagem = decodedImagem
                ? `https://c4franquiaas.netlify.app/.netlify/functions/proxy-facilzap-image?facilzap=${encodeURIComponent(decodedImagem)}`
                : null;
              const categorias = Array.isArray(r.categorias) ? r.categorias : null;
              
              return {
                id,
                id_externo,
                nome,
                estoque,
                preco_base,
                ativo,
                imagem,
                imagens: r.imagens || undefined,
                estoque_display: estoque,
                categorias,
              };
            });
            pageCache.set(pagina, { items: mapped, total: count ?? 0 });
            setProdutos(mapped);
            setVisibleProdutos(mapped);
            setTotal(count ?? 0);
          }
        }
      } catch (err) {
        console.error('[admin/produtos] fetch error', err);
        if (err instanceof Error) {
          setStatusMsg({ type: 'error', text: `Erro inesperado: ${err.message}` });
        } else {
          setStatusMsg({ type: 'error', text: 'Ocorreu um erro inesperado ao buscar os produtos.' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pagina, setProdutos, setVisibleProdutos, setTotal, setLoading, setStatusMsg]);

  return (
     <PageWrapper
            title="Catálogo de Produtos"
            description="Gerencie os produtos da sua loja."
            actionButton={
                <>
                    <button disabled={getSelectedCount() === 0} className="px-3 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">Ações ({getSelectedCount()})</button>
                    <button onClick={() => setCategoryPanelOpen(true)} className="px-3 py-2 bg-indigo-600 text-white rounded">Categorias</button>
                </>
            }
        >

      {statusMsg && (
        <div className={`p-3 mb-6 rounded ${statusMsg.type === 'success' ? 'bg-green-500 text-white' : statusMsg.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleProdutos.length === 0 && Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <div key={`skeleton-${i}`} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded" />
              <div className="w-24 h-24 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
        {visibleProdutos.map((p: ProdutoType) => {
          const isToggling = Boolean(toggling[p.id]);
          return (
            <div key={p.id} className={`rounded-lg shadow p-4 ${p.ativo ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={!!selectedIds[p.id]} onChange={(e) => setSelectedId(p.id, e.target.checked)} />
              <Image src={p.imagem ?? 'https://placehold.co/96x96/f0f0f0/a0a0a0?text=Sem+Imagem'} alt={p.nome} width={96} height={96} unoptimized loading="lazy" className="object-cover rounded" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{p.nome}</h3>
                <p className="text-sm text-gray-600">R$ {(p.preco_base ?? 0).toFixed(2)}</p>
                <p className="text-sm text-gray-500">Est: {p.estoque_display}</p>
              </div>
              <div className="flex flex-col items-end gap-2 ml-2">
                <button onClick={async () => {
                  openModal(p as ProdutoType);
                  setModalLoading(true);
                  try {
                    const id = p.id_externo ?? p.id;
                    const res = await fetch(`/api/produtos/${encodeURIComponent(String(id))}`);
                    const json = await res.json();
                    setModalVariacoes((json && json.facilzap && json.facilzap.variacoes) ? json.facilzap.variacoes : null);
                  } catch (err) {
                    console.error('failed to load product details', err);
                    setModalVariacoes(null);
                  } finally {
                    setModalLoading(false);
                  }
                }} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">Ver Detalhes</button>

                <button
                  disabled={isToggling}
                  onClick={async () => {
                    setToggling(p.id, true);
                    try {
                      const res = await fetch('/api/produtos/batch', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: [p.id], ativo: !p.ativo }),
                      });
                      const json = await res.json();
                      if (res.ok && json.ok) {
                        useProdutoStore.getState().updateProduto(p.id, { ativo: !p.ativo });
                        setStatusMsg({ type: 'success', text: `Produto ${!p.ativo ? 'ativado' : 'desativado'} com sucesso` });
                      } else {
                        setStatusMsg({ type: 'error', text: `Falha ao atualizar produto: ${json.error ?? 'erro'}` });
                      }
                    } catch (err) {
                      console.error('toggle error', err);
                      setStatusMsg({ type: 'error', text: 'Erro de rede ao atualizar produto' });
                    } finally {
                      clearToggling(p.id);
                    }
                  }} className={`px-2 py-1 rounded text-xs ${p.ativo ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'} ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isToggling ? 'Atualizando...' : (p.ativo ? 'Ativo' : 'Inativo')}
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <button onClick={() => setPagina(Math.max(1, pagina - 1))} className="px-3 py-1 border rounded"> Anterior</button>
        <span>Página {pagina} de {Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE))}</span>
        <button onClick={() => setPagina(pagina + 1)} className="px-3 py-1 border rounded">Próxima </button>
      </div>
      <ProductDetailsModal />
    </PageWrapper>
  );
}

