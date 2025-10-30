'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { VendaComComissao } from '@/types/financeiro';
import { Calendar, Package } from 'lucide-react';

interface TabelaMinhasVendasProps {
  vendas: VendaComComissao[];
  loading?: boolean;
}

export function TabelaMinhasVendas({ vendas, loading }: TabelaMinhasVendasProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">Carregando vendas...</p>
      </Card>
    );
  }

  if (vendas.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nenhuma venda encontrada</p>
          <p className="text-gray-400 text-sm mt-2">
            Suas vendas aparecerão aqui quando os clientes finalizarem compras.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Histórico de Vendas</h3>
        <p className="text-sm text-gray-600">
          Total: {vendas.length} {vendas.length === 1 ? 'venda' : 'vendas'}
        </p>
      </div>

      {/* Tabela Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                ID Pedido
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Valor Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Minha Comissão
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status Pagamento
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status Comissão
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vendas.map((venda) => (
              <tr key={venda.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(venda.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {venda.mp_payment_id || venda.id.substring(0, 8)}
                  </code>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{venda.cliente_nome}</div>
                  <div className="text-xs text-gray-500">{venda.cliente_email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    R$ {Number(venda.valor_total).toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-bold text-pink-600">
                    R$ {Number(venda.comissao_franqueada).toFixed(2)}
                  </span>
                  <div className="text-xs text-gray-500">
                    ({venda.percentual_comissao}%)
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {getStatusPagamentoBadge(venda.status_pagamento)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {getStatusComissaoBadge(venda.status_comissao)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards Mobile */}
      <div className="md:hidden divide-y divide-gray-200">
        {vendas.map((venda) => (
          <div key={venda.id} className="p-4 hover:bg-gray-50">
            {/* Header do Card */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                {new Date(venda.created_at).toLocaleDateString('pt-BR')}
              </div>
              {getStatusComissaoBadge(venda.status_comissao)}
            </div>

            {/* Cliente */}
            <div className="mb-3">
              <p className="font-medium text-gray-900">{venda.cliente_nome}</p>
              <p className="text-sm text-gray-500">{venda.cliente_email}</p>
            </div>

            {/* Valores */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Valor Total</p>
                <p className="text-lg font-semibold text-gray-900">
                  R$ {Number(venda.valor_total).toFixed(2)}
                </p>
              </div>
              <div className="bg-pink-50 p-3 rounded-lg">
                <p className="text-xs text-pink-700 mb-1">Minha Comissão</p>
                <p className="text-lg font-bold text-pink-600">
                  R$ {Number(venda.comissao_franqueada).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs">
              <code className="bg-gray-100 px-2 py-1 rounded">
                {venda.mp_payment_id || venda.id.substring(0, 8)}
              </code>
              {getStatusPagamentoBadge(venda.status_pagamento)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function getStatusPagamentoBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    approved: { label: 'Aprovado', variant: 'default' },
    pending: { label: 'Pendente', variant: 'secondary' },
    rejected: { label: 'Rejeitado', variant: 'destructive' },
    cancelled: { label: 'Cancelado', variant: 'outline' },
  };

  const config = statusMap[status] || { label: status, variant: 'outline' };

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}

function getStatusComissaoBadge(status: string) {
  if (status === 'paga') {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
        ✓ Paga
      </Badge>
    );
  }

  return (
    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
      ⏳ Pendente
    </Badge>
  );
}
