"use client";
import React, { useEffect, useState, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';

type Franqueada = {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  cidade?: string | null;
  estado?: string | null;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  criado_em?: string;
  aprovado_em?: string | null;
  observacoes?: string | null;
};

export default function FranqueadasPage() {
  const [franqueadas, setFranqueadas] = useState<Franqueada[]>([]);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'aprovada' | 'rejeitada'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Carregar franqueadas
  const loadFranqueadas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/franqueadas/list?status=${statusFilter}`);
      if (!res.ok) throw new Error('Erro ao carregar franqueadas');
      const json = await res.json();
      setFranqueadas(json.data || []);
    } catch (err) {
      console.error('Erro ao carregar franqueadas:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao carregar franqueadas' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadFranqueadas();
  }, [loadFranqueadas]);

  async function aprovarFranqueada(id: string) {
    if (!confirm('Deseja aprovar esta franqueada?')) return;
    try {
      const res = await fetch('/api/admin/franqueadas/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'aprovar', franqueada_id: id })
      });
      if (!res.ok) throw new Error('Erro ao aprovar');
      await loadFranqueadas();
      setStatusMsg({ type: 'success', text: 'Franqueada aprovada com sucesso!' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error('Erro ao aprovar:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao aprovar franqueada' });
    }
  }

  async function rejeitarFranqueada(id: string) {
    const observacao = prompt('Motivo da rejeição (opcional):');
    if (observacao === null) return; // Cancelou
    try {
      const res = await fetch('/api/admin/franqueadas/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rejeitar', franqueada_id: id, observacoes: observacao })
      });
      if (!res.ok) throw new Error('Erro ao rejeitar');
      await loadFranqueadas();
      setStatusMsg({ type: 'success', text: 'Franqueada rejeitada' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error('Erro ao rejeitar:', err);
      setStatusMsg({ type: 'error', text: 'Erro ao rejeitar franqueada' });
    }
  }

  const franqueadasFiltradas = franqueadas.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const estatisticas = {
    pendentes: franqueadas.filter(f => f.status === 'pendente').length,
    aprovadas: franqueadas.filter(f => f.status === 'aprovada').length,
    rejeitadas: franqueadas.filter(f => f.status === 'rejeitada').length
  };

  return (
    <PageWrapper title="Franqueadas">
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">👥 Gerenciar Franqueadas</h1>

        {/* Mensagem de Status */}
        {statusMsg && (
          <div className={`mb-4 p-3 rounded border ${
            statusMsg.type === 'success' 
              ? 'bg-green-50 border-green-300 text-green-800' 
              : 'bg-red-50 border-red-300 text-red-800'
          }`}>
            {statusMsg.text}
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="🔍 Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="todos">📊 Todos os Status</option>
            <option value="pendente">⏳ Pendentes</option>
            <option value="aprovada">✓ Aprovadas</option>
            <option value="rejeitada">✕ Rejeitadas</option>
          </select>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <div className="text-yellow-700 text-sm font-medium">⏳ Pendentes</div>
            <div className="text-2xl font-bold text-yellow-800">
              {estatisticas.pendentes}
            </div>
          </div>
          <div className="bg-green-50 border border-green-300 rounded-lg p-4">
            <div className="text-green-700 text-sm font-medium">✓ Aprovadas</div>
            <div className="text-2xl font-bold text-green-800">
              {estatisticas.aprovadas}
            </div>
          </div>
          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <div className="text-red-700 text-sm font-medium">✕ Rejeitadas</div>
            <div className="text-2xl font-bold text-red-800">
              {estatisticas.rejeitadas}
            </div>
          </div>
        </div>

        {/* Lista de Franqueadas */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : franqueadasFiltradas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhuma franqueada encontrada</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {franqueadasFiltradas.map((f) => (
              <div key={f.id} className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{f.nome}</h3>
                      {f.status === 'pendente' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                          ⏳ Pendente
                        </span>
                      )}
                      {f.status === 'aprovada' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          ✓ Aprovada
                        </span>
                      )}
                      {f.status === 'rejeitada' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                          ✕ Rejeitada
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📧 Email: {f.email}</p>
                      {f.telefone && <p>📱 Telefone: {f.telefone}</p>}
                      {f.cpf && <p>🆔 CPF: {f.cpf}</p>}
                      {f.cidade && f.estado && <p>📍 Localização: {f.cidade}/{f.estado}</p>}
                      <p>📅 Cadastro: {f.criado_em ? new Date(f.criado_em).toLocaleDateString('pt-BR') : '—'}</p>
                      {f.aprovado_em && <p>✓ Aprovado em: {new Date(f.aprovado_em).toLocaleDateString('pt-BR')}</p>}
                      {f.observacoes && <p className="text-red-600">💬 Obs: {f.observacoes}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {f.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => aprovarFranqueada(f.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                        >
                          ✓ Aprovar
                        </button>
                        <button
                          onClick={() => rejeitarFranqueada(f.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                        >
                          ✕ Rejeitar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
