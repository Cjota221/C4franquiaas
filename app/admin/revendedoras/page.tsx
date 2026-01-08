"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Users, Clock, CheckCircle, XCircle, ToggleRight, Palette, Target, Percent, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  RevendedoraCompleta,
  RejectModal,
  RevendedoraDetailsPanel,
  RevendedorasTable,
} from './components';

type FiltroStatus = 'todas' | 'pendente' | 'aprovada' | 'rejeitada';
type FiltroAtivacao = 'todos' | 'ativas' | 'inativas' | 'personalizadas' | 'sem_personalizacao' | 'sem_margem' | 'completas';

const ITEMS_PER_PAGE = 15;

export default function AdminRevendedorasPage() {
  // Estados principais
  const [revendedoras, setRevendedoras] = useState<RevendedoraCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todas');
  const [filtroAtivacao, setFiltroAtivacao] = useState<FiltroAtivacao>('todos');
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  
  // Drawer e Modal
  const [selectedRevendedora, setSelectedRevendedora] = useState<RevendedoraCompleta | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  
  // Estatísticas (carregadas separadamente para não depender da paginação)
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    aprovadas: 0,
    ativas: 0,
    semPersonalizacao: 0,
    semMargem: 0,
  });

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
      setCurrentPage(1); // Reset para primeira página ao buscar
    }, 300);
    return () => clearTimeout(timer);
  }, [busca]);

  // Carregar filtros do localStorage
  useEffect(() => {
    const savedFiltroStatus = localStorage.getItem('admin_filtro_status') as FiltroStatus;
    const savedFiltroAtivacao = localStorage.getItem('admin_filtro_ativacao') as FiltroAtivacao;
    
    if (savedFiltroStatus) setFiltroStatus(savedFiltroStatus);
    if (savedFiltroAtivacao) setFiltroAtivacao(savedFiltroAtivacao);
  }, []);

  // Salvar filtros no localStorage
  useEffect(() => {
    localStorage.setItem('admin_filtro_status', filtroStatus);
    localStorage.setItem('admin_filtro_ativacao', filtroAtivacao);
    setCurrentPage(1); // Reset para primeira página ao mudar filtro
  }, [filtroStatus, filtroAtivacao]);

  // Carregar estatísticas (separado da paginação)
  const carregarEstatisticas = useCallback(async () => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('resellers')
        .select('id, status, is_active, logo_url, banner_url, banner_mobile_url, colors');
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const pendentes = data?.filter(r => r.status === 'pendente').length || 0;
      const aprovadas = data?.filter(r => r.status === 'aprovada').length || 0;
      const ativas = data?.filter(r => r.is_active).length || 0;
      
      const semPersonalizacao = data?.filter(r => {
        const hasLogo = !!(r.logo_url && r.logo_url.trim());
        const hasBanner = !!(r.banner_url && r.banner_url.trim()) || !!(r.banner_mobile_url && r.banner_mobile_url.trim());
        let hasColors = false;
        try {
          const colors = typeof r.colors === 'string' ? JSON.parse(r.colors) : (r.colors || {});
          hasColors = !!(colors.primary && colors.secondary);
        } catch { /* ignore */ }
        return !hasLogo && !hasBanner && !hasColors;
      }).length || 0;
      
      setStats({
        total,
        pendentes,
        aprovadas,
        ativas,
        semPersonalizacao,
        semMargem: 0, // Será calculado depois se necessário
      });
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  // Carregar revendedoras com paginação
  const carregarRevendedoras = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Construir a query base
      let query = supabase
        .from('resellers')
        .select('*', { count: 'exact' });

      // Aplicar filtro de status
      if (filtroStatus !== 'todas') {
        query = query.eq('status', filtroStatus);
      }

      // Aplicar busca
      if (buscaDebounced) {
        query = query.or(`name.ilike.%${buscaDebounced}%,email.ilike.%${buscaDebounced}%,store_name.ilike.%${buscaDebounced}%`);
      }

      // Ordenação
      query = query.order('created_at', { ascending: false });

      // Paginação
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro na query:', error);
        toast.error(`Erro ao carregar: ${error.message}`);
        throw error;
      }

      if (!data || data.length === 0) {
        setRevendedoras([]);
        setTotalCount(count || 0);
        return;
      }

      // Processar cada revendedora
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processadas: RevendedoraCompleta[] = await Promise.all(data.map(async (r: any) => {
        try {
          // Buscar contagem de produtos
          const { count: totalProdutos } = await supabase
            .from('reseller_products')
            .select('*', { count: 'exact', head: true })
            .eq('reseller_id', r.id)
            .eq('is_active', true);
          
          // Extrair cores
          let primaryColor = null;
          let secondaryColor = null;
          try {
            const colors = typeof r.colors === 'string' ? JSON.parse(r.colors) : (r.colors || {});
            primaryColor = colors.primary || null;
            secondaryColor = colors.secondary || null;
          } catch { /* ignore */ }
          
          // Verificar personalização
          const hasLogo = !!(r.logo_url && typeof r.logo_url === 'string' && r.logo_url.trim() !== '');
          const hasBanner = !!(
            (r.banner_url && typeof r.banner_url === 'string' && r.banner_url.trim() !== '') || 
            (r.banner_mobile_url && typeof r.banner_mobile_url === 'string' && r.banner_mobile_url.trim() !== '')
          );
          const hasColors = !!(primaryColor && secondaryColor);
          
          return {
            id: r.id || '',
            name: r.name || 'Sem nome',
            email: r.email || '',
            phone: r.phone || '',
            store_name: r.store_name || '',
            slug: r.slug || '',
            status: r.status || 'pendente',
            is_active: !!r.is_active,
            total_products: totalProdutos || 0,
            catalog_views: r.catalog_views || 0,
            created_at: r.created_at || '',
            rejection_reason: r.rejection_reason || undefined,
            has_logo: hasLogo,
            has_banner: hasBanner,
            has_colors: hasColors,
            has_margin: totalProdutos ? totalProdutos > 0 : false,
            primary_color: primaryColor,
            logo_url: r.logo_url || null,
            banner_url: r.banner_url || null,
            banner_mobile_url: r.banner_mobile_url || null,
          };
        } catch (itemErr) {
          console.error(`Erro ao processar revendedora ${r.name}:`, itemErr);
          return {
            id: r.id || '',
            name: r.name || 'Sem nome',
            email: r.email || '',
            phone: r.phone || '',
            store_name: r.store_name || '',
            slug: r.slug || '',
            status: r.status || 'pendente',
            is_active: !!r.is_active,
            total_products: 0,
            catalog_views: 0,
            created_at: r.created_at || '',
            has_logo: false,
            has_banner: false,
            has_colors: false,
            has_margin: false,
            primary_color: null,
            logo_url: null,
            banner_url: null,
            banner_mobile_url: null,
          };
        }
      }));

      // Aplicar filtros client-side que não podem ser feitos no Supabase
      let filtered = processadas;
      switch (filtroAtivacao) {
        case 'ativas':
          filtered = processadas.filter(r => r.is_active);
          break;
        case 'inativas':
          filtered = processadas.filter(r => !r.is_active);
          break;
        case 'personalizadas':
          filtered = processadas.filter(r => r.has_logo || r.has_banner || r.has_colors);
          break;
        case 'sem_personalizacao':
          filtered = processadas.filter(r => !r.has_logo && !r.has_banner && !r.has_colors);
          break;
        case 'sem_margem':
          filtered = processadas.filter(r => !r.has_margin);
          break;
        case 'completas':
          filtered = processadas.filter(r => 
            r.has_logo && r.has_banner && r.has_colors && r.has_margin && r.total_products > 0
          );
          break;
      }

      setRevendedoras(filtered);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Erro fatal ao carregar revendedoras:', err);
      toast.error(`Erro ao carregar revendedoras`);
      setRevendedoras([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filtroStatus, filtroAtivacao, buscaDebounced]);

  // Efeitos de carregamento
  useEffect(() => {
    carregarEstatisticas();
  }, [carregarEstatisticas]);

  useEffect(() => {
    carregarRevendedoras();
  }, [carregarRevendedoras]);

  // Ações
  const handleAprovar = async (id: string) => {
    setLoadingActions(prev => ({ ...prev, [`${id}-aprovar`]: true }));
    
    try {
      const res = await fetch('/api/admin/revendedoras/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resellerId: id, action: 'aprovar' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Revendedora aprovada com sucesso!${data.emailSent ? ' Email enviado!' : ''}`);
      
      // Atualizar dados localmente
      setRevendedoras(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'aprovada' as const, is_active: true } : r
      ));
      
      // Atualizar a selecionada se for ela
      if (selectedRevendedora?.id === id) {
        setSelectedRevendedora(prev => prev ? { ...prev, status: 'aprovada', is_active: true } : null);
      }
      
      carregarEstatisticas();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao aprovar revendedora');
    } finally {
      setLoadingActions(prev => ({ ...prev, [`${id}-aprovar`]: false }));
    }
  };

  const handleOpenRejectModal = (id: string) => {
    setRejectingId(id);
    setIsRejectModalOpen(true);
  };

  const handleRejeitar = async (motivo: string) => {
    if (!rejectingId) return;
    
    setLoadingActions(prev => ({ ...prev, [`${rejectingId}-rejeitar`]: true }));
    
    try {
      const res = await fetch('/api/admin/revendedoras/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resellerId: rejectingId, action: 'rejeitar', motivo })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Revendedora rejeitada${data.emailSent ? '. Email enviado!' : ''}`);
      
      // Atualizar dados localmente
      setRevendedoras(prev => prev.map(r => 
        r.id === rejectingId ? { ...r, status: 'rejeitada' as const, rejection_reason: motivo } : r
      ));
      
      // Fechar drawer se for a selecionada
      if (selectedRevendedora?.id === rejectingId) {
        setIsDrawerOpen(false);
        setSelectedRevendedora(null);
      }
      
      carregarEstatisticas();
      setIsRejectModalOpen(false);
      setRejectingId(null);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao rejeitar revendedora');
    } finally {
      setLoadingActions(prev => ({ ...prev, [`${rejectingId}-rejeitar`]: false }));
    }
  };

  const handleToggleAtivo = async (id: string, ativoAtual: boolean) => {
    setLoadingActions(prev => ({ ...prev, [`${id}-toggle`]: true }));
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('resellers')
        .update({ is_active: !ativoAtual })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Revendedora ${!ativoAtual ? 'ativada' : 'desativada'} com sucesso!`);
      
      // Atualizar dados localmente
      setRevendedoras(prev => prev.map(r => 
        r.id === id ? { ...r, is_active: !ativoAtual } : r
      ));
      
      // Atualizar a selecionada se for ela
      if (selectedRevendedora?.id === id) {
        setSelectedRevendedora(prev => prev ? { ...prev, is_active: !ativoAtual } : null);
      }
      
      carregarEstatisticas();
    } catch {
      toast.error('Erro ao alterar status');
    } finally {
      setLoadingActions(prev => ({ ...prev, [`${id}-toggle`]: false }));
    }
  };

  const handleSelectRevendedora = (revendedora: RevendedoraCompleta) => {
    setSelectedRevendedora(revendedora);
    setIsDrawerOpen(true);
  };

  const handleRefresh = () => {
    carregarRevendedoras();
    carregarEstatisticas();
    toast.info('Atualizando dados...');
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen w-full bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-7 h-7 text-[#DB1472]" />
                Gerenciar Revendedoras
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gerencie suas franqueadas de forma eficiente
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard 
            label="Total" 
            value={stats.total} 
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <StatCard 
            label="Pendentes" 
            value={stats.pendentes} 
            icon={<Clock className="w-5 h-5" />}
            color="yellow"
            highlight={stats.pendentes > 0}
          />
          <StatCard 
            label="Aprovadas" 
            value={stats.aprovadas} 
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
          <StatCard 
            label="Ativas" 
            value={stats.ativas} 
            icon={<ToggleRight className="w-5 h-5" />}
            color="purple"
          />
          <StatCard 
            label="Sem Personaliz." 
            value={stats.semPersonalizacao} 
            icon={<Palette className="w-5 h-5" />}
            color="orange"
            highlight={stats.semPersonalizacao > 0}
          />
          <StatCard 
            label="Completas" 
            value={stats.total - stats.semPersonalizacao} 
            icon={<Target className="w-5 h-5" />}
            color="emerald"
          />
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
          {/* Filtros de Status */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Status do Cadastro</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'todas', label: 'Todas', icon: <Users className="w-4 h-4" /> },
                { value: 'pendente', label: 'Pendentes', icon: <Clock className="w-4 h-4" /> },
                { value: 'aprovada', label: 'Aprovadas', icon: <CheckCircle className="w-4 h-4" /> },
                { value: 'rejeitada', label: 'Rejeitadas', icon: <XCircle className="w-4 h-4" /> },
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setFiltroStatus(value as FiltroStatus)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    filtroStatus === value
                      ? 'bg-[#DB1472] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros de Ativação */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Filtros Rápidos</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'todos', label: 'Todos', icon: '📋' },
                { value: 'ativas', label: 'Ativas', icon: '✅' },
                { value: 'inativas', label: 'Inativas', icon: '⏸️' },
                { value: 'completas', label: 'Completas', icon: '🎯' },
                { value: 'personalizadas', label: 'Personalizadas', icon: '🎨' },
                { value: 'sem_personalizacao', label: 'Sem Personalização', icon: '⚠️' },
                { value: 'sem_margem', label: 'Sem Margem', icon: <Percent className="w-4 h-4" /> },
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setFiltroAtivacao(value as FiltroAtivacao)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    filtroAtivacao === value
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {typeof icon === 'string' ? <span>{icon}</span> : icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, email ou loja..."
              className="w-full pl-11 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DB1472] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <RevendedorasTable
            revendedoras={revendedoras}
            isLoading={loading}
            onSelectRevendedora={handleSelectRevendedora}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Drawer de Detalhes */}
      <RevendedoraDetailsPanel
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedRevendedora(null);
        }}
        revendedora={selectedRevendedora}
        onAprovar={handleAprovar}
        onRejeitar={handleOpenRejectModal}
        onToggleAtivo={handleToggleAtivo}
        loadingActions={loadingActions}
      />

      {/* Modal de Rejeição */}
      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectingId(null);
        }}
        onConfirm={handleRejeitar}
        isLoading={rejectingId ? loadingActions[`${rejectingId}-rejeitar`] : false}
      />
    </div>
  );
}

// Componente de Card de Estatística
function StatCard({ 
  label, 
  value, 
  icon, 
  color, 
  highlight = false 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  color: 'blue' | 'yellow' | 'green' | 'purple' | 'orange' | 'emerald'; 
  highlight?: boolean;
}) {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50 text-blue-700',
    yellow: 'border-yellow-500 bg-yellow-50 text-yellow-700',
    green: 'border-green-500 bg-green-50 text-green-700',
    purple: 'border-purple-500 bg-purple-50 text-purple-700',
    orange: 'border-orange-500 bg-orange-50 text-orange-700',
    emerald: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  };

  return (
    <div className={`rounded-lg border-l-4 p-4 ${colorClasses[color]} ${highlight ? 'ring-2 ring-offset-1 ring-yellow-400' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium opacity-80">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="opacity-60">
          {icon}
        </div>
      </div>
    </div>
  );
}
