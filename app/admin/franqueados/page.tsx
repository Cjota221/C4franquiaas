"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import PageWrapper from '@/components/PageWrapper';

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

type ProdutoVinculado = {
  id: number;
  nome: string;
  preco_base?: number | null;
  imagem?: string | null;
  ativo: boolean;
  vinculado_em?: string;
};

export default function FranqueadosPage() {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [data, setData] = useState<Franqueado[]>([]);
  const [selected, setSelected] = useState<Franqueado | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Franqueado | null>(null);
  const [summary, setSummary] = useState({ ativos: 0, inativos: 0, total: 0 });
  
  // Estados para aba de produtos
  const [abaAtiva, setAbaAtiva] = useState<'info' | 'produtos'>('info');
  const [produtosVinculados, setProdutosVinculados] = useState<ProdutoVinculado[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);



  // Carregar produtos vinculados
  async function carregarProdutosVinculados(franqueadaId: string) {
    setLoadingProdutos(true);
    try {
      const res = await fetch(`/api/admin/franqueados/${franqueadaId}/produtos`);
      if (!res.ok) throw new Error('Erro ao carregar produtos');
      const json = await res.json();
      setProdutosVinculados(json.data || []);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setProdutosVinculados([]);
    } finally {
      setLoadingProdutos(false);
    }
  }

  // Action handlers that call the server action endpoint
  async function toggleStatusServer(f: Franqueado) {
    try {
      const newStatus = f.status === 'ativo' ? 'inativo' : 'ativo';
      const res = await fetch('/api/admin/franqueados/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-status', franqueado_id: f.id, updates: { status: newStatus } })
      });
      if (!res.ok) throw new Error(await res.text());
      setData(prev => prev.map(p => p.id === f.id ? { ...p, status: newStatus } : p));
      setSelected(prev => (prev && prev.id === f.id ? { ...prev, status: newStatus } : prev));
    } catch (err) {
      console.error('toggleStatusServer', err);
      alert('Erro ao atualizar status');
    }
  }

  async function deleteFranqueado(f: Franqueado) {
    if (!confirm(`Deseja excluir ${f.nome}?`)) return;
    try {
      const res = await fetch('/api/admin/franqueados/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', franqueado_id: f.id })
      });
      if (!res.ok) throw new Error(await res.text());
      setData(prev => prev.filter(p => p.id !== f.id));
      if (selected?.id === f.id) setSelected(null);
    } catch (err) {
      console.error('deleteFranqueado', err);
      alert('Erro ao deletar franqueado');
    }
  }

  function startEdit(f: Franqueado) {
    setEditForm({ ...f });
    setEditMode(true);
  }

  async function handleSaveEdit() {
    if (!editForm) return;
    try {
      const res = await fetch('/api/admin/franqueados/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', franqueado_id: editForm.id, updates: editForm })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const updated = json.data ?? editForm;
      setData(prev => prev.map(p => p.id === updated.id ? updated : p));
      setSelected(updated);
      setEditMode(false);
      setEditForm(null);
    } catch (err) {
      console.error('handleSaveEdit', err);
      alert('Erro ao salvar alterações');
    }
  }

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
    <PageWrapper
      title="Franqueados"
      description="Gerencie as franqueadas cadastradas"
      actionButton={<button className="px-4 py-2 bg-[#DB1472] text-white rounded">+ Novo</button>}
    >
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                  {f.status === 'inativo' ? (
                    <button onClick={() => toggleStatusServer(f)} className="px-3 py-2 bg-green-600 text-white rounded">Ativar</button>
                  ) : (
                    <button onClick={() => toggleStatusServer(f)} className="px-3 py-2 bg-red-600 text-white rounded">Desativar</button>
                  )}
                  <button onClick={() => startEdit(f)} className="px-3 py-2 bg-[#F8B81F] rounded">Editar</button>
                  <button onClick={() => deleteFranqueado(f)} className="px-3 py-2 border rounded text-red-600">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {data.map(f => (
          <div key={f.id} className="bg-white rounded shadow p-3 relative">
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
              <div className="relative">
                <button
                  aria-haspopup="true"
                  aria-expanded={openMenuId === f.id}
                  onClick={() => setOpenMenuId(openMenuId === f.id ? null : f.id)}
                  className="px-3 py-3 bg-[#DB1472] text-white rounded"
                >
                  ⋮
                </button>

                {openMenuId === f.id && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow z-50">
                    <button onClick={() => { setSelected(f); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Ver Detalhes</button>
                    <button onClick={() => { startEdit(f); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Editar</button>
                    {f.status === 'inativo' ? (
                      <button onClick={() => { toggleStatusServer(f); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Ativar</button>
                    ) : (
                      <button onClick={() => { toggleStatusServer(f); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Desativar</button>
                    )}
                    <button onClick={() => { deleteFranqueado(f); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-50">Excluir</button>
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
        <div className="fixed inset-0 bg-black/40 flex items-start z-50">
          <div className="ml-auto w-full md:w-2/5 bg-white p-4 md:p-6 overflow-auto h-full">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Franqueada {selected.nome}</h2>
              <button onClick={() => { setSelected(null); setAbaAtiva('info'); }} className="text-gray-600">Fechar</button>
            </div>

            {/* Abas */}
            <div className="border-b border-gray-300 mt-4 mb-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setAbaAtiva('info')}
                  className={`px-4 py-2 font-medium ${
                    abaAtiva === 'info'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ℹ️ Informações
                </button>
                <button
                  onClick={() => {
                    setAbaAtiva('produtos');
                    carregarProdutosVinculados(selected.id);
                  }}
                  className={`px-4 py-2 font-medium ${
                    abaAtiva === 'produtos'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📦 Produtos
                </button>
              </div>
            </div>

            {/* Conteúdo da aba Info */}
            {abaAtiva === 'info' && (
              <div>
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
                  <button
                    onClick={() => { if (selected) toggleStatusServer(selected); }}
                    className="w-full sm:w-auto px-4 py-3 bg-red-600 text-white rounded"
                  >
                    {selected?.status === 'inativo' ? 'Ativar' : 'Desativar'}
                  </button>
                  <button className="w-full sm:w-auto px-4 py-3 border rounded">Ver Histórico de Pagamentos</button>
                </div>
              </div>
            )}

            {/* Conteúdo da aba Produtos */}
            {abaAtiva === 'produtos' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">📦 Produtos Vinculados</h3>
                {loadingProdutos ? (
                  <div className="text-center py-8 text-gray-500">Carregando produtos...</div>
                ) : produtosVinculados.length === 0 ? (
                  <p className="text-gray-500 text-sm py-8 text-center">Nenhum produto vinculado ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {produtosVinculados.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex items-center gap-3 flex-1">
                          {p.imagem && (
                            <Image src={p.imagem} alt={p.nome} width={48} height={48} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{p.nome}</div>
                            <div className="text-xs text-gray-500">
                              R$ {p.preco_base?.toFixed(2) ?? '0.00'}
                              {p.vinculado_em && (
                                <span className="ml-2">• Vinculado em {new Date(p.vinculado_em).toLocaleDateString('pt-BR')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          p.ativo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {p.ativo ? '✓ Ativo' : '✕ Inativo'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

        {/* Edit modal */}
        {editMode && editForm && (
          <div className="fixed inset-0 bg-black/50 flex items-start z-50">
            <div className="ml-auto w-full md:w-2/5 bg-white p-4 md:p-6 overflow-auto h-full">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Editar Franqueada</h2>
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
                  <div className="text-sm text-gray-600">Cidade</div>
                  <input className="w-full p-2 border rounded" value={editForm.cidade ?? ''} onChange={e => setEditForm({ ...editForm, cidade: e.target.value })} />
                </label>
              </section>

              <div className="mt-6 flex gap-3">
                <button onClick={handleSaveEdit} className="px-4 py-2 bg-[#DB1472] text-white rounded">Salvar</button>
                <button onClick={() => { setEditMode(false); setEditForm(null); }} className="px-4 py-2 border rounded">Cancelar</button>
              </div>
            </div>
          </div>
        )}
    </PageWrapper>
  );
}
