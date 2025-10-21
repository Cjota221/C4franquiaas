"use client";

import React, { useEffect, useState } from 'react';
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
    variacoes_meta?: { sku?: string; codigo_barras?: string }[] | null;
};


// simple in-memory page cache to avoid refetching when navigating back/forth
const pageCache = new Map<number, { items: ProdutoType[]; total: number }>();

export default function ProdutosPage(): React.JSX.Element {
  const visibleProdutos = useProdutoStore((s) => s.visibleProdutos);
  const pagina = useProdutoStore((s) => s.pagina);
  const total = useProdutoStore((s) => s.total);
  const loading = useProdutoStore((s) => s.loading);
  const setPagina = useProdutoStore((s) => s.setPagina);
  const setProdutos = useProdutoStore((s) => s.setProdutos);
  const setVisibleProdutos = useProdutoStore((s) => s.setVisibleProdutos);
  const setTotal = useProdutoStore((s) => s.setTotal);
  const setLoading = useProdutoStore((s) => s.setLoading);
  const selectedIds = useProdutoStore((s) => s.selectedIds);
  const setSelectedId = useProdutoStore((s) => s.setSelectedId);
  const getSelectedCount = useProdutoStore((s) => s.getSelectedCount);
  const selectAll = useProdutoStore((s) => s.selectAll);
  const clearSelected = useProdutoStore((s) => s.clearSelected);

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

  // Estados locais para filtros e ações
  const [searchTerm, setSearchTerm] = useState('');
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    console.log('[admin/produtos] useEffect triggered, pagina:', pagina);
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        console.log('[admin/produtos] Starting fetch...');
        // Verifica se o Supabase está configurado de forma segura
        try {
          if (!supabase) {
            throw new Error('Supabase não está inicializado.');
          }
          
          // Tenta acessar o método 'from' de forma segura
          const testAccess = supabase.from;
          if (typeof testAccess !== 'function') {
            throw new Error('Cliente Supabase inválido.');
          }
        } catch (proxyError) {
          // Captura erro do Proxy quando variáveis de ambiente estão ausentes
          const errorMsg = proxyError instanceof Error ? proxyError.message : String(proxyError);
          throw new Error(
            errorMsg.includes('not configured') || errorMsg.includes('NEXT_PUBLIC_SUPABASE')
              ? '❌ Configuração Ausente: Por favor, configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no Netlify. Vá em: Site settings → Environment variables.'
              : `Erro ao acessar Supabase: ${errorMsg}`
          );
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

        console.log('[admin/produtos] Query result:', { 
          dataLength: data?.length, 
          error, 
          count,
          hasData: !!data 
        });

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

            const mapped: ProdutoType[] = (data ?? [])
              .map((r: ProdutoRow) => {
                // Mantém o ID como está (pode ser number ou string/UUID)
                const id = r.id;
                
                // Valida se o ID existe
                if (!id || id === null || id === undefined) {
                  console.warn('[admin/produtos] Produto sem ID ignorado:', r);
                  return null;
                }
                
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
            })
            .filter(p => p !== null) as ProdutoType[]; // Remove produtos com ID inválido
            
            console.log('[admin/produtos] Mapped products:', {
              originalCount: data?.length,
              mappedCount: mapped.length,
              sampleProduct: mapped[0]
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

  // useEffect para aplicar filtros
  useEffect(() => {
    const stored = useProdutoStore.getState().produtos;
    let filtered = [...stored];

    // Filtro por termo de busca (nome, SKU, código de barras)
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(p => {
        // Buscar no nome
        if (p.nome.toLowerCase().includes(lowerSearch)) return true;
        
        // Buscar em variacoes_meta (SKU e código de barras)
        if (p.variacoes_meta && Array.isArray(p.variacoes_meta)) {
          return p.variacoes_meta.some(v => {
            const variacao = v as { sku?: string; codigo_barras?: string };
            return (
              (variacao.sku && variacao.sku.toLowerCase().includes(lowerSearch)) ||
              (variacao.codigo_barras && variacao.codigo_barras.includes(lowerSearch))
            );
          });
        }
        
        return false;
      });
    }

    setVisibleProdutos(filtered);
  }, [searchTerm, setVisibleProdutos]);

  // Função para selecionar/desselecionar todos
  const handleSelectAll = () => {
    const selectedCount = getSelectedCount();
    if (selectedCount === visibleProdutos.length && visibleProdutos.length > 0) {
      clearSelected();
    } else {
      selectAll(visibleProdutos.map(p => p.id));
    }
  };

  // Função para ações em massa
  const handleBatchAction = async (action: 'activate' | 'deactivate') => {
    const selected = Object.keys(selectedIds)
      .filter(k => selectedIds[Number(k)])
      .map(Number);
    
    if (selected.length === 0) {
      setStatusMsg({ type: 'error', text: 'Nenhum produto selecionado' });
      setTimeout(() => setStatusMsg(null), 3000);
      return;
    }

    const novoStatus = action === 'activate';
    
    try {
      if (!supabase) throw new Error('Supabase não configurado');
      
      const { error } = await supabase
        .from('produtos')
        .update({ ativo: novoStatus })
        .in('id', selected);

      if (error) {
        setStatusMsg({ type: 'error', text: `Erro: ${error.message}` });
      } else {
        // Atualizar localmente
        const stored = useProdutoStore.getState().produtos;
        const updated = stored.map(p => 
          selected.includes(Number(p.id)) ? { ...p, ativo: novoStatus } : p
        );
        setProdutos(updated);
        setVisibleProdutos(updated.filter(p => {
          if (!searchTerm.trim()) return true;
          const lowerSearch = searchTerm.toLowerCase();
          if (p.nome.toLowerCase().includes(lowerSearch)) return true;
          if (p.variacoes_meta && Array.isArray(p.variacoes_meta)) {
            return p.variacoes_meta.some(v => {
              const variacao = v as { sku?: string; codigo_barras?: string };
              return (
                (variacao.sku && variacao.sku.toLowerCase().includes(lowerSearch)) ||
                (variacao.codigo_barras && variacao.codigo_barras.includes(lowerSearch))
              );
            });
          }
          return false;
        }));
        
        setStatusMsg({ 
          type: 'success', 
          text: `${selected.length} produto(s) ${novoStatus ? 'ativado(s)' : 'desativado(s)'}!` 
        });
        clearSelected();
        setShowActions(false);
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (err) {
      console.error('[batchAction] erro:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao processar ação em massa' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const selectedCount = getSelectedCount();

  console.log('[admin/produtos] Render state:', {
    visibleProdutosCount: visibleProdutos.length,
    loading,
    pagina,
    total
  });

  return (
     <PageWrapper
            title="Catálogo de Produtos"
            description="Gerencie os produtos da sua loja."
        >

      {/* Barra de Filtros e Ações */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="🔎 Buscar por nome, SKU ou código de barras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border rounded flex-1 min-w-[200px]"
        />
        
        {/* Botão de Ações em Massa */}
        <div className="relative">
          <button 
            disabled={selectedCount === 0}
            onClick={() => setShowActions(!showActions)}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50 hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            Ações ({selectedCount}) <span className="text-xs">▼</span>
          </button>
          {showActions && selectedCount > 0 && (
            <div className="absolute z-10 mt-2 w-56 bg-white rounded-md shadow-lg border">
              <button 
                onClick={() => handleBatchAction('activate')} 
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                ✅ Ativar Selecionados
              </button>
              <button 
                onClick={() => handleBatchAction('deactivate')} 
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                ❌ Desativar Selecionados
              </button>
            </div>
          )}
        </div>

        <button 
          onClick={() => setCategoryPanelOpen(true)} 
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors"
        >
          📁 Categorias
        </button>
      </div>

      {statusMsg && (
        <div className={`p-3 mb-6 rounded ${statusMsg.type === 'success' ? 'bg-green-500 text-white' : statusMsg.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
          {statusMsg.text}
        </div>
      )}

      {/* Header do Grid com Checkbox Selecionar Todos */}
      <div className="mb-3 flex items-center gap-3 px-2">
        <input 
          type="checkbox" 
          onChange={handleSelectAll} 
          checked={selectedCount === visibleProdutos.length && visibleProdutos.length > 0}
          className="w-4 h-4 cursor-pointer"
        />
        <span className="text-sm text-gray-600">
          {selectedCount > 0 
            ? `${selectedCount} produto(s) selecionado(s)` 
            : `${visibleProdutos.length} produto(s)`
          }
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && visibleProdutos.length === 0 && Array.from({ length: PAGE_SIZE }).map((_, i) => (
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

