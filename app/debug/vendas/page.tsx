'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

interface Venda {
  id: string;
  loja_id: string;
  franqueada_id: string;
  cliente_nome: string;
  cliente_email: string;
  valor_total: string | number; // DECIMAL do Postgres pode vir como string
  status_pagamento: string;
  mp_payment_id?: string;
  created_at: string;
}

export default function DebugVendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendas = async () => {
      try {
        const supabase = createBrowserClient();
        
        // Buscar TODAS as vendas (sem RLS)
        const { data, error } = await supabase
          .from('vendas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Erro ao buscar vendas:', error);
          setError(JSON.stringify(error, null, 2));
        } else {
          console.log('Vendas encontradas:', data);
          setVendas(data || []);
        }
      } catch (err) {
        console.error('Exception:', err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchVendas();
  }, []);

  if (loading) return <div className="p-8">Carregando vendas...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Debug - Vendas no Banco</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="font-bold text-red-700 mb-2">Erro ao buscar vendas:</h2>
          <pre className="text-sm text-red-600 overflow-auto">{error}</pre>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <p className="text-sm text-gray-600">
            Total de vendas encontradas: <strong>{vendas.length}</strong>
          </p>
        </div>

        {vendas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma venda encontrada no banco de dados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MP Payment ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendas.map((venda) => (
                  <tr key={venda.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-500 truncate max-w-[150px]">
                      {venda.id}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{venda.cliente_nome}</div>
                      <div className="text-gray-500 text-xs">{venda.cliente_email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      R$ {Number(venda.valor_total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        venda.status_pagamento === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : venda.status_pagamento === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {venda.status_pagamento}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {venda.mp_payment_id || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(venda.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {vendas.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t">
            <details className="cursor-pointer">
              <summary className="text-sm font-medium text-gray-700">
                Ver JSON completo (debug)
              </summary>
              <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(vendas, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
