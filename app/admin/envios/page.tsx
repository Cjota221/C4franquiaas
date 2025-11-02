"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Package, Truck, CheckCircle, XCircle, Printer, Eye, RefreshCw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Envio {
  id: string;
  melhorenvio_order_id: string;
  melhorenvio_protocol: string;
  codigo_rastreio: string;
  status_envio: string;
  servico_nome: string;
  transportadora: string;
  valor_frete: number;
  etiqueta_gerada_em: string;
  etiqueta_impressa: boolean;
  pedido: {
    numero_pedido: string;
    nome_cliente: string;
    cidade: string;
    estado: string;
  };
}

export default function EnviosPage() {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('all');
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const carregarEnvios = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pedidos_envio')
        .select(`
          *,
          pedido:pedidos(
            numero_pedido,
            nome_cliente,
            cidade,
            estado
          )
        `)
        .order('created_at', { ascending: false });

      if (filtroStatus !== 'all') {
        query = query.eq('status_envio', filtroStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEnvios(data || []);
    } catch (error) {
      console.error('Erro ao carregar envios:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroStatus]);

  useEffect(() => {
    carregarEnvios();
  }, [carregarEnvios]);

  const imprimirEtiquetas = async () => {
    if (selecionados.length === 0) {
      return;
    }

    try {
      const response = await fetch('/api/melhorenvio/print-labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_ids: selecionados,
        }),
      });

      await response.json();
      setSelecionados([]);
      carregarEnvios();
    } catch (error) {
      console.error('Erro ao imprimir etiquetas:', error);
      alert('Erro ao imprimir etiquetas');
    }
  };

  const statusConfig: Record<string, { label: string; color: string; icon: React.JSX.Element }> = {
    pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-800', icon: <Package className="w-4 h-4" /> },
    paid: { label: 'Pago', color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="w-4 h-4" /> },
    generated: { label: 'Etiqueta Gerada', color: 'bg-purple-100 text-purple-800', icon: <Printer className="w-4 h-4" /> },
    posted: { label: 'Postado', color: 'bg-yellow-100 text-yellow-800', icon: <Truck className="w-4 h-4" /> },
    transit: { label: 'Em Trânsito', color: 'bg-orange-100 text-orange-800', icon: <Truck className="w-4 h-4" /> },
    delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
    canceled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> },
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Envios</h1>
          <p className="text-gray-600 mt-2">
            Gerencie etiquetas, rastreamento e logística
          </p>
        </div>
        <button
          onClick={carregarEnvios}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Filtros e Ações */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2">
          {['all', 'generated', 'posted', 'transit', 'delivered'].map((status) => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-2 rounded-lg transition ${
                filtroStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Todos' : statusConfig[status]?.label || status}
            </button>
          ))}
        </div>

        {selecionados.length > 0 && (
          <button
            onClick={imprimirEtiquetas}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir {selecionados.length} Etiqueta(s)
          </button>
        )}
      </div>

      {/* Lista de Envios */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selecionados.length === envios.length && envios.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelecionados(envios.map(e => e.melhorenvio_order_id));
                    } else {
                      setSelecionados([]);
                    }
                  }}
                  className="rounded"
                />
              </th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">Pedido</th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">Cliente</th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">Destino</th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">Serviço</th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">Rastreio</th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="p-4 text-left text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  Carregando...
                </td>
              </tr>
            ) : envios.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  Nenhum envio encontrado
                </td>
              </tr>
            ) : (
              envios.map((envio) => (
                <tr key={envio.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selecionados.includes(envio.melhorenvio_order_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelecionados([...selecionados, envio.melhorenvio_order_id]);
                        } else {
                          setSelecionados(selecionados.filter(id => id !== envio.melhorenvio_order_id));
                        }
                      }}
                      className="rounded"
                    />
                  </td>
                  <td className="p-4">
                    <div className="font-semibold">#{envio.pedido.numero_pedido}</div>
                    <div className="text-sm text-gray-500">{envio.melhorenvio_protocol}</div>
                  </td>
                  <td className="p-4 text-sm">{envio.pedido.nome_cliente}</td>
                  <td className="p-4 text-sm">
                    {envio.pedido.cidade}/{envio.pedido.estado}
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium">{envio.servico_nome}</div>
                    <div className="text-xs text-gray-500">{envio.transportadora}</div>
                  </td>
                  <td className="p-4">
                    {envio.codigo_rastreio ? (
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {envio.codigo_rastreio}
                      </code>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[envio.status_envio]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {statusConfig[envio.status_envio]?.icon}
                      {statusConfig[envio.status_envio]?.label || envio.status_envio}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => window.location.href = `/admin/envios/${envio.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
