"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import Image from 'next/image';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Users, Clock, CheckCircle, XCircle, Store, 
  Search, Mail, Phone, MapPin, Calendar, 
  DollarSign, Package, RefreshCw, Palette, 
  CreditCard, Power, User
} from 'lucide-react';

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
      toast.success(data.message);
      setStatusMsg({ type: 'success', text: data.message });
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err) {
      console.error('Erro ao aprovar:', err);
      toast.error('Erro ao aprovar franqueada');
      setStatusMsg({ type: 'error', text: 'Erro ao aprovar franqueada' });
    }
  }

  async function rejeitarFranqueada(id: string) {
    const observacao = prompt('Motivo da rejeicao (opcional):');
    if (observacao === null) return;
    try {
      const res = await fetch('/api/admin/franqueadas/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rejeitar', franqueada_id: id, observacoes: observacao })
      });
      if (!res.ok) throw new Error('Erro ao rejeitar');
      await loadFranqueadas();
      toast.success('Franqueada rejeitada');
      setStatusMsg({ type: 'success', text: 'Franqueada rejeitada' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error('Erro ao rejeitar:', err);
      toast.error('Erro ao rejeitar franqueada');
      setStatusMsg({ type: 'error', text: 'Erro ao rejeitar franqueada' });
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
      toast.success(`Loja ${ativo ? 'ativada' : 'desativada'} com sucesso`);
      setStatusMsg({ type: 'success', text: `Loja ${ativo ? 'ativada' : 'desativada'} com sucesso` });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error('Erro ao atualizar loja:', err);
      toast.error('Erro ao atualizar loja');
      setStatusMsg({ type: 'error', text: 'Erro ao atualizar loja' });
    }
  }

  async function revincularProdutos(id: string) {
    if (!confirm('Deseja revincular os produtos ativos a esta franqueada? Isso vai recriar todas as vinculacoes.')) return;
    try {
      toast.info('Revinculando produtos...');
      setStatusMsg({ type: 'success', text: 'Revinculando produtos...' });
      const res = await fetch('/api/admin/franqueadas/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'aprovar', franqueada_id: id })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erro ao revincular');
      
      await loadFranqueadas();
      toast.success(data.message);
      setStatusMsg({ type: 'success', text: data.message });
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err) {
      console.error('Erro ao revincular:', err);
      toast.error('Erro ao revincular produtos');
      setStatusMsg({ type: 'error', text: 'Erro ao revincular produtos' });
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
    <PageWrapper title="Franqueadas">
      <div className="p-6">
        <PageHeader
          title="Gerenciar Franqueadas"
          subtitle="Gerencie as franqueadas da plataforma"
          icon={Users}
        />

        {/* Mensagem de Status */}
        {statusMsg && (
          <div className={`mb-4 p-4 rounded-lg border ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {statusMsg.text}
          </div>
        )}

        {/* Filtros e Busca */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou dominio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendentes</option>
              <option value="aprovada">Aprovadas</option>
              <option value="rejeitada">Rejeitadas</option>
              <option value="ativa">Lojas Ativas</option>
              <option value="inativa">Lojas Inativas</option>
            </select>
          </div>
        </Card>

        {/* Estatisticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard
            title="Pendentes"
            value={estatisticas.pendentes}
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Aprovadas"
            value={estatisticas.aprovadas}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Rejeitadas"
            value={estatisticas.rejeitadas}
            icon={XCircle}
            variant="danger"
          />
          <StatCard
            title="Lojas Ativas"
            value={estatisticas.ativas}
            icon={Store}
            variant="primary"
          />
          <StatCard
            title="Lojas Inativas"
            value={estatisticas.inativas}
            icon={Power}
            variant="default"
          />
        </div>

        {/* Lista de Franqueadas */}
        {loading ? (
          <LoadingState message="Carregando franqueadas..." />
        ) : franqueadasFiltradas.length === 0 ? (
          <EmptyState
            title="Nenhuma franqueada encontrada"
            description="Nao ha franqueadas que correspondam aos filtros selecionados."
            icon={Users}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {franqueadasFiltradas.map((f) => (
              <Card key={f.id} className="p-4 hover:shadow-md transition">
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
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    {/* Cabecalho com Badges */}
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">{f.nome}</h3>
                      
                      <StatusBadge 
                        status={f.status === 'pendente' ? 'pending' : f.status === 'aprovada' ? 'active' : 'error'} 
                        label={f.status === 'pendente' ? 'Pendente' : f.status === 'aprovada' ? 'Aprovada' : 'Rejeitada'} 
                      />
                      
                      {f.status === 'aprovada' && f.loja && (
                        <StatusBadge 
                          status={f.loja.ativo ? 'active' : 'inactive'} 
                          label={f.loja.ativo ? 'Loja Ativa' : 'Loja Inativa'} 
                        />
                      )}
                    </div>
                    
                    {/* Informacoes em Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {/* Dados Pessoais */}
                      <div className="space-y-1.5">
                        <p className="font-medium text-gray-700 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-gray-400" />
                          Dados Pessoais
                        </p>
                        <p className="flex items-center gap-1.5 text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {f.email}
                        </p>
                        {f.telefone && (
                          <p className="flex items-center gap-1.5 text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {f.telefone}
                          </p>
                        )}
                        {f.cidade && f.estado && (
                          <p className="flex items-center gap-1.5 text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {f.cidade}/{f.estado}
                          </p>
                        )}
                      </div>
                      
                      {/* Dados da Loja */}
                      <div className="space-y-1.5">
                        <p className="font-medium text-gray-700 flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-gray-400" />
                          Dados da Loja
                        </p>
                        {f.loja ? (
                          <>
                            {f.loja.nome && (
                              <p className="text-gray-600">{f.loja.nome}</p>
                            )}
                            {f.loja.dominio && (
                              <p className="text-gray-600 text-xs font-mono">{f.loja.dominio}</p>
                            )}
                            <p className="flex items-center gap-1.5 text-gray-600">
                              <Package className="w-3.5 h-3.5 text-gray-400" />
                              {f.loja.produtos_ativos || 0} produtos ativos
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-400 italic">Loja nao configurada</p>
                        )}
                      </div>
                      
                      {/* Dados Financeiros */}
                      <div className="space-y-1.5">
                        <p className="font-medium text-gray-700 flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          Dados Financeiros
                        </p>
                        <p className="text-gray-600">Vendas: R$ {(f.vendas_total || 0).toFixed(2)}</p>
                        <p className="text-gray-600">Comissao: R$ {(f.comissao_acumulada || 0).toFixed(2)}</p>
                        <p className="flex items-center gap-1.5 text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {f.criado_em ? new Date(f.criado_em).toLocaleDateString('pt-BR') : '-'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Observacoes */}
                    {f.observacoes && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        Obs: {f.observacoes}
                      </div>
                    )}
                  </div>
                  
                  {/* Botoes de Acao */}
                  <div className="flex flex-col gap-2">
                    {f.status === 'pendente' && (
                      <>
                        <Button
                          onClick={() => aprovarFranqueada(f.id)}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() => rejeitarFranqueada(f.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                    
                    {f.status === 'aprovada' && f.loja && (
                      <>
                        <Button
                          onClick={() => router.push(`/admin/franqueadas/${f.id}/customizacao`)}
                          size="sm"
                          className="bg-pink-600 hover:bg-pink-700 text-white"
                        >
                          <Palette className="w-4 h-4 mr-1" />
                          Customizar
                        </Button>
                        <Button
                          onClick={() => router.push(`/admin/lojas/${f.loja.id}/pagamentos`)}
                          size="sm"
                          variant="outline"
                        >
                          <CreditCard className="w-4 h-4 mr-1" />
                          Pagamentos
                        </Button>
                        <Button
                          onClick={() => toggleLojaAtiva(f.id, !f.loja.ativo)}
                          size="sm"
                          variant={f.loja.ativo ? "outline" : "default"}
                        >
                          <Power className="w-4 h-4 mr-1" />
                          {f.loja.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          onClick={() => revincularProdutos(f.id)}
                          size="sm"
                          variant="outline"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Revincular
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
