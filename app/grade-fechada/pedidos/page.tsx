"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  PackageOpen,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  Calendar,
} from 'lucide-react';

interface Pedido {
  id: number;
  numero?: string;
  status: string;
  created_at: string;
  criado_em: string;
  total: number;
  valor_total?: number;
  total_itens?: number;
  observacoes?: string;
  cliente_nome?: string;
}

export default function PedidosGradeFechadaPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');

  useEffect(() => {
    fetchPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/grade-fechada/pedidos?status=${filtroStatus}`);
      const data = await response.json();

      if (response.ok) {
        setPedidos(data.data || []);
      } else {
        toast.error('Erro ao carregar pedidos');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao conectar com servidor');
    } finally {
      setLoading(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pendente: { label: 'Pendente', color: 'yellow', icon: Clock },
    confirmado: { label: 'Confirmado', color: 'blue', icon: CheckCircle },
    producao: { label: 'Em Produção', color: 'purple', icon: PackageOpen },
    concluido: { label: 'Concluído', color: 'green', icon: CheckCircle },
    cancelado: { label: 'Cancelado', color: 'red', icon: XCircle },
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pedidos de Encomenda
        </h1>
        <p className="text-gray-600">
          Acompanhe todos os pedidos de grade fechada
        </p>
      </div>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por número, cliente..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="producao">Em Produção</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <Button variant="outline">
            <Filter className="h-5 w-5 mr-2" />
            Mais Filtros
          </Button>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-gray-600 text-sm mb-1">Total</div>
          <div className="text-2xl font-bold text-gray-900">{pedidos.length}</div>
        </Card>
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="text-yellow-700 text-sm mb-1">Pendentes</div>
          <div className="text-2xl font-bold text-yellow-700">0</div>
        </Card>
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="text-blue-700 text-sm mb-1">Confirmados</div>
          <div className="text-2xl font-bold text-blue-700">0</div>
        </Card>
        <Card className="p-4 border-purple-200 bg-purple-50">
          <div className="text-purple-700 text-sm mb-1">Em Produção</div>
          <div className="text-2xl font-bold text-purple-700">0</div>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="text-green-700 text-sm mb-1">Concluídos</div>
          <div className="text-2xl font-bold text-green-700">0</div>
        </Card>
      </div>

      {/* Lista de Pedidos */}
      {loading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando pedidos...</p>
        </Card>
      ) : pedidos.length === 0 ? (
        <Card className="p-12 text-center">
          <PackageOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum pedido encontrado
          </h3>
          <p className="text-gray-600">
            Quando houver pedidos de encomenda, eles aparecerão aqui
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => {
            const status = statusConfig[pedido.status] || statusConfig.pendente;
            const StatusIcon = status.icon;

            return (
              <Card key={pedido.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-${status.color}-100`}>
                      <StatusIcon className={`h-6 w-6 text-${status.color}-600`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          Pedido #{pedido.numero}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-700`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{pedido.cliente_nome}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(pedido.criado_em).toLocaleDateString('pt-BR')}
                        </span>
                        <span>{pedido.total_itens} itens</span>
                        <span className="font-semibold text-gray-900">
                          R$ {pedido.valor_total?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
