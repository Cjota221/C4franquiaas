"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';

import { useProdutoStore, Produto as ProdutoType } from '@/lib/store/produtoStore';
import { useCategoriaStore } from '@/lib/store/categoriaStore';
import { useStatusStore } from '@/lib/store/statusStore';
import { supabase } from '@/lib/supabaseClient';
import { useProductFilters } from '@/hooks/useProductFilters';

const PAGE_SIZE = 50;

type Produto = { id: number; nome: string; preco_base?: number | null; estoque?: number; imagem?: string | null; estoque_display?: number };

export default function ProdutosPage(): React.JSX.Element {
  // ensure filters hook runs and populates visibleProdutos from produtos
  useProductFilters();

  const visibleProdutos = useProdutoStore((s) => s.visibleProdutos);
  const pagina = useProdutoStore((s) => s.pagina);
  const total = useProdutoStore((s) => s.total);
  const setPagina = useProdutoStore((s) => s.setPagina);
  const setProdutos = useProdutoStore((s) => s.setProdutos);
  const setTotal = useProdutoStore((s) => s.setTotal);
  const setLoading = useProdutoStore((s) => s.setLoading);
  const toggleSelected = useProdutoStore((s) => s.toggleSelected);
  const selectedIds = useProdutoStore((s) => s.selectedIds);
  const getSelectedCount = useProdutoStore((s) => s.getSelectedCount);

  const setCategoryPanelOpen = useCategoriaStore((s) => s.setCategoryPanelOpen);
  const statusMsg = useStatusStore((s) => s.statusMsg);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const from = (pagina - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error, count } = await supabase
          .from('produtos')
          .select('id,id_externo,nome,estoque,preco_base,ativo,imagem,imagens,variacoes_meta,codigo_barras,categorias', { count: 'exact' })
          .range(from, to)
          .order('nome', { ascending: true });
        if (!cancelled) {
          if (error) {
            console.error('[admin/produtos] supabase list error', error);
          } else {
            const mapped: ProdutoType[] = (data ?? []).map((r: Record<string, unknown>) => {
              const id = Number(r['id'] ?? 0);
              const id_externo = typeof r['id_externo'] === 'string' ? (r['id_externo'] as string) : undefined;
              const nome = typeof r['nome'] === 'string' ? (r['nome'] as string) : String(r['nome'] ?? '');
              const estoque = typeof r['estoque'] === 'number' ? (r['estoque'] as number) : Number(r['estoque'] ?? 0);
              const preco_base = typeof r['preco_base'] === 'number' ? (r['preco_base'] as number) : (r['preco_base'] == null ? null : Number(r['preco_base']));
              const ativo = typeof r['ativo'] === 'boolean' ? (r['ativo'] as boolean) : Boolean(r['ativo'] ?? false);
              const imagem = typeof r['imagem'] === 'string' ? (r['imagem'] as string) : null;
              return {
                id,
                id_externo,
                nome,
                estoque,
                preco_base,
                ativo,
                imagem,
                estoque_display: estoque,
              } as ProdutoType;
            });
            setProdutos(mapped);
            setTotal(count ?? 0);
          }
        }
      } catch (err) {
        console.error('[admin/produtos] fetch error', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pagina, setProdutos, setTotal, setLoading]);

  return (
    <div className="p-8 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Catálogo de Produtos</h1>
          <p className="text-gray-500 mt-1">Gerencie os produtos da sua loja.</p>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={getSelectedCount() === 0} className="px-3 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">Ações ({getSelectedCount()})</button>
          <button onClick={() => setCategoryPanelOpen(true)} className="px-3 py-2 bg-indigo-600 text-white rounded">Categorias</button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3 mb-6 rounded ${statusMsg.type === 'success' ? 'bg-green-500 text-white' : statusMsg.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleProdutos.map((p: Produto) => (
          <div key={p.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={!!selectedIds[p.id]} onChange={() => toggleSelected(p.id)} />
              <Image src={p.imagem ?? '/placeholder-100.png'} alt={p.nome} width={96} height={96} className="object-cover rounded" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{p.nome}</h3>
                <p className="text-sm text-gray-600">R$ {(p.preco_base ?? 0).toFixed(2)}</p>
                <p className="text-sm text-gray-500">Est: {p.estoque_display}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <button onClick={() => setPagina(Math.max(1, pagina - 1))} className="px-3 py-1 border rounded"> Anterior</button>
        <span>Página {pagina} de {Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE))}</span>
        <button onClick={() => setPagina(pagina + 1)} className="px-3 py-1 border rounded">Próxima </button>
      </div>
    </div>
  );
}

