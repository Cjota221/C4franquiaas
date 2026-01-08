"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, X, Search, Store, MessageCircle, ExternalLink, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface RevendedoraCompleta {
  id: string;
  name: string;
  email: string;
  phone: string;
  store_name: string;
  slug: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  is_active: boolean;
  total_products: number;
  catalog_views: number;
  created_at: string;
  rejection_reason?: string;
  
  // Novos campos para indicadores
  has_logo: boolean;
  has_banner: boolean;
  has_colors: boolean;
  has_margin: boolean;
  primary_color: string | null;
  logo_url: string | null;
  banner_url: string | null;
  banner_mobile_url: string | null;
}

type FiltroStatus = 'todas' | 'pendente' | 'aprovada' | 'rejeitada';
type FiltroAtivacao = 'todos' | 'ativas' | 'inativas' | 'personalizadas' | 'sem_personalizacao' | 'sem_margem' | 'completas';

export default function AdminRevendedorasNova() {
  const router = useRouter();
  const [revendedoras, setRevendedoras] = useState<RevendedoraCompleta[]>([]);
  const [filtradas, setFiltradas] = useState<RevendedoraCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados dos filtros (salvos no localStorage)
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todas');
  const [filtroAtivacao, setFiltroAtivacao] = useState<FiltroAtivacao>('todos');
  const [busca, setBusca] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);

  // Carregar filtros salvos do localStorage
  useEffect(() => {
    const savedFiltroStatus = localStorage.getItem('admin_filtro_status') as FiltroStatus;
    const savedFiltroAtivacao = localStorage.getItem('admin_filtro_ativacao') as FiltroAtivacao;
    
    if (savedFiltroStatus) setFiltroStatus(savedFiltroStatus);
    if (savedFiltroAtivacao) setFiltroAtivacao(savedFiltroAtivacao);
  }, []);

  // Salvar filtros no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem('admin_filtro_status', filtroStatus);
    localStorage.setItem('admin_filtro_ativacao', filtroAtivacao);
  }, [filtroStatus, filtroAtivacao]);

  useEffect(() => {
    carregarRevendedoras();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [revendedoras, filtroStatus, filtroAtivacao, busca]); // eslint-disable-line react-hooks/exhaustive-deps

  function aplicarFiltros() {
    let resultado = [...revendedoras];

    // Filtro por status
    if (filtroStatus !== 'todas') {
      resultado = resultado.filter(r => r.status === filtroStatus);
    }

    // Filtro por ativação e personalização
    switch (filtroAtivacao) {
      case 'ativas':
        resultado = resultado.filter(r => r.is_active);
        break;
      case 'inativas':
        resultado = resultado.filter(r => !r.is_active);
        break;
      case 'personalizadas':
        resultado = resultado.filter(r => r.has_logo || r.has_banner || r.has_colors);
        break;
      case 'sem_personalizacao':
        resultado = resultado.filter(r => !r.has_logo && !r.has_banner && !r.has_colors);
        break;
      case 'sem_margem':
        resultado = resultado.filter(r => !r.has_margin);
        break;
      case 'completas':
        resultado = resultado.filter(r => 
          r.has_logo && r.has_banner && r.has_colors && r.has_margin && r.total_products > 0
        );
        break;
    }

    // Busca por texto
    if (busca) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter(r =>
        r.name.toLowerCase().includes(termo) ||
        r.email.toLowerCase().includes(termo) ||
        r.store_name.toLowerCase().includes(termo)
      );
    }

    setFiltradas(resultado);
  }

  async function carregarRevendedoras() {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Buscar revendedoras
      const { data, error } = await supabase
        .from('resellers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro na query:', error);
        alert(`Erro ao carregar: ${error.message}`);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('⚠️ Nenhuma revendedora encontrada');
        setRevendedoras([]);
        return;
      }

      console.log(`✅ ${data.length} revendedoras carregadas`);

      // Buscar contagem de produtos para cada revendedora
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processadas: RevendedoraCompleta[] = await Promise.all(data.map(async (r: any) => {
        try {
          // Buscar contagem de produtos ativos vinculados
          const { count: totalProdutos, error: prodError } = await supabase
            .from('reseller_products')
            .select('*', { count: 'exact', head: true })
            .eq('reseller_id', r.id)
            .eq('is_active', true);
          
          if (prodError) {
            console.error(`⚠️ Erro ao contar produtos da ${r.name}:`, prodError);
          }
          
          // Extrair cores do campo colors (JSONB) com segurança
          let primaryColor = null;
          let secondaryColor = null;
          
          try {
            const colors = typeof r.colors === 'string' ? JSON.parse(r.colors) : (r.colors || {});
            primaryColor = colors.primary || null;
            secondaryColor = colors.secondary || null;
          } catch (colorErr) {
            console.error(`⚠️ Erro ao parse colors da ${r.name}:`, colorErr);
          }
          
          // Verificar personalização (checar se não é null e não é string vazia)
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
            
            // Indicadores de personalização
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
          console.error(`❌ Erro ao processar revendedora ${r.name}:`, itemErr);
          // Retornar dados mínimos para não quebrar a lista
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

      console.log(`✅ ${processadas.length} revendedoras processadas`);
      
      // DEBUG: Mostrar revendedoras com banners
      const comBanners = processadas.filter(r => r.has_banner || r.banner_url || r.banner_mobile_url);
      console.log(`📸 ${comBanners.length} revendedoras COM banners:`, comBanners.map(r => ({
        nome: r.name,
        has_banner: r.has_banner,
        banner_url: r.banner_url ? '✅' : '❌',
        banner_mobile_url: r.banner_mobile_url ? '✅' : '❌'
      })));
      
      setRevendedoras(processadas);
    } catch (err) {
      console.error('❌ Erro fatal ao carregar revendedoras:', err);
      alert(`Erro ao carregar revendedoras: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      setRevendedoras([]);
    } finally {
      setLoading(false);
    }
  }

  async function aprovar(id: string) {
    if (!confirm('Deseja aprovar esta revendedora?')) return;

    try {
      const res = await fetch('/api/admin/revendedoras/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resellerId: id, action: 'aprovar' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`✅ Revendedora aprovada!${data.emailSent ? '\n📧 Email enviado!' : ''}`);
      carregarRevendedoras();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao aprovar');
    }
  }

  async function rejeitar(id: string) {
    const motivo = prompt('Motivo da rejeição:');
    if (motivo === null) return;

    try {
      const res = await fetch('/api/admin/revendedoras/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resellerId: id, action: 'rejeitar', motivo })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`❌ Revendedora rejeitada${data.emailSent ? '\n📧 Email enviado!' : ''}`);
      carregarRevendedoras();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao rejeitar');
    }
  }

  async function toggleAtivo(id: string, ativoAtual: boolean) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('resellers')
        .update({ is_active: !ativoAtual })
        .eq('id', id);

      if (error) throw error;

      alert(`Revendedora ${!ativoAtual ? 'ativada' : 'desativada'}!`);
      carregarRevendedoras();
    } catch {
      alert('Erro ao alterar status');
    }
  }

  function enviarWhatsAppBoasVindas(revendedora: RevendedoraCompleta) {
    const telefone = revendedora.phone.replace(/\D/g, '');
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://c4franquias.com';
    const loginUrl = `${baseUrl}/login/revendedora`;
    
    const mensagem = `*PARABENS ${revendedora.name.toUpperCase()}!*

Seu cadastro foi *APROVADO*!

Sua loja *"${revendedora.store_name}"* esta pronta!

*ACESSE:*
${loginUrl}

Email: ${revendedora.email}

*GRUPO DAS FRANQUEADAS:*
https://chat.whatsapp.com/HXxGCfGyj6y8R6Cev785os

Bem-vinda a equipe C4!`;

    window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank');
  }

  function verCatalogo(slug: string | null) {
    if (!slug) {
      alert('Catálogo não configurado ainda');
      return;
    }
    window.open(`${window.location.origin}/catalogo/${slug}`, '_blank');
  }

  const stats = {
    total: revendedoras.length,
    pendentes: revendedoras.filter(r => r.status === 'pendente').length,
    aprovadas: revendedoras.filter(r => r.status === 'aprovada').length,
    ativas: revendedoras.filter(r => r.is_active).length,
    semPersonalizacao: revendedoras.filter(r => !r.has_logo && !r.has_banner && !r.has_colors).length,
    semMargem: revendedoras.filter(r => !r.has_margin).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#DB1472] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando revendedoras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            🏪 Gerenciar Revendedoras
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Visão completa e eficiente para gerenciar suas franqueadas
          </p>
        </div>

        {/* Cards de Estatísticas - Mais compactos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-3 border-l-4 border-blue-500">
            <p className="text-xs text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-yellow-50 rounded-lg shadow-sm p-3 border-l-4 border-yellow-500">
            <p className="text-xs text-yellow-700 mb-1">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.pendentes}</p>
          </div>

          <div className="bg-green-50 rounded-lg shadow-sm p-3 border-l-4 border-green-500">
            <p className="text-xs text-green-700 mb-1">Aprovadas</p>
            <p className="text-2xl font-bold text-green-900">{stats.aprovadas}</p>
          </div>

          <div className="bg-purple-50 rounded-lg shadow-sm p-3 border-l-4 border-purple-500">
            <p className="text-xs text-purple-700 mb-1">Ativas</p>
            <p className="text-2xl font-bold text-purple-900">{stats.ativas}</p>
          </div>

          <div className="bg-orange-50 rounded-lg shadow-sm p-3 border-l-4 border-orange-500">
            <p className="text-xs text-orange-700 mb-1">Sem Personaliz.</p>
            <p className="text-2xl font-bold text-orange-900">{stats.semPersonalizacao}</p>
          </div>

          <div className="bg-red-50 rounded-lg shadow-sm p-3 border-l-4 border-red-500">
            <p className="text-xs text-red-700 mb-1">Sem Margem</p>
            <p className="text-2xl font-bold text-red-900">{stats.semMargem}</p>
          </div>
        </div>

        {/* Filtros - Mais compactos */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="space-y-3">
            {/* Linha 1: Status */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Status do Cadastro:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'todas', label: 'Todas', color: 'gray' },
                  { value: 'pendente', label: 'Pendentes', color: 'yellow' },
                  { value: 'aprovada', label: 'Aprovadas', color: 'green' },
                  { value: 'rejeitada', label: 'Rejeitadas', color: 'red' },
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => setFiltroStatus(value as FiltroStatus)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filtroStatus === value
                        ? `bg-${color}-500 text-white shadow-md`
                        : `bg-${color}-50 text-${color}-700 hover:bg-${color}-100`
                    }`}
                    style={filtroStatus === value ? {
                      backgroundColor: color === 'yellow' ? '#eab308' : 
                                      color === 'green' ? '#22c55e' : 
                                      color === 'red' ? '#ef4444' : '#6b7280'
                    } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Linha 2: Ativação e Personalização */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Filtros Rápidos:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'todos', label: 'Todos', icon: '📋' },
                  { value: 'ativas', label: 'Ativas', icon: '✅' },
                  { value: 'inativas', label: 'Inativas', icon: '❌' },
                  { value: 'completas', label: 'Completas', icon: '🎯' },
                  { value: 'personalizadas', label: 'Personalizadas', icon: '🎨' },
                  { value: 'sem_personalizacao', label: 'Sem Personalização', icon: '⚠️' },
                  { value: 'sem_margem', label: 'Sem Margem', icon: '💰' },
                ].map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => setFiltroAtivacao(value as FiltroAtivacao)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filtroAtivacao === value
                        ? 'bg-[#DB1472] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, email ou loja..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DB1472] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Tabela Compacta */}
        {filtradas.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">Nenhuma revendedora encontrada</p>
            <p className="text-gray-400 text-sm">Ajuste os filtros ou a busca.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Nome / Loja</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Personalização</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Produtos</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Views</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtradas.map((rev) => (
                    <React.Fragment key={rev.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        {/* Nome / Loja */}
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-gray-900">{rev.name}</p>
                            <p className="text-xs text-gray-500">{rev.store_name}</p>
                            <p className="text-xs text-gray-400">{new Date(rev.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              rev.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                              rev.status === 'aprovada' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {rev.status}
                            </span>
                            {rev.is_active ? (
                              <span className="text-xs text-green-600 font-medium">✅ Ativa</span>
                            ) : (
                              <span className="text-xs text-gray-500">❌ Inativa</span>
                            )}
                          </div>
                        </td>

                        {/* Indicadores de Personalização */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex flex-col items-center gap-0.5" title="Logo">
                              {rev.has_logo ? (
                                <span className="text-green-500 text-lg">✓</span>
                              ) : (
                                <span className="text-red-500 text-lg">✕</span>
                              )}
                              <span className="text-[10px] text-gray-500">Logo</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-0.5" title="Banner">
                              {rev.has_banner ? (
                                <span className="text-green-500 text-lg">✓</span>
                              ) : (
                                <span className="text-red-500 text-lg">✕</span>
                              )}
                              <span className="text-[10px] text-gray-500">Banner</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-0.5" title="Cores">
                              {rev.has_colors ? (
                                <span className="text-green-500 text-lg">✓</span>
                              ) : (
                                <span className="text-red-500 text-lg">✕</span>
                              )}
                              <span className="text-[10px] text-gray-500">Cores</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-0.5" title="Margem">
                              {rev.has_margin ? (
                                <span className="text-green-500 text-lg">✓</span>
                              ) : (
                                <span className="text-red-500 text-lg">✕</span>
                              )}
                              <span className="text-[10px] text-gray-500">Margem</span>
                            </div>
                          </div>
                        </td>

                        {/* Produtos */}
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${rev.total_products > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                            {rev.total_products}
                          </span>
                        </td>

                        {/* Views */}
                        <td className="px-4 py-3 text-center">
                          <span className="text-gray-600">{rev.catalog_views}</span>
                        </td>

                        {/* Ações */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setExpandido(expandido === rev.id ? null : rev.id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Ver mais"
                            >
                              {expandido === rev.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            
                            <button
                              onClick={() => router.push(`/admin/revendedoras/${rev.id}`)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Detalhes"
                            >
                              <Info className="w-4 h-4" />
                            </button>

                            {rev.slug && (
                              <button
                                onClick={() => verCatalogo(rev.slug)}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                title="Ver catálogo"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            )}

                            {rev.status === 'aprovada' && (
                              <button
                                onClick={() => enviarWhatsAppBoasVindas(rev)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Linha Expandida - Ações */}
                      {expandido === rev.id && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="flex flex-wrap gap-2 items-center justify-center">
                              {rev.status === 'pendente' && (
                                <>
                                  <button
                                    onClick={() => aprovar(rev.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                                  >
                                    <Check className="w-4 h-4" />
                                    Aprovar
                                  </button>
                                  <button
                                    onClick={() => rejeitar(rev.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                    Rejeitar
                                  </button>
                                </>
                              )}

                              {rev.status === 'aprovada' && (
                                <>
                                  {/* Botão WhatsApp - Destaque */}
                                  <button
                                    onClick={() => enviarWhatsAppBoasVindas(rev)}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                  >
                                    <MessageCircle className="w-5 h-5" />
                                    Enviar WhatsApp Boas-Vindas
                                  </button>

                                  {/* Botão Ativar/Desativar */}
                                  <button
                                    onClick={() => toggleAtivo(rev.id, rev.is_active)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                      rev.is_active
                                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                        : 'bg-gray-500 text-white hover:bg-gray-600'
                                    }`}
                                  >
                                    {rev.is_active ? 'Desativar' : 'Ativar'}
                                  </button>
                                </>
                              )}

                              {rev.status === 'rejeitada' && (
                                <button
                                  onClick={() => aprovar(rev.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                  Aprovar Agora
                                </button>
                              )}

                              {/* Email e Telefone quando expandido */}
                              <div className="flex items-center gap-4 text-xs text-gray-600 ml-4">
                                <span>📧 {rev.email}</span>
                                <span>📱 {rev.phone}</span>
                              </div>
                            </div>

                            {/* Seção de Personalização - Banners e Logo */}
                            {(rev.has_logo || rev.has_banner) && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">📸 Personalização Enviada:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  
                                  {/* Logo */}
                                  {rev.has_logo && rev.logo_url && (
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                      <p className="text-xs font-medium text-gray-600 mb-2">Logo da Loja</p>
                                      <div className="relative w-full h-32 bg-gray-50 rounded overflow-hidden">
                                        <Image
                                          src={rev.logo_url}
                                          alt="Logo"
                                          fill
                                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                          className="object-contain p-2"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Banner Desktop */}
                                  {rev.has_banner && rev.banner_url && (
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                      <p className="text-xs font-medium text-gray-600 mb-2">Banner Desktop</p>
                                      <div className="relative w-full h-32 bg-gray-50 rounded overflow-hidden">
                                        <Image
                                          src={rev.banner_url}
                                          alt="Banner Desktop"
                                          fill
                                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                          className="object-cover"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Banner Mobile */}
                                  {rev.has_banner && rev.banner_mobile_url && (
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                      <p className="text-xs font-medium text-gray-600 mb-2">Banner Mobile</p>
                                      <div className="relative w-full h-32 bg-gray-50 rounded overflow-hidden">
                                        <Image
                                          src={rev.banner_mobile_url}
                                          alt="Banner Mobile"
                                          fill
                                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                          className="object-cover"
                                        />
                                      </div>
                                    </div>
                                  )}

                                </div>
                              </div>
                            )}

                            {rev.rejection_reason && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                                <strong>Motivo da rejeição:</strong> {rev.rejection_reason}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rodapé com total */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 text-center">
              Mostrando <strong>{filtradas.length}</strong> de <strong>{revendedoras.length}</strong> revendedoras
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
