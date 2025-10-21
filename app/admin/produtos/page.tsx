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
    variacoes_meta: { sku?: string; codigo_barras?: string }[] | null;
};

const pageCache = new Map<number, { items: ProdutoType[]; total: number }>();

export default function ProdutosPage(): React.JSX.Element {
  const { 
    produtos, setProdutos, visibleProdutos, setVisibleProdutos, 
    pagina, setPagina, total, setTotal, loading, setLoading, 
    selectedIds, setSelectedId, getSelectedCount, selectAll, clearSelected 
  } = useProdutoStore();
  
  const { setCategoryPanelOpen } = useCategoriaStore();
  const { statusMsg, setStatusMsg, toggling, setToggling, clearToggling } = useStatusStore();
  const { openModal, setModalLoading, setModalVariacoes } = useModalStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase não configurado. Verifique as variáveis de ambiente.');
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
          .select('id,id_externo,nome,estoque,preco_base,ativo,imagem,imagens,variacoes_meta,categorias(id,nome)', { count: 'exact' })
          .range(from, to)
          .order('nome', { ascending: true });

        if (!cancelled) {
          if (error) {
            console.error('[admin/produtos] erro supabase:', error);
            setStatusMsg({ type: 'error', text: Erro:  });
          } else {
            const mapped: ProdutoType[] = (data ?? []).map((r: ProdutoRow) => ({
              id: Number(r.id ?? 0),
              id_externo: r.id_externo ?? undefined,
              nome: r.nome ?? '',
              estoque: r.estoque ?? 0,
              preco_base: r.preco_base ?? null,
              ativo: r.ativo ?? false,
              imagem: r.imagem,
              imagens: r.imagens || undefined,
              categorias: r.categorias || null,
              variacoes_meta: r.variacoes_meta || undefined,
            }));
            pageCache.set(pagina, { items: mapped, total: count ?? 0 });
            setProdutos(mapped);
            setTotal(count ?? 0);
          }
        }
      } catch (err) {
        console.error('[admin/produtos] erro fetch:', err);
        const message = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
        setStatusMsg({ type: 'error', text: message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pagina, setProdutos, setTotal, setLoading, setStatusMsg]);

  useEffect(() => {
    let filtered = [...produtos];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.nome.toLowerCase().includes(lowerSearch) ||
        p.variacoes_meta?.some(v => v.sku?.toLowerCase().includes(lowerSearch) || v.codigo_barras?.includes(lowerSearch))
      );
    }
    if (selectedCategoryFilter) {
      filtered = filtered.filter(p => p.categorias?.some(c => c.id === selectedCategoryFilter));
    }
    setVisibleProdutos(filtered);
  }, [searchTerm, selectedCategoryFilter, produtos, setVisibleProdutos]);

  const selectedCount = getSelectedCount();

  const handleSelectAll = () => {
    if (selectedCount === visibleProdutos.length) {
      clearSelected();
    } else {
      selectAll(visibleProdutos.map(p => p.id));
    }
  };

  const handleToggleAtivo = async (produto: ProdutoType) => {
    const id = produto.id;
    const novoStatus = !produto.ativo;
    setToggling(id, true);
    try {
      if (!supabase) throw new Error('Supabase não configurado');
      const { error } = await supabase.from('produtos').update({ ativo: novoStatus }).eq('id', id);
      if (error) {
        console.error('[toggleAtivo] erro:', error);
        setStatusMsg({ type: 'error', text: Erro ao alterar status:  });
      } else {
        const updated = produtos.map(p => p.id === id ? { ...p, ativo: novoStatus } : p);
        setProdutos(updated);
        setStatusMsg({ type: 'success', text: Produto  com sucesso! });
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (err) {
      console.error('[toggleAtivo] erro:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao alterar status do produto' });
    } finally {
      clearToggling(id);
    }
  };

  const handleBatchAction = async (action: 'activate' | 'deactivate' | 'price' | 'category') => {
    const selected = Object.keys(selectedIds).filter(k => selectedIds[Number(k)]).map(Number);
    if (selected.length === 0) {
      setStatusMsg({ type: 'error', text: 'Nenhum produto selecionado' });
      return;
    }
    switch (action) {
      case 'activate':
      case 'deactivate':
        const novoStatus = action === 'activate';
        try {
          if (!supabase) throw new Error('Supabase não configurado');
          const { error } = await supabase.from('produtos').update({ ativo: novoStatus }).in('id', selected);
          if (error) {
            setStatusMsg({ type: 'error', text: Erro:  });
          } else {
            const updated = produtos.map(p => selected.includes(p.id) ? { ...p, ativo: novoStatus } : p);
            setProdutos(updated);
            setStatusMsg({ type: 'success', text: ${selected.length} produto(s) ! });
            clearSelected();
            setShowActions(false);
            setTimeout(() => setStatusMsg(null), 3000);
          }
        } catch (err) {
          setStatusMsg({ type: 'error', text: 'Erro ao processar ação em massa' });
        }
        break;
      case 'price':
        alert('Modal de alteração de preço em desenvolvimento');
        break;
      case 'category':
        alert('Modal de seleção de categoria em desenvolvimento');
        break;
    }
  };

  return (
    <PageWrapper title="Catálogo de Produtos" description="Gerencie os produtos da sua loja.">
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <input type="text" placeholder=" Filtrar por nome, SKU ou cód. de barras..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-2 border rounded w-full md:w-1/3" />
        <div className="relative">
          <button disabled={selectedCount === 0} onClick={() => setShowActions(!showActions)} className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50 flex items-center gap-2 hover:bg-indigo-700 transition-colors">Ações ({selectedCount}) <span className="text-xs"></span></button>
          {showActions && selectedCount > 0 && (
            <div className="absolute z-10 mt-2 w-56 bg-white rounded-md shadow-lg border">
              <button onClick={() => handleBatchAction('activate')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"> Ativar Selecionados</button>
              <button onClick={() => handleBatchAction('deactivate')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"> Desativar Selecionados</button>
              <button onClick={() => handleBatchAction('price')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"> Alterar Preço</button>
              <button onClick={() => handleBatchAction('category')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"> Adicionar a Categoria</button>
            </div>
          )}
        </div>
        <button onClick={() => setCategoryPanelOpen(true)} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors"> Gerenciar Categorias</button>
      </div>
      {statusMsg && (<div className={p-3 mb-6 rounded }>{statusMsg.text}</div>)}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left"><input type="checkbox" onChange={handleSelectAll} checked={selectedCount === visibleProdutos.length && visibleProdutos.length > 0} /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && Array.from({ length: 10 }).map((_, i) => (<tr key={skeleton-}><td colSpan={6} className="p-4"><div className="h-8 bg-gray-200 rounded animate-pulse"></div></td></tr>))}
            {!loading && visibleProdutos.map((p: ProdutoType) => {
              const isToggling = Boolean(toggling[p.id]);
              return (
                <tr key={p.id} className={${p.ativo ? '' : 'bg-gray-50 opacity-70'}}>
                  <td className="px-4 py-3"><input type="checkbox" checked={!!selectedIds[p.id]} onChange={(e) => setSelectedId(p.id, e.target.checked)} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Image src={p.imagem ?? 'https://placehold.co/40x40/f0f0f0/a0a0a0?text=S/I'} alt={p.nome} width={40} height={40} unoptimized className="object-cover rounded" />
                      <div>
                        <span className="font-medium text-sm">{p.nome}</span>
                        {p.variacoes_meta && p.variacoes_meta.length > 0 && (<div className="text-xs text-gray-500">{p.variacoes_meta.length} variação(ões)</div>)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{p.estoque}</td>
                  <td className="px-4 py-3 text-sm">R$ {(p.preco_base ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm"><span className={px-2 inline-flex text-xs leading-5 font-semibold rounded-full }>{p.ativo ? 'Ativo' : 'Inativo'}</span></td>
                  <td className="px-4 py-3 text-sm flex gap-2">
                    <button onClick={() => openModal(p)} className="text-indigo-600 hover:text-indigo-900 font-medium"> Detalhes</button>
                    <button onClick={() => handleToggleAtivo(p)} disabled={isToggling} className={ont-medium  disabled:opacity-50}>{isToggling ? '' : p.ativo ? ' Desativar' : ' Ativar'}</button>
                  </td>
                </tr>
              );
            })}
            {!loading && visibleProdutos.length === 0 && (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">{searchTerm || selectedCategoryFilter ? 'Nenhum produto encontrado com os filtros aplicados.' : 'Nenhum produto cadastrado.'}</td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex justify-between items-center">
        <button onClick={() => setPagina(Math.max(1, pagina - 1))} className="px-3 py-1 border rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={pagina === 1}> Anterior</button>
        <span className="text-sm text-gray-600">Página {pagina} de {Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE))}  {total} produto(s)</span>
        <button onClick={() => setPagina(pagina + 1)} className="px-3 py-1 border rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={pagina * PAGE_SIZE >= (total ?? 0)}>Próxima </button>
      </div>
      <ProductDetailsModal />
    </PageWrapper>
  );
}
