"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Package, Calendar, User, ShoppingBag } from "lucide-react";

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
import type { VendaComComissao } from "@/types/financeiro";

interface VendaDetalhada extends VendaComComissao {
  loja_nome?: string;
  franqueada_nome?: string;
}

export default function VendasAdminPage() {
  const [vendas, setVendas] = useState<VendaDetalhada[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarVendas = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createBrowserClient();
      
      // Buscar vendas com dados da loja
      const { data: vendasData, error } = await supabase
        .from("vendas")
        .select(`
          *,
          lojas:loja_id(nome)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar vendas:", error);
        return;
      }

      // Buscar nomes das franqueadas
      const vendasComDetalhes = await Promise.all(
        (vendasData || []).map(async (venda) => {
          let franqueada_nome = 'N/A';
          
          if (venda.franqueada_id) {
            const { data: userData } = await supabase
              .from('franqueadas')
              .select('nome')
              .eq('user_id', venda.franqueada_id)
              .single();
            
            if (userData) {
              franqueada_nome = userData.nome;
            }
          }

          return {
            ...venda,
            loja_nome: venda.lojas?.nome || 'Sem loja',
            franqueada_nome
          };
        })
      );

      setVendas(vendasComDetalhes);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarVendas();
  }, [carregarVendas]);

  // Calcular totais
  const totalVendas = vendas.reduce((sum, v) => sum + Number(v.valor_total), 0);
  const totalComissoes = vendas.reduce((sum, v) => sum + Number(v.comissao_franqueada || 0), 0);
  const totalLucro = totalVendas - totalComissoes;

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Vendas</h1>
        <Card className="p-6">
          <p className="text-gray-500">Carregando vendas...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendas</h1>
        <p className="text-gray-600">Visualize todas as vendas da plataforma</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Total em Vendas</p>
              <p className="text-3xl font-bold text-blue-900">
                R$ {totalVendas.toFixed(2)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {vendas.length} {vendas.length === 1 ? 'venda' : 'vendas'}
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-full">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-pink-700 mb-1">Total Comissões</p>
              <p className="text-3xl font-bold text-pink-900">
                R$ {totalComissoes.toFixed(2)}
              </p>
              <p className="text-xs text-pink-600 mt-1">Franqueadas</p>
            </div>
            <div className="p-3 bg-pink-500 rounded-full">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Lucro Líquido</p>
              <p className="text-3xl font-bold text-green-900">
                R$ {totalLucro.toFixed(2)}
              </p>
              <p className="text-xs text-green-600 mt-1">Após comissões</p>
            </div>
            <div className="p-3 bg-green-500 rounded-full">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabela de Vendas Detalhada */}
      <Card className="overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Todas as Vendas</h3>
        </div>

        {vendas.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma venda encontrada</p>
          </div>
        ) : (
          <>
            {/* Tabela Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Loja</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Franqueada</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Produtos</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Valor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Comissão</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Lucro</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Pagamento</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Comissão</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendas.map((venda) => {
                    const lucro = Number(venda.valor_total) - Number(venda.comissao_franqueada || 0);
                    const items = typeof venda.items === 'string' ? JSON.parse(venda.items) : venda.items;
                    
                    return (
                      <tr key={venda.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(venda.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">{venda.cliente_nome}</div>
                          <div className="text-xs text-gray-500">{venda.cliente_email}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{venda.loja_nome}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{venda.franqueada_nome}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            {Array.isArray(items) && items.map((item, idx) => (
                              <div key={idx} className="mb-1">
                                <span className="font-medium">{item.title}</span>
                                {item.id && <span className="text-xs text-gray-500 ml-2">SKU: {item.id}</span>}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            R$ {Number(venda.valor_total).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-bold text-pink-600">
                            R$ {Number(venda.comissao_franqueada || 0).toFixed(2)}
                          </span>
                          <div className="text-xs text-gray-500">
                            ({venda.percentual_comissao || 0}%)
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-bold text-green-600">
                            R$ {lucro.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          {getStatusPagamentoBadge(venda.status_pagamento)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          {getStatusComissaoBadge(venda.status_comissao)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cards Mobile */}
            <div className="lg:hidden divide-y divide-gray-200">
              {vendas.map((venda) => {
                const lucro = Number(venda.valor_total) - Number(venda.comissao_franqueada || 0);
                const items = typeof venda.items === 'string' ? JSON.parse(venda.items) : venda.items;
                
                return (
                  <div key={venda.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(venda.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      {getStatusPagamentoBadge(venda.status_pagamento)}
                    </div>

                    <div className="mb-3">
                      <p className="font-medium text-gray-900">{venda.cliente_nome}</p>
                      <p className="text-sm text-gray-500">{venda.loja_nome} • {venda.franqueada_nome}</p>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-1">Produtos:</p>
                      {Array.isArray(items) && items.map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-900">{item.title}</p>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-xs text-blue-700">Valor</p>
                        <p className="text-sm font-semibold text-blue-900">R$ {Number(venda.valor_total).toFixed(2)}</p>
                      </div>
                      <div className="bg-pink-50 p-2 rounded">
                        <p className="text-xs text-pink-700">Comissão</p>
                        <p className="text-sm font-semibold text-pink-900">R$ {Number(venda.comissao_franqueada || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-xs text-green-700">Lucro</p>
                        <p className="text-sm font-semibold text-green-900">R$ {lucro.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status Comissão:</span>
                      {getStatusComissaoBadge(venda.status_comissao)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
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
