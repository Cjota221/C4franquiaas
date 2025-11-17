"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type Loja = {
  id: string;
  nome: string;
  dominio: string;
  logo: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  ativo: boolean;
  produtos_ativos: number;
};

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
  vendas_total?: number;
  comissao_acumulada?: number;
  loja?: Loja | null;
};

export default function FranqueadasPage() {
  const router = useRouter();
  const [franqueadas, setFranqueadas] = useState<Franqueada[]>([]);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'aprovada' | 'rejeitada' | 'ativa' | 'inativa'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
    if (!confirm('Deseja aprovar esta franqueada? Todos os produtos ativos serão vinculados automaticamente.')) return;
    try {
      const res = await fetch('/api/admin/franqueadas/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'aprovar', franqueada_id: id })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erro ao aprovar');
      
      await loadFranqueadas();
      setStatusMsg({ type: 'success', text: '✅ ' + data.message });
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err) {
      console.error('Erro ao aprovar:', err);
      setStatusMsg({ type: 'error', text: '❌ Erro ao aprovar franqueada' });
    }
  }

  async function rejeitarFranqueada(id: string) {
    const observacao = prompt('Motivo da rejeição (opcional):');
    if (observacao === null) return;
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
      setStatusMsg({ type: 'error', text: '❌ Erro ao rejeitar franqueada' });
    }
  }

  async function toggleLojaAtiva(id: string, ativo: boolean) {
    if (!confirm(`Deseja ${ativo ? 'ativar' : 'desativar'} a loja desta franqueada?`)) return;
    try {
      const res = await fetch('/api/admin/franqueadas/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-loja', franqueada_id: id, ativo })
      });
      if (!res.ok) throw new Error('Erro ao atualizar loja');
      await loadFranqueadas();
      setStatusMsg({ type: 'success', text: `✅ Loja ${ativo ? 'ativada' : 'desativada'} com sucesso!` });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error('Erro ao atualizar loja:', err);
      setStatusMsg({ type: 'error', text: '❌ Erro ao atualizar loja' });
    }
  }

  async function revincularProdutos(id: string) {
    if (!confirm('Deseja revincular os produtos ativos a esta franqueada? Isso vai recriar todas as vinculações.')) return;
    try {
      setStatusMsg({ type: 'success', text: '⏳ Revinculando produtos...' });
      const res = await fetch('/api/admin/franqueadas/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'aprovar', franqueada_id: id })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erro ao revincular');
      
      await loadFranqueadas();
      setStatusMsg({ type: 'success', text: '✅ ' + data.message });
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err) {
      console.error('Erro ao revincular:', err);
      setStatusMsg({ type: 'error', text: '❌ Erro ao revincular produtos' });
    }
  }

  // Filtrar franqueadas
  const franqueadasFiltradas = franqueadas.filter(f => {
    const matchSearch = f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (f.loja?.dominio && f.loja.dominio.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchSearch;
  });

  // Estatísticas
  const estatisticas = {
    pendentes: franqueadas.filter(f => f.status === 'pendente').length,
    aprovadas: franqueadas.filter(f => f.status === 'aprovada').length,
    rejeitadas: franqueadas.filter(f => f.status === 'rejeitada').length,
    ativas: franqueadas.filter(f => f.status === 'aprovada' && f.loja?.ativo).length,
    inativas: franqueadas.filter(f => f.status === 'aprovada' && f.loja && !f.loja.ativo).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">

        {/* Mensagem de Status */}
        {statusMsg && (
          <div className={`mb-4 p-4 rounded ${
            statusMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {statusMsg.text}
          </div>
        )}

        {/* Filtros e Busca */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="🔍 Buscar por nome, email ou domínio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="todos">📊 Todos os Status</option>
            <option value="pendente">⏳ Pendentes</option>
            <option value="aprovada">✓ Aprovadas</option>
            <option value="rejeitada">✕ Rejeitadas</option>
            <option value="ativa">🟢 Lojas Ativas</option>
            <option value="inativa">🔴 Lojas Inativas</option>
          </select>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <div className="text-yellow-700 text-sm font-medium">⏳ Pendentes</div>
            <div className="text-2xl font-bold text-yellow-800">{estatisticas.pendentes}</div>
          </div>
          <div className="bg-green-50 border border-green-300 rounded-lg p-4">
            <div className="text-green-700 text-sm font-medium">✓ Aprovadas</div>
            <div className="text-2xl font-bold text-green-800">{estatisticas.aprovadas}</div>
          </div>
          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <div className="text-red-700 text-sm font-medium">✕ Rejeitadas</div>
            <div className="text-2xl font-bold text-red-800">{estatisticas.rejeitadas}</div>
          </div>
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
            <div className="text-blue-700 text-sm font-medium">🟢 Lojas Ativas</div>
            <div className="text-2xl font-bold text-blue-800">{estatisticas.ativas}</div>
          </div>
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <div className="text-gray-700 text-sm font-medium">🔴 Lojas Inativas</div>
            <div className="text-2xl font-bold text-gray-800">{estatisticas.inativas}</div>
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
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  {f.loja?.logo ? (
                    <Image
                      src={f.loja.logo}
                      alt={f.nome}
                      width={64}
                      height={64}
                      className="object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                      👤
                    </div>
                  )}
                  
                  <div className="flex-1">
                    {/* Cabeçalho com Badges */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                      
                      {f.loja?.ativo && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          🟢 Loja Ativa
                        </span>
                      )}
                      {f.loja && !f.loja.ativo && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          🔴 Loja Inativa
                        </span>
                      )}
                    </div>
                    
                    {/* Informações em Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      {/* Dados Pessoais */}
                      <div className="space-y-1">
                        <p className="font-medium text-gray-700">📋 Dados Pessoais</p>
                        <p>📧 {f.email}</p>
                        {f.telefone && <p>📱 {f.telefone}</p>}
                        {f.cpf && <p>🆔 {f.cpf}</p>}
                        {f.cidade && f.estado && <p>📍 {f.cidade}/{f.estado}</p>}
                      </div>
                      
                      {/* Dados da Loja */}
                      <div className="space-y-1">
                        <p className="font-medium text-gray-700">🏪 Dados da Loja</p>
                        {f.loja ? (
                          <>
                            {f.loja.nome && <p>🏷️ {f.loja.nome}</p>}
                            {f.loja.dominio && <p>🌐 {f.loja.dominio}</p>}
                            <p>📦 {f.loja.produtos_ativos || 0} produtos ativos</p>
                          </>
                        ) : (
                          <p className="text-gray-400">Loja não configurada</p>
                        )}
                      </div>
                      
                      {/* Dados Financeiros */}
                      <div className="space-y-1">
                        <p className="font-medium text-gray-700">💰 Dados Financeiros</p>
                        <p>💵 Vendas: R$ {(f.vendas_total || 0).toFixed(2)}</p>
                        <p>💸 Comissão: R$ {(f.comissao_acumulada || 0).toFixed(2)}</p>
                        <p>📅 Cadastro: {f.criado_em ? new Date(f.criado_em).toLocaleDateString('pt-BR') : '—'}</p>
                      </div>
                    </div>
                    
                    {/* Observações */}
                    {f.observacoes && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-700">💬 Obs: {f.observacoes}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Botões de Ação */}
                  <div className="flex flex-col gap-2">
                    {f.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => aprovarFranqueada(f.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition whitespace-nowrap"
                        >
                          ✓ Aprovar
                        </button>
                        <button
                          onClick={() => rejeitarFranqueada(f.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition whitespace-nowrap"
                        >
                          ✕ Rejeitar
                        </button>
                      </>
                    )}
                    
                    {f.status === 'aprovada' && f.loja && (
                      <>
                        <button
                          onClick={() => router.push(`/admin/franqueadas/${f.id}/customizacao`)}
                          className="px-3 py-1 bg-pink-600 text-white rounded text-sm hover:bg-pink-700 transition whitespace-nowrap"
                        >
                          🎨 Customizar Loja
                        </button>
                        <button
                          onClick={() => router.push(`/admin/lojas/${f.loja!.id}/pagamentos`)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition whitespace-nowrap"
                        >
                          💳 Pagamentos
                        </button>
                        <button
                          onClick={() => toggleLojaAtiva(f.id, !f.loja!.ativo)}
                          className={`px-3 py-1 rounded text-sm transition whitespace-nowrap ${
                            f.loja.ativo
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {f.loja.ativo ? '🔴 Desativar' : '🟢 Ativar'}
                        </button>
                        <button
                          onClick={() => revincularProdutos(f.id)}
                          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition whitespace-nowrap"
                        >
                          🔄 Revincular Produtos
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
    </div>
  );
}
