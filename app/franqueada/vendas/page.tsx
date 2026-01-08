"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShoppingBag, DollarSign, Package, Calendar, Check, X, Clock, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/card';

interface Venda {
  id: string;
  created_at: string;
  valor_total: number;
  comissao_franqueada: number;
  status_pagamento: string;
  cliente_nome: string;
  items: Array<{
    nome: string;
    quantidade: number;
    preco: number;
  }>;
}

export default function VendasFranqueadaPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  
  const carregarVendas = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      let query = supabase
        .from('vendas')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtroStatus !== 'todos') {
        query = query.eq('status_pagamento', filtroStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVendas(data || []);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroStatus]);

  useEffect(() => {
    carregarVendas();
  }, [carregarVendas]);

  const totalVendas = vendas.reduce((acc, v) => acc + v.valor_total, 0);
  const totalComissoes = vendas.reduce((acc, v) => acc + v.comissao_franqueada, 0);
  const vendasAprovadas = vendas.filter(v => v.status_pagamento === 'approved').length;

  const getStatusBadge = (status: string) => {
    const badges = {
      approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Check, label: 'Aprovado' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, label: 'Pendente' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: X, label: 'Recusado' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <LoadingState message="Carregando vendas..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Vendas" 
        subtitle="Historico de vendas realizadas na sua loja"
        icon={ShoppingBag}
      />

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total em Vendas"
          value={`R$ ${totalVendas.toFixed(2)}`}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Minhas Comissoes"
          value={`R$ ${totalComissoes.toFixed(2)}`}
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="Vendas Aprovadas"
          value={vendasAprovadas.toString()}
          icon={Package}
          variant="default"
        />
      </div>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Status</label>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
        >
          <option value="todos">Todos</option>
          <option value="approved">Aprovados</option>
          <option value="pending">Pendentes</option>
          <option value="rejected">Recusados</option>
        </select>
      </Card>

      {/* Lista de vendas */}
      <Card>
        {vendas.length === 0 ? (
          <EmptyState
            title="Nenhuma venda encontrada"
            description="As vendas realizadas na sua loja aparecerao aqui."
            icon={ShoppingBag}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {vendas.map((venda) => (
              <div key={venda.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{venda.cliente_nome}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(venda.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(venda.status_pagamento)}
                    <p className="text-lg font-semibold text-gray-900 mt-2">R$ {venda.valor_total.toFixed(2)}</p>
                    <p className="text-sm text-emerald-600 font-medium">
                      Comissao: R$ {venda.comissao_franqueada.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-1">Itens:</p>
                  <ul className="text-sm text-gray-600 space-y-0.5">
                    {venda.items.map((item, idx) => (
                      <li key={idx}>
                        {item.quantidade}x {item.nome} - R$ {item.preco.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
