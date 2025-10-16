"use client";
import React, { useEffect, useState } from 'react';

type Comissao = {
  id: string;
  franqueada_id: string;
  franqueada_nome?: string | null;
  pedido_id: string;
  valor_venda: number;
  percentual: number;
  valor_comissao: number;
  status: 'pendente' | 'aprovada' | 'paga' | string;
  criado_em: string;
  pago_em?: string | null;
};

type ListResponse = {
  comissoes?: Comissao[];
  total?: number;
  resumo?: { total_vendas: number; total_a_pagar: number; total_pagos: number; franqueadas_ativas: number };
};

function usePoll<T = unknown>(url: string | null, interval = 5000) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    if (!url) return;
    let mounted = true;
    const fetchData = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        if (mounted) setData(json as T);
      } catch {
        // ignore
      }
    };
    fetchData();
    const id = setInterval(fetchData, interval);
    return () => { mounted = false; clearInterval(id); };
  }, [url, interval]);
  return { data };
}

export default function AdminComissoesPage() {
  const [status, setStatus] = useState<'Todos' | 'pendente' | 'aprovada' | 'paga'>('Todos');
  const [franqueada, setFranqueada] = useState('Todos');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [selected, setSelected] = useState<Comissao | null>(null);

  const query = `/api/admin/comissoes/list?page=${page}&per_page=${perPage}&status=${encodeURIComponent(status)}&franqueada=${encodeURIComponent(franqueada)}&from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}&q=${encodeURIComponent(search)}`;
  const { data } = usePoll<ListResponse>(query, 5000);

  const approve = async (c: Comissao) => {
    await fetch('/api/admin/comissoes/action', { method: 'POST', body: JSON.stringify({ action: 'approve', comissao_id: c.id }) });
    setSelected(null);
  };

  const markPaid = async (c: Comissao) => {
    await fetch('/api/admin/comissoes/action', { method: 'POST', body: JSON.stringify({ action: 'pay', comissao_id: c.id }) });
    setSelected(null);
  };

  const recalc = (c: Comissao) => {
    const novo = c.valor_venda * (Number(c.percentual) / 100);
    return Number(novo.toFixed(2));
  };

  return (
    <div className="min-h-screen bg-[#FFF5FA] p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Comissões</h1>
        <p className="text-sm text-gray-600">Acompanhe e gerencie as comissões das franqueadas</p>
      </header>

      {/* Resumo Cards */}
      <section className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm text-gray-500">Total de Vendas</h3>
          <div className="text-lg font-bold">R$ {Number(data?.resumo?.total_vendas ?? 0).toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm text-gray-500">Comissões a Pagar</h3>
          <div className="text-lg font-bold">R$ {Number(data?.resumo?.total_a_pagar ?? 0).toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm text-gray-500">Comissões Pagas</h3>
          <div className="text-lg font-bold">R$ {Number(data?.resumo?.total_pagos ?? 0).toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm text-gray-500">Franqueadas com Comissão</h3>
          <div className="text-lg font-bold">{data?.resumo?.franqueadas_ativas ?? 0}</div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white p-4 rounded shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="w-full md:w-auto">
            <label className="block text-sm">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as 'Todos' | 'pendente' | 'aprovada' | 'paga')} className="w-full md:w-auto p-2 border rounded">
              <option value="Todos">Todos</option>
              <option value="pendente">pendente</option>
              <option value="aprovada">aprovada</option>
              <option value="paga">paga</option>
            </select>
          </div>

          <div className="w-full md:w-auto">
            <label className="block text-sm">Franqueada</label>
            <input placeholder="Todas" value={franqueada} onChange={e => setFranqueada(e.target.value)} className="w-full p-2 border rounded" />
          </div>

          <div className="w-full md:w-auto">
            <label className="block text-sm">De</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full p-2 border rounded" />
          </div>

          <div className="w-full md:w-auto">
            <label className="block text-sm">Até</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full p-2 border rounded" />
          </div>

          <div className="w-full">
            <label className="block text-sm">Buscar</label>
            <input placeholder="Nome ou ID do pedido" value={search} onChange={e => setSearch(e.target.value)} className="w-full p-2 border rounded" />
          </div>

          <div className="w-full md:w-auto">
            <button onClick={() => setPage(1)} className="w-full md:w-auto px-4 py-3 bg-[#DB1472] text-white rounded">Aplicar</button>
          </div>
        </div>
      </section>

      {/* Table (desktop) */}
      <div className="bg-white rounded shadow overflow-auto hidden sm:block">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Revendedora</th>
              <th className="p-3">Pedido</th>
              <th className="p-3">Valor da Venda</th>
              <th className="p-3">Percentual</th>
              <th className="p-3">Comissão</th>
              <th className="p-3">Status</th>
              <th className="p-3">Data</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {(data?.comissoes || []).map(c => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{c.franqueada_nome ?? c.franqueada_id}</td>
                <td className="p-3"><button className="text-blue-600 underline" onClick={() => setSelected(c)}>{c.pedido_id}</button></td>
                <td className="p-3">R$ {Number(c.valor_venda).toFixed(2)}</td>
                <td className="p-3">{Number(c.percentual).toFixed(2)}%</td>
                <td className="p-3">R$ {Number(c.valor_comissao).toFixed(2)}</td>
                <td className={`p-3 ${c.status === 'paga' ? 'text-green-600' : c.status === 'pendente' ? 'text-orange-600' : 'text-blue-600'}`}>{c.status}</td>
                <td className="p-3">{new Date(c.criado_em).toLocaleString()}</td>
                <td className="p-3 flex flex-col sm:flex-row gap-2">
                  <button onClick={() => setSelected(c)} className="px-3 py-2 border rounded-md text-sm">Ver Detalhes</button>
                  {c.status === 'pendente' && <button onClick={() => approve(c)} className="px-3 py-2 bg-[#F8B81F] rounded-md text-sm">Aprovar</button>}
                  {c.status !== 'paga' && <button onClick={() => markPaid(c)} className="px-3 py-2 bg-green-600 text-white rounded-md text-sm">Marcar como Paga</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards fallback */}
      <div className="sm:hidden space-y-3">
        {(data?.comissoes || []).map(c => (
          <div key={c.id} className="bg-white rounded shadow p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-500">Revendedora</div>
                <div className="font-medium">{c.franqueada_nome ?? c.franqueada_id}</div>
                <div className="text-sm text-gray-500 mt-2">Pedido</div>
                <button className="text-blue-600 underline text-sm" onClick={() => setSelected(c)}>{c.pedido_id}</button>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Status</div>
                <div className={`${c.status === 'paga' ? 'text-green-600' : c.status === 'pendente' ? 'text-orange-600' : 'text-blue-600'} font-medium`}>{c.status}</div>
                <div className="text-sm text-gray-500 mt-2">Valor</div>
                <div className="font-medium">R$ {Number(c.valor_comissao).toFixed(2)}</div>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {c.status === 'pendente' && <button onClick={() => approve(c)} className="w-full px-3 py-3 bg-[#F8B81F] rounded">Aprovar</button>}
              {c.status !== 'paga' && <button onClick={() => markPaid(c)} className="w-full px-3 py-3 bg-green-600 text-white rounded">Marcar como Paga</button>}
              <button onClick={() => setSelected(c)} className="w-full px-3 py-3 border rounded">Ver Detalhes</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <button onClick={() => setPage(Math.max(1, page - 1))} className="px-3 py-1 border rounded">Anterior</button>
          <span className="px-3">Página {page}</span>
          <button onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded">Próxima</button>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-start">
          <div className="ml-auto w-full md:w-2/5 bg-white p-4 md:p-6 overflow-auto h-full">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Comissão {selected.id}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-600">Fechar</button>
            </div>

            <section className="mt-4">
              <h3 className="font-semibold">Revendedora</h3>
              <p>{selected.franqueada_nome ?? selected.franqueada_id}</p>
            </section>

            <section className="mt-4">
              <h3 className="font-semibold">Venda</h3>
              <p>Pedido: {selected.pedido_id}</p>
              <p>Valor da venda: R$ {Number(selected.valor_venda).toFixed(2)}</p>
              <p>Percentual: {Number(selected.percentual).toFixed(2)}%</p>
              <p>Comissão atual: R$ {Number(selected.valor_comissao).toFixed(2)}</p>
              <p>Comissão (recalcular): R$ {recalc(selected)}</p>
            </section>

            <section className="mt-4">
              <h3 className="font-semibold">Status</h3>
              <p>{selected.status}</p>
              <p>Pago em: {selected.pago_em ?? '—'}</p>
            </section>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {selected.status === 'pendente' && <button onClick={() => approve(selected)} className="w-full sm:w-auto px-4 py-3 bg-[#F8B81F] rounded">Aprovar Comissão</button>}
              {selected.status !== 'paga' && <button onClick={() => markPaid(selected)} className="w-full sm:w-auto px-4 py-3 bg-green-600 text-white rounded">Marcar como Paga</button>}
              <button onClick={() => { window.print(); }} className="w-full sm:w-auto px-4 py-3 border rounded">Exportar Recibo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
