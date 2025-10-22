"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Package, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';

type Estatisticas = {
  totalProdutos: number;
  produtosAtivos: number;
  totalVendas: number;
  comissaoAcumulada: number;
};

export default function FranqueadoDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Estatisticas>({
    totalProdutos: 0,
    produtosAtivos: 0,
    totalVendas: 0,
    comissaoAcumulada: 0
  });
  const [franqueadaNome, setFranqueadaNome] = useState('');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const carregarDados = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar dados da franqueada
      const { data: franqueada } = await supabase
        .from('franqueadas')
        .select('id, nome')
        .eq('user_id', user.id)
        .single();

      if (!franqueada) return;

      setFranqueadaNome(franqueada.nome);

      // Buscar produtos vinculados
      const { data: produtos } = await supabase
        .from('produtos_franqueadas')
        .select('id, ativo')
        .eq('franqueada_id', franqueada.id)
        .eq('ativo', true);

      const totalProdutos = produtos?.length || 0;
      const produtosAtivos = produtos?.filter(p => p.ativo).length || 0;

      setStats({
        totalProdutos,
        produtosAtivos,
        totalVendas: 0, // TODO: Implementar quando tiver tabela de vendas
        comissaoAcumulada: 0 // TODO: Implementar quando tiver tabela de comissões
      });
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

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
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo, {franqueadaNome}!</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card: Total de Produtos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total de Produtos</div>
            <Package className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800">{stats.totalProdutos}</div>
          <p className="text-xs text-gray-500 mt-1">Produtos no catálogo</p>
        </div>

        {/* Card: Produtos Ativos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Produtos Ativos</div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800">{stats.produtosAtivos}</div>
          <p className="text-xs text-gray-500 mt-1">Disponíveis para venda</p>
        </div>

        {/* Card: Total de Vendas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total de Vendas</div>
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800">{stats.totalVendas}</div>
          <p className="text-xs text-gray-500 mt-1">Vendas realizadas</p>
        </div>

        {/* Card: Comissão Acumulada */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Comissão Acumulada</div>
            <DollarSign className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800">
            R$ {stats.comissaoAcumulada.toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Total acumulado</p>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/franqueado/produtos"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <Package className="w-6 h-6 text-indigo-600" />
            <div>
              <div className="font-medium text-gray-800">Ver Produtos</div>
              <div className="text-sm text-gray-500">Catálogo completo</div>
            </div>
          </a>

          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition opacity-50 cursor-not-allowed">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <div>
              <div className="font-medium text-gray-800">Nova Venda</div>
              <div className="text-sm text-gray-500">Em breve</div>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition opacity-50 cursor-not-allowed">
            <DollarSign className="w-6 h-6 text-yellow-600" />
            <div>
              <div className="font-medium text-gray-800">Ver Comissões</div>
              <div className="text-sm text-gray-500">Em breve</div>
            </div>
          </button>
        </div>
      </div>

      {/* Informação */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Dica:</strong> Verifique regularmente seus produtos vinculados e mantenha-se atualizado sobre novos itens disponíveis.
        </p>
      </div>
    </div>
  );
}
