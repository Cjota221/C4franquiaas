"use client";
import React, { useEffect, useState } from 'react';

type Afiliado = {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  link_afiliado?: string | null;
  vendas_geradas?: number;
  comissao_acumulada?: number;
  status: 'ativo' | 'inativo' | string;
  criado_em?: string;
};

export default function AfiliadosPage() {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [data, setData] = useState<Afiliado[]>([]);
  const [selected, setSelected] = useState<Afiliado | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Afiliado | null>(null);
  const [summary, setSummary] = useState({ ativos: 0, inativos: 0, total: 0 });

  const query = `/api/admin/afiliados/list?page=${page}&per_page=${perPage}&status=${encodeURIComponent(statusFilter)}&q=${encodeURIComponent(q)}`;

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

  // Handlers
  async function toggleAfiliadoStatus(a: Afiliado) {
    try {
      const newStatus = a.status === 'ativo' ? 'inativo' : 'ativo';
      const res = await fetch('/api/admin/afiliados/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-status', afiliado_id: a.id, updates: { status: newStatus } })
      });
      if (!res.ok) throw new Error(await res.text());
      setData(prev => prev.map(p => p.id === a.id ? { ...p, status: newStatus } : p));
      setSelected(prev => (prev && prev.id === a.id ? { ...prev, status: newStatus } : prev));
    } catch (err) {
      console.error('toggleAfiliadoStatus', err);
      alert('Erro ao alterar status');
    }
  }

  async function deleteAfiliado(a: Afiliado) {
    if (!confirm(`Deseja excluir ${a.nome}?`)) return;
    try {
      const res = await fetch('/api/admin/afiliados/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', afiliado_id: a.id })
      });
      if (!res.ok) throw new Error(await res.text());
      setData(prev => prev.filter(p => p.id !== a.id));
      if (selected?.id === a.id) setSelected(null);
    } catch (err) {
      console.error('deleteAfiliado', err);
      alert('Erro ao deletar afiliado');
    }
  }

  function startEditAfiliado(a: Afiliado) {
    setEditForm({ ...a });
    setEditMode(true);
  }

  async function handleSaveEditAfiliado() {
    if (!editForm) return;
    try {
      const res = await fetch('/api/admin/afiliados/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', afiliado_id: editForm.id, updates: editForm })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const updated = json.data ?? editForm;
      setData(prev => prev.map(p => p.id === updated.id ? updated : p));
      setSelected(updated);
      setEditMode(false);
      setEditForm(null);
    } catch (err) {
      console.error('handleSaveEditAfiliado', err);
      alert('Erro ao salvar alterações');
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF5FA] p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Afiliados</h1>
          <p className="text-sm text-gray-600">Gerencie os afiliados e seus links</p>
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
              <th className="p-3">Nome do Afiliado</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Telefone</th>
              <th className="p-3">Link de Afiliado</th>
              <th className="p-3">Vendas Geradas</th>
              <th className="p-3">Comissão</th>
              <th className="p-3">Status</th>
              <th className="p-3">Data de Cadastro</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map(a => (
              <tr key={a.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{a.nome}</td>
                <td className="p-3">{a.email}</td>
                <td className="p-3">{a.telefone ?? '—'}</td>
                <td className="p-3"><a href={a.link_afiliado ?? '#'} target="_blank" rel="noreferrer" className="text-blue-600 underline">Link</a></td>
                <td className="p-3">{a.vendas_geradas ?? 0}</td>
                <td className="p-3">R$ {Number(a.comissao_acumulada ?? 0).toFixed(2)}</td>
                <td className={`p-3 ${a.status === 'ativo' ? 'text-green-600' : 'text-red-600'}`}>{a.status}</td>
                <td className="p-3">{a.criado_em ? new Date(a.criado_em).toLocaleDateString() : '—'}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => setSelected(a)} className="px-3 py-2 border rounded">Ver Detalhes</button>
                  {a.status === 'inativo' ? <button onClick={() => toggleAfiliadoStatus(a)} className="px-3 py-2 bg-green-600 text-white rounded">Ativar</button> : <button onClick={() => toggleAfiliadoStatus(a)} className="px-3 py-2 bg-red-600 text-white rounded">Desativar</button>}
                  <button onClick={() => startEditAfiliado(a)} className="px-3 py-2 bg-[#F8B81F] rounded">Editar</button>
                  <button onClick={() => deleteAfiliado(a)} className="px-3 py-2 border rounded">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {data.map(a => (
          <div key={a.id} className="bg-white rounded shadow p-3 relative">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{a.nome}</div>
                <div className="text-sm text-gray-500">{a.email}</div>
                <div className="text-sm text-gray-500">{a.telefone ?? '—'}</div>
              </div>
              <div className="text-right">
                <div className={`${a.status === 'ativo' ? 'text-green-600' : 'text-red-600'} font-medium`}>{a.status}</div>
                <div className="text-sm text-gray-500">R$ {Number(a.comissao_acumulada ?? 0).toFixed(2)}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setSelected(a)} className="flex-1 px-3 py-3 border rounded">Ver Detalhes</button>
              <div className="relative">
                <button
                  aria-haspopup="true"
                  aria-expanded={openMenuId === a.id}
                  onClick={() => setOpenMenuId(openMenuId === a.id ? null : a.id)}
                  className="px-3 py-3 bg-[#DB1472] text-white rounded"
                >
                  ⋮
                </button>

                {openMenuId === a.id && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow z-50">
                    <button onClick={() => { setSelected(a); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Ver Detalhes</button>
                    <button onClick={() => { navigator.clipboard?.writeText(a.link_afiliado ?? ''); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Copiar link</button>
                    {a.status === 'inativo' ? (
                 <button onClick={() => { toggleAfiliadoStatus(a); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Ativar</button>
                    ) : (
                 <button onClick={() => { toggleAfiliadoStatus(a); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Desativar</button>
                    )}
                <button onClick={() => { deleteAfiliado(a); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-50">Excluir</button>
                  </div>
                )}
              </div>
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
              <h2 className="text-lg font-bold">Afiliado {selected.nome}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-600">Fechar</button>
            </div>

            <section className="mt-4">
              <h3 className="font-semibold">Dados</h3>
              <p><strong>Nome:</strong> {selected.nome}</p>
              <p><strong>E-mail:</strong> {selected.email}</p>
              <p><strong>Telefone:</strong> {selected.telefone ?? '—'}</p>
            </section>

            <section className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="text-sm text-gray-500">Total de Vendas</h4>
                <div className="font-bold">{selected.vendas_geradas ?? 0}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="text-sm text-gray-500">Comissão Acumulada</h4>
                <div className="font-bold">R$ {Number(selected.comissao_acumulada ?? 0).toFixed(2)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="text-sm text-gray-500">Última Venda</h4>
                <div className="font-bold">—</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="text-sm text-gray-500">Histórico</h4>
                <div className="font-bold">—</div>
              </div>
            </section>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button onClick={() => { navigator.clipboard?.writeText(selected.link_afiliado ?? ''); }} className="w-full sm:w-auto px-4 py-3 bg-[#DB1472] text-white rounded">Copiar link de afiliado</button>
              <button className="w-full sm:w-auto px-4 py-3 border rounded">Ver comissões detalhadas</button>
              <button
                onClick={() => { if (selected) toggleAfiliadoStatus(selected); }}
                className="w-full sm:w-auto px-4 py-3 bg-red-600 text-white rounded"
              >
                {selected?.status === 'inativo' ? 'Ativar' : 'Desativar'}
              </button>
            </div>

            <section className="mt-6">
              <h3 className="font-semibold">Últimas Comissões</h3>
              <table className="w-full mt-2">
                <thead>
                  <tr className="text-left border-b">
                    <th className="p-2">Data</th>
                    <th className="p-2">Valor</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Placeholder rows */}
                  <tr className="border-b"><td className="p-2">—</td><td className="p-2">—</td><td className="p-2">—</td></tr>
                </tbody>
              </table>
            </section>

          </div>
        </div>
      )}

      {/* Edit modal */}
      {editMode && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start">
          <div className="ml-auto w-full md:w-2/5 bg-white p-4 md:p-6 overflow-auto h-full">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Editar Afiliado</h2>
              <button onClick={() => { setEditMode(false); setEditForm(null); }} className="text-gray-600">Fechar</button>
            </div>

            <section className="mt-4 space-y-3">
              <label className="block">
                <div className="text-sm text-gray-600">Nome</div>
                <input className="w-full p-2 border rounded" value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} />
              </label>
              <label className="block">
                <div className="text-sm text-gray-600">E-mail</div>
                <input className="w-full p-2 border rounded" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </label>
              <label className="block">
                <div className="text-sm text-gray-600">Telefone</div>
                <input className="w-full p-2 border rounded" value={editForm.telefone ?? ''} onChange={e => setEditForm({ ...editForm, telefone: e.target.value })} />
              </label>
              <label className="block">
                <div className="text-sm text-gray-600">Link de Afiliado</div>
                <input className="w-full p-2 border rounded" value={editForm.link_afiliado ?? ''} onChange={e => setEditForm({ ...editForm, link_afiliado: e.target.value })} />
              </label>
            </section>

            <div className="mt-6 flex gap-3">
              <button onClick={handleSaveEditAfiliado} className="px-4 py-2 bg-[#DB1472] text-white rounded">Salvar</button>
              <button onClick={() => { setEditMode(false); setEditForm(null); }} className="px-4 py-2 border rounded">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
