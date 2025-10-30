"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, User, Eye, Truck } from "lucide-react";

interface ItemPedido {
  id: string;
  title?: string;
  nome?: string;
  sku?: string;
  tamanho?: string;
  quantidade: number;
  preco?: number;
}

interface Pedido {
  id: string;
  created_at: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone?: string;
  cliente_cpf?: string;
  valor_total: number;
  status_pagamento: string;
  status_envio: string;
  items: ItemPedido[] | string;
  endereco_completo?: Record<string, unknown>;
  metodo_pagamento?: string;
}

export default function PedidosAdminPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);

  const carregarPedidos = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createBrowserClient();
      
      const { data, error } = await supabase
        .from("vendas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar pedidos:", error);
        return;
      }

      setPedidos(data || []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  // Helpers para badges
  const getStatusPagamentoBadge = (status: string) => {
    const styles: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string, className: string }> = {
      approved: { variant: "default", label: "Pago", className: "bg-green-500 text-white" },
      pending: { variant: "secondary", label: "Pendente", className: "bg-yellow-500 text-white" },
      in_process: { variant: "secondary", label: "Processando", className: "bg-blue-500 text-white" },
      rejected: { variant: "destructive", label: "Recusado", className: "bg-red-500 text-white" },
      cancelled: { variant: "outline", label: "Cancelado", className: "bg-gray-400 text-white" },
    };
    const config = styles[status] || { variant: "outline" as const, label: status, className: "bg-gray-300 text-gray-800" };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getStatusEnvioBadge = (status: string) => {
    const styles: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string, className: string }> = {
      A_PREPARAR: { variant: "secondary", label: "A Preparar", className: "bg-yellow-500 text-white" },
      ENVIADO: { variant: "default", label: "Enviado", className: "bg-blue-500 text-white" },
      ENTREGUE: { variant: "default", label: "Entregue", className: "bg-green-500 text-white" },
      CANCELADO: { variant: "destructive", label: "Cancelado", className: "bg-red-500 text-white" },
    };
    const config = styles[status] || { variant: "outline" as const, label: "Desconhecido", className: "bg-gray-300 text-gray-800" };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Package className="w-8 h-8 text-pink-600" />
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Pedidos</h1>
        </div>
        <p className="text-gray-600">
          Conferência e envio de pedidos. Central de operações.
        </p>
      </div>

      {/* Tabela de Pedidos - Desktop */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status Pagamento
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status Envio
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {pedidos.map((pedido) => {
                const items = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : pedido.items;
                
                return (
                  <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                    {/* Data */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">
                          {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(pedido.created_at).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {pedido.cliente_nome}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pedido.cliente_email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Valor Total */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        R$ {Number(pedido.valor_total).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {items.length} {items.length === 1 ? 'item' : 'itens'}
                      </div>
                    </td>

                    {/* Status Pagamento */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusPagamentoBadge(pedido.status_pagamento)}
                    </td>

                    {/* Status Envio */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusEnvioBadge(pedido.status_envio || 'A_PREPARAR')}
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setPedidoSelecionado(pedido)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {pedidos.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhum pedido encontrado</p>
            <p className="text-sm text-gray-400 mt-1">Os pedidos aparecerão aqui após as vendas.</p>
          </div>
        )}
      </Card>

      {/* Modal Detalhes do Pedido (placeholder) */}
      {pedidoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detalhes do Pedido</h2>
                <button
                  onClick={() => setPedidoSelecionado(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Informações do Cliente</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Nome:</span>
                      <p className="font-medium">{pedidoSelecionado.cliente_nome}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{pedidoSelecionado.cliente_email}</p>
                    </div>
                    {pedidoSelecionado.cliente_telefone && (
                      <div>
                        <span className="text-gray-600">Telefone:</span>
                        <p className="font-medium">{pedidoSelecionado.cliente_telefone}</p>
                      </div>
                    )}
                    {pedidoSelecionado.cliente_cpf && (
                      <div>
                        <span className="text-gray-600">CPF:</span>
                        <p className="font-medium">{pedidoSelecionado.cliente_cpf}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Produtos</h3>
                  {(() => {
                    const items = typeof pedidoSelecionado.items === 'string' 
                      ? JSON.parse(pedidoSelecionado.items) 
                      : pedidoSelecionado.items;
                    
                    return (items as ItemPedido[]).map((item: ItemPedido, index: number) => (
                      <div key={index} className="mb-3 pb-3 border-b last:border-0">
                        <p className="font-medium">{item.title || item.nome}</p>
                        <div className="text-sm text-gray-600 mt-1">
                          <span>SKU: {item.id || item.sku}</span>
                          {item.tamanho && <span className="ml-4">Tamanho: {item.tamanho}</span>}
                          {item.quantidade && <span className="ml-4">Qtd: {item.quantidade}</span>}
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <Truck className="w-5 h-5" />
                    Gerar Etiqueta de Envio
                  </button>
                  <button className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                    Marcar como Enviado
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
