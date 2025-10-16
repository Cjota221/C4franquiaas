"use client";
import React, { useEffect, useState } from 'react';

type Franqueado = {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  cidade?: string | null;
  status: 'ativo' | 'inativo' | string;
  vendas_total?: number;
  comissao_acumulada?: number;
  criado_em?: string;
  loja?: { nome?: string; logo?: string | null; cores?: string[]; produtos_ativos?: number } | null;
};

export default function FranqueadosPage() {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [data, setData] = useState<Franqueado[]>([]);
  const [selected, setSelected] = useState<Franqueado | null>(null);
  const [summary, setSummary] = useState({ ativos: 0, inativos: 0, total: 0 });

  const query = `/api/admin/franqueados/list?page=${page}&per_page=${perPage}&status=${encodeURIComponent(statusFilter)}&q=${encodeURIComponent(q)}`;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch(query);
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setData(json.items || []);
        setSummary({ ativos: json.resumo?.ativos ?? 0, inativos: json.resumo?.inativos ?? 0, total: json.resumo?.total ?? 0 });
      } catch {
        // ignore
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, [query]);

  return (
    <div className="min-h-screen bg-[#FFF5FA] p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Franqueados</h1>
          <p className="text-sm text-gray-600">Gerencie as franqueadas cadastradas</p>
        </div>
        <div>
          <button className="px-4 py-2 bg-[#DB1472] text-white rounded">+ Novo</button>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm text-gray-500">Ativos</h3>
          <div className="text-lg font-bold">{summary.ativos}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm text-gray-500">Inativos</h3>
          <div className="text-lg font-bold">{summary.inativos}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm text-gray-500">Total</h3>
          <div className="text-lg font-bold">{summary.total}</div>
        </div>
      </section>

      <section className="bg-white p-4 rounded shadow mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input className="w-full md:w-64 p-2 border rounded" placeholder="Buscar por nome, e-mail ou telefone" value={q} onChange={e => setQ(e.target.value)} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'todos' | 'ativo' | 'inativo')} className="p-2 border rounded">
            <option value="todos">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
          <div className="ml-auto">
            <button onClick={() => setPage(1)} className="px-4 py-2 bg-[#DB1472] text-white rounded">Aplicar</button>
          </div>
        </div>
      </section>

      {/* Desktop table */}
      <div className="bg-white rounded shadow overflow-auto hidden sm:block">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Nome da Franqueada</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Telefone</th>
              <th className="p-3">Status</th>
              <th className="p-3">Vendas</th>
              <th className="p-3">Comissão</th>
              <th className="p-3">Data de Cadastro</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map(f => (
              <tr key={f.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{f.nome}</td>
                <td className="p-3">{f.email}</td>
                <td className="p-3">{f.telefone ?? '—'}</td>
                <td className={`p-3 ${f.status === 'ativo' ? 'text-green-600' : 'text-red-600'}`}>{f.status}</td>
                <td className="p-3">{f.vendas_total ?? 0}</td>
                <td className="p-3">R$ {Number(f.comissao_acumulada ?? 0).toFixed(2)}</td>
                <td className="p-3">{f.criado_em ? new Date(f.criado_em).toLocaleDateString() : '—'}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => setSelected(f)} className="px-3 py-2 border rounded">Ver Detalhes</button>
                  {f.status === 'inativo' ? <button className="px-3 py-2 bg-green-600 text-white rounded">Ativar</button> : <button className="px-3 py-2 bg-red-600 text-white rounded">Desativar</button>}
                  <button className="px-3 py-2 bg-[#F8B81F] rounded">Editar</button>
                  <button className="px-3 py-2 border rounded">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {data.map(f => (
          <div key={f.id} className="bg-white rounded shadow p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{f.nome}</div>
                <div className="text-sm text-gray-500">{f.email}</div>
                <div className="text-sm text-gray-500">{f.telefone ?? '—'}</div>
              </div>
              <div className="text-right">
                <div className={`${f.status === 'ativo' ? 'text-green-600' : 'text-red-600'} font-medium`}>{f.status}</div>
                <div className="text-sm text-gray-500">R$ {Number(f.comissao_acumulada ?? 0).toFixed(2)}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setSelected(f)} className="flex-1 px-3 py-3 border rounded">Ver Detalhes</button>
              <button className="px-3 py-3 bg-[#DB1472] text-white rounded">⋮</button>
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

      {/* Modal lateral */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-start">
          <div className="ml-auto w-full md:w-2/5 bg-white p-4 md:p-6 overflow-auto h-full">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Franqueada {selected.nome}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-600">Fechar</button>
            </div>

            <section className="mt-4">
              <h3 className="font-semibold">Dados</h3>
              <p><strong>Nome:</strong> {selected.nome}</p>
              <p><strong>E-mail:</strong> {selected.email}</p>
              <p><strong>Telefone:</strong> {selected.telefone ?? '—'}</p>
              <p><strong>Cidade:</strong> {selected.cidade ?? '—'}</p>
              <p><strong>Cadastrado em:</strong> {selected.criado_em ? new Date(selected.criado_em).toLocaleString() : '—'}</p>
            </section>

            <section className="mt-4">
              <h3 className="font-semibold">Loja</h3>
              <p><strong>Nome da loja:</strong> {selected.loja?.nome ?? '—'}</p>
              <p><strong>Produtos ativos:</strong> {selected.loja?.produtos_ativos ?? 0}</p>
            </section>

            <section className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="text-sm text-gray-500">Total de Vendas</h4>
                <div className="font-bold">{selected.vendas_total ?? 0}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="text-sm text-gray-500">Total de Clientes</h4>
                <div className="font-bold">—</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="text-sm text-gray-500">Comissão Acumulada</h4>
                <div className="font-bold">R$ {Number(selected.comissao_acumulada ?? 0).toFixed(2)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="text-sm text-gray-500">Último Acesso</h4>
                <div className="font-bold">—</div>
              </div>
            </section>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a className="w-full sm:w-auto px-4 py-3 bg-[#DB1472] text-white rounded" href="#" target="_blank" rel="noreferrer">Ver Loja</a>
              <button className="w-full sm:w-auto px-4 py-3 bg-red-600 text-white rounded">Desativar / Reativar Acesso</button>
              <button className="w-full sm:w-auto px-4 py-3 border rounded">Ver Histórico de Pagamentos</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
