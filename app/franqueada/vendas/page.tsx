"use client";

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { DollarSign, Package, Calendar, Check, X, Clock, TrendingUp } from 'lucide-react';

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
      const supabase = createBrowserClient();

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
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: Check, label: 'Aprovado' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pendente' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: X, label: 'Recusado' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Minhas Vendas</h1>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <DollarSign className="w-10 h-10 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total em Vendas</p>
              <p className="text-2xl font-bold">R$ {totalVendas.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Minhas Comissões</p>
              <p className="text-2xl font-bold text-blue-600">R$ {totalComissoes.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <Package className="w-10 h-10 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Vendas Aprovadas</p>
              <p className="text-2xl font-bold">{vendasAprovadas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <label className="block text-sm font-medium mb-2">Filtrar por Status</label>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="todos">Todos</option>
          <option value="approved">Aprovados</option>
          <option value="pending">Pendentes</option>
          <option value="rejected">Recusados</option>
        </select>
      </div>

      {/* Lista de vendas */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">Carregando...</div>
        ) : vendas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhuma venda encontrada</div>
        ) : (
          <div className="divide-y">
            {vendas.map((venda) => (
              <div key={venda.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{venda.cliente_nome}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
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
                    <p className="text-lg font-bold mt-1">R$ {venda.valor_total.toFixed(2)}</p>
                    <p className="text-sm text-green-600">
                      Comissão: R$ {venda.comissao_franqueada.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Itens:</p>
                  <ul className="text-sm text-gray-600">
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
      </div>
    </div>
  );
}
