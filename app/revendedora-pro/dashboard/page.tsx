"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Store,
  ArrowRight,
  BarChart3,
  Wallet
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingState } from '@/components/ui/LoadingState';

type Stats = {
  totalProdutos: number;
  produtosAtivos: number;
  totalVendas: number;
  comissaoAcumulada: number;
  lojaAtiva: boolean;
};

export default function FranqueadaDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProdutos: 0,
    produtosAtivos: 0,
    totalVendas: 0,
    comissaoAcumulada: 0,
    lojaAtiva: false
  });
  const [loading, setLoading] = useState(true);

  const carregarDados = useCallback(async () => {
    try {
      const { data: { user } } = await createClient().auth.getUser();
      if (!user) return;

      // Query unificada com JOIN
      const { data: franqueada } = await createClient()
        .from('franqueadas')
        .select(`
          id, nome,
          produtos_franqueadas!inner(
            id, ativo,
            produtos_franqueadas_precos(id, ativo_no_site)
          ),
          lojas(ativo)
        `)
        .eq('user_id', user.id)
        .eq('produtos_franqueadas.ativo', true)
        .single();

      if (!franqueada) return;

      const produtos = franqueada.produtos_franqueadas || [];
      const totalProdutos = produtos.length;
      
      const produtosAtivos = produtos.filter(p => 
        p.produtos_franqueadas_precos?.some((preco) => preco.ativo_no_site)
      ).length;

      // Verificar status da loja
      const lojas = franqueada.lojas as { ativo: boolean }[] | { ativo: boolean } | null;
      const lojaAtiva = Array.isArray(lojas) 
        ? lojas[0]?.ativo ?? false 
        : lojas?.ativo ?? false;

      // TODO: Buscar vendas e comissoes quando implementado
      const totalVendas = 0;
      const comissaoAcumulada = 0;

      setStats({
        totalProdutos,
        produtosAtivos,
        totalVendas,
        comissaoAcumulada,
        lojaAtiva
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
      <div className="p-4 lg:p-6">
        <LoadingState message="Carregando dados do painel..." />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 w-full">
      <PageHeader
        title="Dashboard"
        subtitle="Acompanhe as metricas da sua loja e produtos"
        icon={BarChart3}
      />

      {/* Cards de Metricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Produtos Vinculados"
          value={stats.totalProdutos}
          subtitle="Total no catalogo"
          icon={Package}
          iconColor="blue"
        />
        <StatCard
          title="Produtos Ativos"
          value={stats.produtosAtivos}
          subtitle="Visiveis na loja"
          icon={TrendingUp}
          iconColor="green"
        />
        <StatCard
          title="Vendas"
          value={stats.totalVendas}
          subtitle="Em breve"
          icon={ShoppingBag}
          iconColor="purple"
        />
        <StatCard
          title="Comissoes a Receber"
          value={`R$ ${stats.comissaoAcumulada.toFixed(2)}`}
          subtitle="Em breve"
          icon={Wallet}
          iconColor="yellow"
        />
      </div>

      {/* Status da Loja */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              stats.lojaAtiva ? 'bg-green-50' : 'bg-gray-100'
            }`}>
              <Store className={`w-6 h-6 ${stats.lojaAtiva ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="font-medium text-gray-900">Status da Loja</p>
              <p className={`text-sm ${stats.lojaAtiva ? 'text-green-600' : 'text-gray-500'}`}>
                {stats.lojaAtiva ? 'Loja ativa e visivel para clientes' : 'Loja inativa'}
              </p>
            </div>
          </div>
          <Link
            href="/revendedora-pro/loja"
            className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
          >
            Configurar
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Acoes Rapidas */}
      <SectionHeader 
        title="Acesso Rapido" 
        subtitle="Navegue para as principais funcionalidades"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/revendedora-pro/produtos"
          className="group flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-100 hover:border-pink-200 hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 rounded-lg bg-pink-50 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
            <Package className="w-6 h-6 text-pink-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Gerenciar Produtos</p>
            <p className="text-sm text-gray-500">Ativar, desativar e definir precos</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-pink-500 transition-colors" />
        </Link>

        <Link
          href="/revendedora-pro/customizacoes"
          className="group flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-100 hover:border-pink-200 hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <Store className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Personalizar Loja</p>
            <p className="text-sm text-gray-500">Cores, logo e aparencia</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-pink-500 transition-colors" />
        </Link>

        <Link
          href="/revendedora-pro/comissoes"
          className="group flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-100 hover:border-pink-200 hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Ver Comissoes</p>
            <p className="text-sm text-gray-500">Acompanhe seus ganhos</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-pink-500 transition-colors" />
        </Link>
      </div>
    </div>
  );
}