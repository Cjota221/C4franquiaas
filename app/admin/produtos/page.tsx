"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { RefreshCw } from 'lucide-react';

const PAGE_SIZE = 50;
const axiosClient = axios.create({ timeout: 10000 });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Produto = {
  id: number;
  id_externo?: string;
  nome: string;
  estoque: number;
  preco_base: number | null;
  ativo: boolean;
  imagem: string | null;
  imagens?: string[];
};

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'loading'; text: string } | null>(null);
  const [toggling, setToggling] = useState<Record<number, boolean>>({});

  async function fetchPage(page: number) {
    setLoading(true);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from('produtos')
        .select('id,id_externo,nome,estoque,preco_base,ativo,imagem', { count: 'exact' })
        .range(from, to)
        .order('nome', { ascending: true });

      if (error) {
        console.error('[produtos] supabase error', error);
        setStatusMsg({ type: 'error', text: 'Erro ao carregar produtos.' });
      } else {
        setProdutos((data as Produto[]) || []);
        setTotal(count ?? 0);
      }
    } catch (err: unknown) {
      console.error('[produtos] fetchPage catch', err);
      setStatusMsg({ type: 'error', text: 'Erro ao carregar produtos.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPage(pagina);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);

  async function handleSync() {
    setStatusMsg({ type: 'loading', text: 'Sincronizando produtos...' });
    try {
      const resp = await axiosClient.post('/api/sync-produtos');
      setStatusMsg({ type: 'success', text: resp.data?.message ?? 'Sincronização concluída.' });
      setPagina(1);
      await fetchPage(1);
    } catch (err: unknown) {
      console.error('[sync] error', err);
      const msg = err instanceof Error ? err.message : 'Erro ao sincronizar.';
      setStatusMsg({ type: 'error', text: msg });
    }
  }

  async function toggleAtivo(produto: Produto) {
    setToggling((s) => ({ ...s, [produto.id]: true }));
    try {
      const resp = await axiosClient.patch(`/api/produtos/${produto.id}`, { ativo: !produto.ativo }, { headers: { 'Content-Type': 'application/json' } });
      if (resp.status >= 200 && resp.status < 300) {
        setProdutos((prev) => prev.map(p => p.id === produto.id ? { ...p, ativo: !p.ativo } : p));
        setStatusMsg({ type: 'success', text: 'Status atualizado.' });
      } else {
        setStatusMsg({ type: 'error', text: resp.data?.error ?? 'Falha ao atualizar.' });
      }
    } catch (err: unknown) {
      console.error('[toggleAtivo] error', err);
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar.';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setToggling((s) => ({ ...s, [produto.id]: false }));
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-8 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Catálogo de Produtos</h1>
          <p className="text-gray-500 mt-1">Gerencie e sincronize os produtos da sua loja.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSync} disabled={statusMsg?.type === 'loading'} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-pink-600 rounded-lg shadow-md hover:bg-pink-700 disabled:bg-pink-300">
            <RefreshCw className={`h-5 w-5 ${statusMsg?.type === 'loading' ? 'animate-spin' : ''}`} />
            {statusMsg?.type === 'loading' ? 'Sincronizando...' : 'Sincronizar Produtos'}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3 mb-6 rounded ${statusMsg.type === 'success' ? 'bg-green-500 text-white' : statusMsg.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
          {statusMsg.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-gray-600">
                <th className="p-4 font-semibold">Imagem</th>
                <th className="p-4 font-semibold">Nome</th>
                <th className="p-4 font-semibold">Estoque</th>
                <th className="p-4 font-semibold">Preço</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Carregando...</td></tr>
              ) : produtos.length > 0 ? (
                produtos.map((p) => (
                  <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="relative h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                        <Image
                          src={p.imagem ?? '/placeholder-100.png'}
                          alt={p.nome}
                          width={64}
                          height={64}
                          className="object-cover"
                          unoptimized={false}
                        />
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-800">{p.nome}</td>
                    <td className="p-4 text-gray-600">{p.estoque}</td>
                    <td className="p-4 text-gray-600">{p.preco_base !== null ? `R$ ${p.preco_base.toFixed(2)}` : 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${p.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.ativo ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => toggleAtivo(p)} disabled={!!toggling[p.id]} className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200">
                        {toggling[p.id] ? '...' : p.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nenhum produto encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
          <span className="text-sm text-gray-600">Página {pagina} de {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1} className="px-3 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-50">Anterior</button>
            <button onClick={() => setPagina((p) => Math.min(totalPages, p + 1))} disabled={pagina >= totalPages} className="px-3 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-50">Próxima</button>
          </div>
        </div>
      </div>
    </div>
  );
}