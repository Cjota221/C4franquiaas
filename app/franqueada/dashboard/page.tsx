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

      // OTIMIZAÇÃO: Query unificada com JOIN (75% menos queries!)
      const { data: franqueada } = await createClient()
        .from('franqueadas')
        .select(`
          id, nome,
          produtos_franqueadas!inner(
            id, ativo,
            produtos_franqueadas_precos(id, ativo_no_site)
          )
        `)
        .eq('user_id', user.id)
        .eq('produtos_franqueadas.ativo', true)
        .single();

      if (!franqueada) return;

      // Calcular estatísticas do resultado unificado
      const produtos = franqueada.produtos_franqueadas || [];
      const totalProdutos = produtos.length;
      
      const produtosAtivos = produtos.filter(p => 
        p.produtos_franqueadas_precos?.some((preco: any) => preco.ativo_no_site)
      ).length;

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
    }}, []);

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
      {/* CabeÃ§alho */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600">VisÃ£o geral do seu negÃ³cio</p>
      </div>

      {/* Cards de EstatÃ­sticas */}
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

        {/* ComissÃ£o Acumulada */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">ComissÃ£o Acumulada</p>
          <p className="text-3xl font-bold text-gray-800">
            R$ {stats.comissaoAcumulada.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Em breve</p>
        </div>
      </div>

      {/* AÃ§Ãµes RÃ¡pidas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">AÃ§Ãµes RÃ¡pidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/franqueada/produtos"
            className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:border-pink-600 hover:bg-pink-50 transition"
          >
            <Package className="w-8 h-8 text-pink-600" />
            <div>
              <p className="font-medium text-gray-800">Ver Produtos</p>
              <p className="text-sm text-gray-600">Gerencie seu catÃ¡logo</p>
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
              <p className="font-medium text-gray-800">Ver ComissÃµes</p>
              <p className="text-sm text-gray-600">Em breve</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

