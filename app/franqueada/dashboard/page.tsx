"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

type Stats = {
  totalProdutos: number;
  produtosAtivos: number;
  totalVendas: number;
  comissaoAcumulada: number;
};

export default function FranqueadaDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProdutos: 0,
    produtosAtivos: 0,
    totalVendas: 0,
    comissaoAcumulada: 0
  });
  const [loading, setLoading] = useState(true);

  const carregarDados = useCallback(async () => {
    try {
      const { data: { user } } = await createClient().auth.getUser();
      if (!user) return;

      const { data: franqueada } = await createClient()
        .from('franqueadas')
        .select('id, nome')
        .eq('user_id', user.id)
        .single();

      if (!franqueada) return;

      // Buscar produtos vinculados
      const { data: produtos } = await createClient()
        .from('produtos_franqueadas')
        .select('id, ativo')
        .eq('franqueada_id', franqueada.id)
        .eq('ativo', true);

      const totalProdutos = produtos?.length || 0;

      // Buscar produtos ativos no site
      const { data: precos } = await createClient()
        .from('produtos_franqueadas_precos')
        .select('id, ativo_no_site, produto_franqueada_id')
        .in('produto_franqueada_id', produtos?.map(p => p.id) || [])
        .eq('ativo_no_site', true);

      const produtosAtivos = precos?.length || 0;

      // TODO: Buscar vendas e comissões quando implementado
      const totalVendas = 0;
      const comissaoAcumulada = 0;

      setStats({
        totalProdutos,
        produtosAtivos,
        totalVendas,
        comissaoAcumulada
      });
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600">Visão geral do seu negócio</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {/* Total de Produtos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total de Produtos</p>
          <p className="text-3xl font-bold text-gray-800">{stats.totalProdutos}</p>
        </div>

        {/* Produtos Ativos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Produtos Ativos no Site</p>
          <p className="text-3xl font-bold text-gray-800">{stats.produtosAtivos}</p>
        </div>

        {/* Total de Vendas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total de Vendas</p>
          <p className="text-3xl font-bold text-gray-800">{stats.totalVendas}</p>
          <p className="text-xs text-gray-500 mt-1">Em breve</p>
        </div>

        {/* Comissão Acumulada */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Comissão Acumulada</p>
          <p className="text-3xl font-bold text-gray-800">
            R$ {stats.comissaoAcumulada.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Em breve</p>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/franqueada/produtos"
            className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:border-pink-600 hover:bg-pink-50 transition"
          >
            <Package className="w-8 h-8 text-pink-600" />
            <div>
              <p className="font-medium text-gray-800">Ver Produtos</p>
              <p className="text-sm text-gray-600">Gerencie seu catálogo</p>
            </div>
          </Link>

          <button
            disabled
            className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg opacity-50 cursor-not-allowed"
          >
            <ShoppingCart className="w-8 h-8 text-gray-400" />
            <div>
              <p className="font-medium text-gray-800">Nova Venda</p>
              <p className="text-sm text-gray-600">Em breve</p>
            </div>
          </button>

          <button
            disabled
            className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg opacity-50 cursor-not-allowed"
          >
            <DollarSign className="w-8 h-8 text-gray-400" />
            <div>
              <p className="font-medium text-gray-800">Ver Comissões</p>
              <p className="text-sm text-gray-600">Em breve</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
