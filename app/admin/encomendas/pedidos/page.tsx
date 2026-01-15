"use client";

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import {
  PackageOpen,
  Search,
  Eye,
  MessageCircle,
  Calendar,
  User,
  Phone,
} from 'lucide-react';
import type { GradeFechadaPedido } from '@/types/grade-fechada';

export default function PedidosGradeFechadaPage() {
  const [pedidos, setPedidos] = useState<GradeFechadaPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [pedidoSelecionado, setPedidoSelecionado] = useState<GradeFechadaPedido | null>(null);

  useEffect(() => {
    fetchPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtroStatus) params.append('status', filtroStatus);

      const response = await fetch(`/api/admin/grade-fechada/pedidos?${params}`);
      const data = await response.json();

      if (response.ok) {
        setPedidos(data.data || []);
      } else {
        toast.error('Erro ao carregar pedidos');
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleAlterarStatus = async (pedidoId: string, novoStatus: string) => {
    try {
      const response = await fetch(`/api/admin/grade-fechada/pedidos/${pedidoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (response.ok) {
        toast.success('Status atualizado com sucesso');
        fetchPedidos();
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleWhatsApp = (pedido: GradeFechadaPedido) => {
    if (!pedido.cliente_telefone) {
      toast.error('Pedido não possui telefone cadastrado');
      return;
    }

    const telefone = pedido.cliente_telefone.replace(/\D/g, '');
    const mensagem = `Olá ${pedido.cliente_nome || 'cliente'}! Sobre seu pedido ${pedido.numero_pedido}...`;
    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const pedidosFiltrados = pedidos.filter(
    (pedido) =>
      pedido.numero_pedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.cliente_telefone?.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      orcamento: { label: 'Orçamento', color: 'bg-gray-100 text-gray-700' },
      aguardando_confirmacao: { label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700' },
      confirmado: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
      em_producao: { label: 'Produção', color: 'bg-purple-100 text-purple-700' },
      finalizado: { label: 'Finalizado', color: 'bg-green-100 text-green-700' },
      cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
    };

    const config = statusConfig[status] || statusConfig.orcamento;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <PageWrapper title="Pedidos - Grade Fechada">
      <div className="p-6 max-w-7xl mx-auto">
        <PageHeader
          title="Pedidos de Encomenda"
          subtitle="Gerencie os pedidos de grade fechada"
        />

        {/* Barra de filtros */}
        <div className="flex flex-col md:flex-row gap-4 mt-6 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número, nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Todos os status</option>
            <option value="orcamento">Orçamento</option>
            <option value="aguardando_confirmacao">Aguardando</option>
            <option value="confirmado">Confirmado</option>
            <option value="em_producao">Em Produção</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        {/* Lista de pedidos */}
        {loading ? (
          <LoadingState message="Carregando pedidos..." />
        ) : pedidosFiltrados.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="Nenhum pedido encontrado"
            description="Os pedidos aparecerão aqui quando forem realizados"
          />
        ) : (
          <div className="space-y-4">
            {pedidosFiltrados.map((pedido) => (
              <Card key={pedido.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Informações principais */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {pedido.numero_pedido}
                        </h3>
                        {getStatusBadge(pedido.status)}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-pink-600">
                          R$ {pedido.valor_total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {pedido.cliente_nome && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4" />
                          <span>{pedido.cliente_nome}</span>
                        </div>
                      )}
                      {pedido.cliente_telefone && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="w-4 h-4" />
                          <span>{pedido.cliente_telefone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(pedido.criado_em).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Itens do pedido */}
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Itens do Pedido:
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {pedido.itens.map((item, index) => (
                          <li key={index} className="flex justify-between">
                            <span>
                              {item.produto_nome} -{' '}
                              {item.tipo_grade === 'meia' ? 'Meia Grade' : 'Grade Completa'} ({item.quantidade_grades}x) - {item.cor}
                            </span>
                            <span className="font-semibold">
                              R$ {item.valor_total.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex md:flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPedidoSelecionado(pedido)}
                      className="flex-1 md:flex-none"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Detalhes
                    </Button>

                    {pedido.cliente_telefone && (
                      <Button
                        size="sm"
                        onClick={() => handleWhatsApp(pedido)}
                        className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        WhatsApp
                      </Button>
                    )}

                    <select
                      value={pedido.status}
                      onChange={(e) => handleAlterarStatus(pedido.id, e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="orcamento">Orçamento</option>
                      <option value="aguardando_confirmacao">Aguardando</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="em_producao">Em Produção</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Detalhes (simplificado) */}
        {pedidoSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Detalhes do Pedido</h2>
                <button
                  onClick={() => setPedidoSelecionado(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-2">Informações do Pedido</h3>
                  <p><strong>Número:</strong> {pedidoSelecionado.numero_pedido}</p>
                  <p><strong>Status:</strong> {getStatusBadge(pedidoSelecionado.status)}</p>
                  <p><strong>Valor Total:</strong> R$ {pedidoSelecionado.valor_total.toFixed(2)}</p>
                </div>

                {pedidoSelecionado.cliente_nome && (
                  <div>
                    <h3 className="font-bold text-lg mb-2">Dados do Cliente</h3>
                    <p><strong>Nome:</strong> {pedidoSelecionado.cliente_nome}</p>
                    {pedidoSelecionado.cliente_telefone && (
                      <p><strong>Telefone:</strong> {pedidoSelecionado.cliente_telefone}</p>
                    )}
                    {pedidoSelecionado.cliente_email && (
                      <p><strong>Email:</strong> {pedidoSelecionado.cliente_email}</p>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-lg mb-2">Itens</h3>
                  {pedidoSelecionado.itens.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="font-semibold mb-2">{item.produto_nome}</p>
                      <p className="text-sm text-gray-700">
                        Tipo: {item.tipo_grade === 'meia' ? 'Meia Grade' : 'Grade Completa'}
                      </p>
                      <p className="text-sm text-gray-700">
                        Quantidade: {item.quantidade_grades} grades
                      </p>
                      <p className="text-sm text-gray-700">Cor: {item.cor}</p>
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-gray-900 mb-1">Numerações:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(item.numeracoes)
                            .filter(([, qtd]) => qtd > 0)
                            .map(([num, qtd]) => (
                              <span
                                key={num}
                                className="bg-white border border-gray-300 px-2 py-1 rounded text-sm"
                              >
                                Nº {num}: {qtd}
                              </span>
                            ))}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-pink-600 mt-2">
                        Subtotal: R$ {item.valor_total.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
