'use client';

import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, Clock } from 'lucide-react';

interface ResumoComissoesProps {
  totalPendente: number;
  totalPago: number;
  quantidadeVendasPendentes: number;
}

export function ResumoComissoes({ 
  totalPendente, 
  totalPago, 
  quantidadeVendasPendentes 
}: ResumoComissoesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total a Receber */}
      <Card className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-pink-700 mb-1">Total a Receber</p>
            <p className="text-3xl font-bold text-pink-900">
              R$ {totalPendente.toFixed(2)}
            </p>
            <p className="text-xs text-pink-600 mt-1">
              {quantidadeVendasPendentes} {quantidadeVendasPendentes === 1 ? 'venda' : 'vendas'}
            </p>
          </div>
          <div className="p-3 bg-pink-500 rounded-full">
            <Clock className="w-6 h-6 text-white" />
          </div>
        </div>
      </Card>

      {/* Total Já Recebido */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-700 mb-1">Total Recebido</p>
            <p className="text-3xl font-bold text-green-900">
              R$ {totalPago.toFixed(2)}
            </p>
            <p className="text-xs text-green-600 mt-1">Comissões pagas</p>
          </div>
          <div className="p-3 bg-green-500 rounded-full">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
        </div>
      </Card>

      {/* Total Geral */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Total Geral</p>
            <p className="text-3xl font-bold text-blue-900">
              R$ {(totalPendente + totalPago).toFixed(2)}
            </p>
            <p className="text-xs text-blue-600 mt-1">Todas as comissões</p>
          </div>
          <div className="p-3 bg-blue-500 rounded-full">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
      </Card>
    </div>
  );
}
