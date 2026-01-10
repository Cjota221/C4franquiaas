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
      
      // Calcular revendedoras sem margem (sem produtos com margem configurada)
      let semMargem = 0;
      if (data && data.length > 0) {
        const resellerIds = data.map(r => r.id);
        const { data: productsData } = await supabase
          .from('reseller_products')
          .select('reseller_id, margin_percent, custom_price')
          .in('reseller_id', resellerIds)
          .eq('is_active', true);
        
        // Agrupar por reseller_id e verificar se tem algum produto com margem
        const resellersComMargem = new Set<string>();
        productsData?.forEach(p => {
          if (p.margin_percent || p.custom_price) {
            resellersComMargem.add(p.reseller_id);
          }
        });
        
        semMargem = resellerIds.filter(id => !resellersComMargem.has(id)).length;
      }
      
      setStats({
        total,
        pendentes,
        aprovadas,
        ativas,
        semPersonalizacao,
        semMargem,
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
            // Redes sociais
            instagram: r.instagram || null,
            facebook: r.facebook || null,
            tiktok: r.tiktok || null,
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
            instagram: null,
            facebook: null,
            tiktok: null,
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard 
            label="Total de Revendedoras" 
            sublabel="Todas cadastradas"
            value={stats.total} 
            icon={<Users className="w-5 h-5" />}
            color="slate"
            isActive={filtroStatus === 'todas' && filtroAtivacao === 'todos'}
            onClick={() => {
              setFiltroStatus('todas');
              setFiltroAtivacao('todos');
            }}
          />
          <StatCard 
            label="Pendentes de Aprovação" 
            sublabel="Aguardando análise"
            value={stats.pendentes} 
            icon={<Clock className="w-5 h-5" />}
            color="amber"
            alert={stats.pendentes > 0}
            isActive={filtroStatus === 'pendente'}
            onClick={() => {
              setFiltroStatus('pendente');
              setFiltroAtivacao('todos');
            }}
          />
          <StatCard 
            label="Ativas no Sistema" 
            sublabel="Com acesso liberado"
            value={stats.ativas} 
            icon={<ToggleRight className="w-5 h-5" />}
            color="emerald"
            isActive={filtroAtivacao === 'ativas'}
            onClick={() => {
              setFiltroStatus('aprovada');
              setFiltroAtivacao('ativas');
            }}
          />
          <StatCard 
            label="Sem Personalização" 
            sublabel="Sem logo, cores ou banner"
            value={stats.semPersonalizacao} 
            icon={<Palette className="w-5 h-5" />}
            color="orange"
            alert={stats.semPersonalizacao > 0}
            isActive={filtroAtivacao === 'sem_personalizacao'}
            onClick={() => {
              setFiltroStatus('aprovada');
              setFiltroAtivacao('sem_personalizacao');
            }}
          />
          <StatCard 
            label="Sem Margem Configurada" 
            sublabel="Nenhum produto com margem"
            value={stats.semMargem} 
            icon={<Percent className="w-5 h-5" />}
            color="rose"
            alert={stats.semMargem > 0}
            isActive={filtroAtivacao === 'sem_margem'}
            onClick={() => {
              setFiltroStatus('aprovada');
              setFiltroAtivacao('sem_margem');
            }}
          />
          <StatCard 
            label="Setup Completo" 
            sublabel="Logo, banner, cores e margem"
            value={stats.total - stats.semPersonalizacao - stats.semMargem} 
            icon={<Target className="w-5 h-5" />}
            color="indigo"
            isActive={filtroAtivacao === 'completas'}
            onClick={() => {
              setFiltroStatus('aprovada');
              setFiltroAtivacao('completas');
            }}
          />
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          {/* Filtros de Status */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Status do Cadastro</p>
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    filtroStatus === value
                      ? 'bg-[#DB1472] text-white shadow-md shadow-[#DB1472]/20'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
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
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Filtros Operacionais</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'todos', label: 'Todas', icon: <Users className="w-4 h-4" /> },
                { value: 'ativas', label: 'Ativas', icon: <ToggleRight className="w-4 h-4" /> },
                { value: 'inativas', label: 'Inativas', icon: <XCircle className="w-4 h-4" /> },
                { value: 'sem_personalizacao', label: 'Sem Personalização', icon: <Palette className="w-4 h-4" /> },
                { value: 'sem_margem', label: 'Sem Margem', icon: <Percent className="w-4 h-4" /> },
                { value: 'completas', label: 'Setup Completo', icon: <Target className="w-4 h-4" /> },
                { value: 'personalizadas', label: 'Personalizadas', icon: <CheckCircle className="w-4 h-4" /> },
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setFiltroAtivacao(value as FiltroAtivacao)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    filtroAtivacao === value
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {icon}
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
  sublabel,
  value, 
  icon, 
  color, 
  alert = false,
  isActive = false,
  onClick
}: { 
  label: string;
  sublabel: string;
  value: number; 
  icon: React.ReactNode; 
  color: 'slate' | 'amber' | 'emerald' | 'orange' | 'rose' | 'indigo'; 
  alert?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const colorClasses = {
    slate: {
      border: 'border-slate-200',
      bg: isActive ? 'bg-slate-100' : 'bg-white',
      text: 'text-slate-700',
      icon: 'text-slate-600',
      hover: 'hover:bg-slate-50',
      ring: isActive ? 'ring-2 ring-slate-400' : ''
    },
    amber: {
      border: 'border-amber-200',
      bg: isActive ? 'bg-amber-50' : 'bg-white',
      text: 'text-amber-900',
      icon: 'text-amber-600',
      hover: 'hover:bg-amber-50',
      ring: isActive ? 'ring-2 ring-amber-400' : alert ? 'ring-2 ring-amber-300 animate-pulse' : ''
    },
    emerald: {
      border: 'border-emerald-200',
      bg: isActive ? 'bg-emerald-50' : 'bg-white',
      text: 'text-emerald-900',
      icon: 'text-emerald-600',
      hover: 'hover:bg-emerald-50',
      ring: isActive ? 'ring-2 ring-emerald-400' : ''
    },
    orange: {
      border: 'border-orange-200',
      bg: isActive ? 'bg-orange-50' : 'bg-white',
      text: 'text-orange-900',
      icon: 'text-orange-600',
      hover: 'hover:bg-orange-50',
      ring: isActive ? 'ring-2 ring-orange-400' : alert ? 'ring-2 ring-orange-300' : ''
    },
    rose: {
      border: 'border-rose-200',
      bg: isActive ? 'bg-rose-50' : 'bg-white',
      text: 'text-rose-900',
      icon: 'text-rose-600',
      hover: 'hover:bg-rose-50',
      ring: isActive ? 'ring-2 ring-rose-400' : alert ? 'ring-2 ring-rose-300' : ''
    },
    indigo: {
      border: 'border-indigo-200',
      bg: isActive ? 'bg-indigo-50' : 'bg-white',
      text: 'text-indigo-900',
      icon: 'text-indigo-600',
      hover: 'hover:bg-indigo-50',
      ring: isActive ? 'ring-2 ring-indigo-400' : ''
    },
  };

  const styles = colorClasses[color];

  return (
    <button
      onClick={onClick}
      className={`
        relative rounded-xl border-2 p-4 text-left transition-all duration-200
        ${styles.border} ${styles.bg} ${styles.hover} ${styles.ring}
        hover:shadow-md cursor-pointer
        ${isActive ? 'shadow-lg' : 'shadow-sm'}
      `}
    >
      {isActive && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
        </div>
      )}
      
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold mb-1 ${styles.text} opacity-70 uppercase tracking-wide`}>
            {label}
          </p>
          <p className={`text-3xl font-bold mb-1 ${styles.text}`}>
            {value}
          </p>
          <p className={`text-xs ${styles.text} opacity-60`}>
            {sublabel}
          </p>
        </div>
        <div className={`${styles.icon} opacity-70 flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </button>
  );
}
