"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  AlertCircle,
  Search,
  Download,
  RefreshCw,
  Image as ImageIcon,
  Palette,
  LayoutGrid,
  Percent,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  PersonalizacaoDetalhes,
  PersonalizacaoResumo,
} from '@/lib/types/personalizacao';
import {
  getCorNivel,
  getEmojiNivel,
  CRITERIOS_PONTUACAO,
} from '@/lib/types/personalizacao';

type FiltroNivel = 'TODOS' | 'ZERADA' | 'BAIXA' | 'MÉDIA' | 'ALTA' | 'COMPLETA';

export default function AdminPersonalizacaoPage() {
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState<PersonalizacaoResumo | null>(null);
  const [analises, setAnalises] = useState<PersonalizacaoDetalhes[]>([]);
  const [filteredAnalises, setFilteredAnalises] = useState<PersonalizacaoDetalhes[]>([]);
  
  const [busca, setBusca] = useState('');
  const [filtroNivel, setFiltroNivel] = useState<FiltroNivel>('TODOS');
  const [expandido, setExpandido] = useState<string | null>(null);

  // ============================================================================
  // CARREGAR DADOS
  // ============================================================================
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    
    try {
      // Buscar resumo e análises em paralelo
      const [resumoRes, analisesRes] = await Promise.all([
        fetch('/api/admin/personalizacao?resumo=true'),
        fetch('/api/admin/personalizacao'),
      ]);

      const resumoData = await resumoRes.json();
      const analisesData = await analisesRes.json();

      if (resumoData.success) {
        setResumo(resumoData.data);
      }

      if (analisesData.success) {
        setAnalises(analisesData.data);
        setFilteredAnalises(analisesData.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // FILTROS
  // ============================================================================
  useEffect(() => {
    let filtered = [...analises];

    // Filtro por nível
    if (filtroNivel !== 'TODOS') {
      filtered = filtered.filter((a) => a.nivel === filtroNivel);
    }

    // Filtro por busca
    if (busca.trim()) {
      const searchLower = busca.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.store_name.toLowerCase().includes(searchLower) ||
          a.slug.toLowerCase().includes(searchLower)
      );
    }

    setFilteredAnalises(filtered);
  }, [busca, filtroNivel, analises]);

  // ============================================================================
  // EXPORT CSV
  // ============================================================================
  const exportarCSV = () => {
    const headers = [
      'Loja',
      'Slug',
      'Nível',
      'Score',
      'Logo',
      'Cores',
      'Banner',
      'Estilos',
      'Margens',
    ];

    const rows = filteredAnalises.map((a) => [
      a.store_name,
      a.slug,
      a.nivel,
      a.score,
      a.hasLogo ? 'Sim' : 'Não',
      a.hasCustomColors ? 'Sim' : 'Não',
      a.hasBanner ? 'Sim' : 'Não',
      a.hasCustomStyles ? 'Sim' : 'Não',
      a.hasCustomMargins ? 'Sim' : 'Não',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personalizacao-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Analisando personalização...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ====================================================================== */}
        {/* HEADER */}
        {/* ====================================================================== */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-pink-500" />
                Análise de Personalização
              </h1>
              <p className="text-gray-600 mt-2">
                Veja quem realmente personalizou a loja e quem está usando o padrão
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={carregarDados}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
              <button
                onClick={exportarCSV}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================================== */}
        {/* CARDS DE RESUMO */}
        {/* ====================================================================== */}
        {resumo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total de Revendedoras */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-500" />
                <span className="text-3xl font-bold text-gray-900">
                  {resumo.total_revendedoras}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total de Revendedoras</p>
            </div>

            {/* Score Médio */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <span className="text-3xl font-bold text-gray-900">
                  {resumo.medias.score_medio}
                </span>
              </div>
              <p className="text-sm text-gray-600">Score Médio (0-100)</p>
            </div>

            {/* Completas */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 text-yellow-500" />
                <span className="text-3xl font-bold text-gray-900">
                  {resumo.por_nivel.COMPLETA}
                </span>
              </div>
              <p className="text-sm text-gray-600">Personalizações Completas</p>
            </div>

            {/* Sem Personalização */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <span className="text-3xl font-bold text-gray-900">
                  {resumo.por_nivel.ZERADA + resumo.por_nivel.BAIXA}
                </span>
              </div>
              <p className="text-sm text-gray-600">Pouca ou Nenhuma Personalização</p>
            </div>
          </div>
        )}

        {/* ====================================================================== */}
        {/* GRÁFICO DE NÍVEIS */}
        {/* ====================================================================== */}
        {resumo && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Distribuição por Nível de Personalização
            </h2>
            <div className="space-y-4">
              {Object.entries(resumo.por_nivel).map(([nivel, count]) => {
                const percentage =
                  resumo.total_revendedoras > 0
                    ? (count / resumo.total_revendedoras) * 100
                    : 0;
                const emoji = getEmojiNivel(nivel as PersonalizacaoDetalhes['nivel']);

                return (
                  <div key={nivel}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span>{emoji}</span>
                        {nivel}
                      </span>
                      <span className="text-sm text-gray-600">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          nivel === 'COMPLETA'
                            ? 'bg-green-500'
                            : nivel === 'ALTA'
                            ? 'bg-blue-500'
                            : nivel === 'MÉDIA'
                            ? 'bg-yellow-500'
                            : nivel === 'BAIXA'
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ====================================================================== */}
        {/* ELEMENTOS DE PERSONALIZAÇÃO */}
        {/* ====================================================================== */}
        {resumo && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <ImageIcon className="w-5 h-5 text-pink-500" />
                <span className="font-medium text-gray-700">Logo</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {resumo.percentuais.com_logo}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {resumo.por_elemento.com_logo} lojas
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-pink-500 h-full rounded-full"
                  style={{ width: `${resumo.percentuais.com_logo}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <Palette className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-gray-700">Cores</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {resumo.percentuais.com_cores}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {resumo.por_elemento.com_cores} lojas
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-purple-500 h-full rounded-full"
                  style={{ width: `${resumo.percentuais.com_cores}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <ImageIcon className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-700">Banners</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {resumo.percentuais.com_banner}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {resumo.por_elemento.com_banner} lojas
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${resumo.percentuais.com_banner}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <LayoutGrid className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-700">Estilos</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {resumo.percentuais.com_estilos}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {resumo.por_elemento.com_estilos} lojas
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-500 h-full rounded-full"
                  style={{ width: `${resumo.percentuais.com_estilos}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <Percent className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-gray-700">Margens</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {resumo.percentuais.com_margens}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {resumo.por_elemento.com_margens} lojas
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-orange-500 h-full rounded-full"
                  style={{ width: `${resumo.percentuais.com_margens}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================== */}
        {/* FILTROS E BUSCA */}
        {/* ====================================================================== */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou slug..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* Filtro por Nível */}
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value as FiltroNivel)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="TODOS">Todos os Níveis</option>
              <option value="ZERADA">🚫 Zerada</option>
              <option value="BAIXA">⚠️ Baixa</option>
              <option value="MÉDIA">📊 Média</option>
              <option value="ALTA">⭐ Alta</option>
              <option value="COMPLETA">🏆 Completa</option>
            </select>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Mostrando {filteredAnalises.length} de {analises.length} revendedoras
          </div>
        </div>

        {/* ====================================================================== */}
        {/* TABELA DE REVENDEDORAS */}
        {/* ====================================================================== */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nível
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Logo
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cores
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banner
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estilos
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margens
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAnalises.map((analise) => (
                  <React.Fragment key={analise.reseller_id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {analise.store_name}
                          </div>
                          <div className="text-sm text-gray-500">/{analise.slug}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCorNivel(
                            analise.nivel
                          )}`}
                        >
                          {getEmojiNivel(analise.nivel)} {analise.nivel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            {analise.score}
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-full rounded-full ${
                                analise.score >= 90
                                  ? 'bg-green-500'
                                  : analise.score >= 60
                                  ? 'bg-blue-500'
                                  : analise.score >= 30
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${analise.score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {analise.hasLogo ? (
                          <span className="text-green-600 text-xl">✓</span>
                        ) : (
                          <span className="text-red-600 text-xl">✗</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {analise.hasCustomColors ? (
                          <span className="text-green-600 text-xl">✓</span>
                        ) : (
                          <span className="text-red-600 text-xl">✗</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {analise.hasBanner ? (
                          <span className="text-green-600 text-xl">✓</span>
                        ) : (
                          <span className="text-red-600 text-xl">✗</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {analise.hasCustomStyles ? (
                          <span className="text-green-600 text-xl">✓</span>
                        ) : (
                          <span className="text-red-600 text-xl">✗</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {analise.hasCustomMargins ? (
                          <span className="text-green-600 text-xl">✓</span>
                        ) : (
                          <span className="text-red-600 text-xl">✗</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            setExpandido(
                              expandido === analise.reseller_id
                                ? null
                                : analise.reseller_id
                            )
                          }
                          className="text-pink-600 hover:text-pink-800"
                        >
                          {expandido === analise.reseller_id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Linha Expandida com Detalhes */}
                    {expandido === analise.reseller_id && (
                      <tr>
                        <td colSpan={9} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Logo */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Logo
                              </h4>
                              <p className="text-sm text-gray-600">
                                {analise.logo.presente
                                  ? `✓ Logo configurada`
                                  : `✗ Sem logo`}
                              </p>
                              {analise.logo.url && (
                                <p className="text-xs text-gray-400 mt-1 truncate">
                                  {analise.logo.url}
                                </p>
                              )}
                            </div>

                            {/* Cores */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <Palette className="w-4 h-4" />
                                Cores
                              </h4>
                              {analise.hasCustomColors ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-4 h-4 rounded border"
                                      style={{
                                        backgroundColor: analise.cores.primaria || '',
                                      }}
                                    />
                                    <span className="text-xs text-gray-600">
                                      Primária: {analise.cores.primaria}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-4 h-4 rounded border"
                                      style={{
                                        backgroundColor: analise.cores.secundaria || '',
                                      }}
                                    />
                                    <span className="text-xs text-gray-600">
                                      Secundária: {analise.cores.secundaria}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-600">
                                  ✗ Usando cores padrão
                                </p>
                              )}
                            </div>

                            {/* Banners */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Banners
                              </h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p>
                                  Desktop:{' '}
                                  {analise.banners.temDesktop ? '✓' : '✗'}
                                </p>
                                <p>
                                  Mobile: {analise.banners.temMobile ? '✓' : '✗'}
                                </p>
                              </div>
                            </div>

                            {/* Estilos */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4" />
                                Estilos
                              </h4>
                              {analise.hasCustomStyles ? (
                                <div className="space-y-1 text-xs text-gray-600">
                                  <p>Botão: {analise.estilos.buttonStyle}</p>
                                  <p>Card: {analise.estilos.cardStyle}</p>
                                  <p>Header: {analise.estilos.headerStyle}</p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-600">
                                  ✗ Usando estilos padrão
                                </p>
                              )}
                            </div>

                            {/* Margens */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <Percent className="w-4 h-4" />
                                Margens
                              </h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p>
                                  Total de produtos:{' '}
                                  {analise.margens.totalProdutos}
                                </p>
                                <p>
                                  Com margem customizada:{' '}
                                  {analise.margens.produtosComMargemCustomizada}
                                </p>
                                <p>
                                  Personalização:{' '}
                                  {analise.margens.percentualPersonalizado}%
                                </p>
                                <p>
                                  Margem média: {analise.margens.margemMedia}%
                                </p>
                              </div>
                            </div>

                            {/* Pontuação Detalhada */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-900 mb-2">
                                Pontuação Detalhada
                              </h4>
                              <div className="space-y-1 text-xs text-gray-600">
                                <p>
                                  Logo: {analise.hasLogo ? CRITERIOS_PONTUACAO.logo.peso : 0}/{CRITERIOS_PONTUACAO.logo.peso}
                                </p>
                                <p>
                                  Cores: {analise.hasCustomColors ? CRITERIOS_PONTUACAO.cores.peso : 0}/{CRITERIOS_PONTUACAO.cores.peso}
                                </p>
                                <p>
                                  Banner: {analise.banners.temAmbos ? 30 : analise.banners.temDesktop || analise.banners.temMobile ? 15 : 0}/30
                                </p>
                                <p>
                                  Estilos: {analise.hasCustomStyles ? CRITERIOS_PONTUACAO.estilos.peso : 0}/{CRITERIOS_PONTUACAO.estilos.peso}
                                </p>
                                <p>Margens: {analise.score - (analise.hasLogo ? 20 : 0) - (analise.hasCustomColors ? 15 : 0) - (analise.banners.temAmbos ? 30 : analise.hasBanner ? 15 : 0) - (analise.hasCustomStyles ? 15 : 0)}/20</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAnalises.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhuma revendedora encontrada com os filtros aplicados
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
