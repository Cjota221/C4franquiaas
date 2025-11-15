"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calendar, User } from "lucide-react";
import type { VendaComComissao } from "@/types/financeiro";

interface VendaDetalhada extends VendaComComissao {
  loja_nome?: string;
  franqueada_nome?: string;
}

export default function ComissoesAdminPage() {
  const [vendas, setVendas] = useState<VendaDetalhada[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarVendas = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
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

  // Helper para badge de status comissÃ£o
  const getStatusComissaoBadge = (status: string) => {
    const styles: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string, className: string }> = {
      paga: { variant: "default", label: "Paga", className: "bg-green-500 text-white" },
      pendente: { variant: "secondary", label: "Pendente", className: "bg-yellow-500 text-white" },
    };
    const config = styles[status] || { variant: "outline" as const, label: status, className: "bg-gray-300 text-gray-800" };
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
          <DollarSign className="w-8 h-8 text-pink-600" />
          <h1 className="text-3xl font-bold text-gray-900">Controle de ComissÃµes</h1>
        </div>
        <p className="text-gray-600">
          GestÃ£o financeira: vendas, comissÃµes e pagamentos Ã s franqueadas.
        </p>
      </div>

      {/* Cards de Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total em Vendas */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total em Vendas</h3>
              <TrendingUp className="w-5 h-5 opacity-75" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                R$ {totalVendas.toFixed(2)}
              </span>
            </div>
            <p className="text-xs opacity-75 mt-2">
              {vendas.length} {vendas.length === 1 ? 'venda' : 'vendas'}
            </p>
          </div>
        </Card>

        {/* Total ComissÃµes */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total ComissÃµes</h3>
              <DollarSign className="w-5 h-5 opacity-75" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                R$ {totalComissoes.toFixed(2)}
              </span>
            </div>
            <p className="text-xs opacity-75 mt-2">
              A pagar Ã s franqueadas
            </p>
          </div>
        </Card>

        {/* Lucro LÃ­quido */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Lucro LÃ­quido</h3>
              <TrendingUp className="w-5 h-5 opacity-75" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                R$ {totalLucro.toFixed(2)}
              </span>
            </div>
            <p className="text-xs opacity-75 mt-2">
              Vendas - ComissÃµes
            </p>
          </div>
        </Card>
      </div>

      {/* Tabela Financeira - Desktop */}
      <Card className="overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ID Pedido
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Franqueada
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Valor da Venda
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ComissÃ£o
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status ComissÃ£o
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {vendas.map((venda) => (
                <tr key={venda.id} className="hover:bg-gray-50 transition-colors">
                  {/* Data */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {new Date(venda.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </td>

                  {/* ID Pedido */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-600">
                      {venda.id.substring(0, 8)}
                    </div>
                  </td>

                  {/* Franqueada */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {venda.franqueada_nome}
                      </span>
                    </div>
                  </td>

                  {/* Valor da Venda */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      R$ {Number(venda.valor_total).toFixed(2)}
                    </div>
                  </td>

                  {/* ComissÃ£o */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-pink-600">
                      R$ {Number(venda.comissao_franqueada).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Number(venda.percentual_comissao).toFixed(0)}%
                    </div>
                  </td>

                  {/* Status ComissÃ£o */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusComissaoBadge(venda.status_comissao || 'pendente')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {vendas.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhuma venda encontrada</p>
            <p className="text-sm text-gray-400 mt-1">As vendas aparecerÃ£o aqui apÃ³s as compras.</p>
          </div>
        )}
      </Card>

      {/* Cards Mobile */}
      <div className="md:hidden space-y-4">
        {vendas.map((venda) => (
          <Card key={venda.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {new Date(venda.created_at).toLocaleDateString('pt-BR')}
                </div>
                {getStatusComissaoBadge(venda.status_comissao || 'pendente')}
              </div>

              <div>
                <div className="text-xs text-gray-500">Franqueada</div>
                <div className="font-medium text-gray-900">{venda.franqueada_nome}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Valor da Venda</div>
                  <div className="font-semibold text-gray-900">
                    R$ {Number(venda.valor_total).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">ComissÃ£o</div>
                  <div className="font-semibold text-pink-600">
                    R$ {Number(venda.comissao_franqueada).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {vendas.length === 0 && (
          <Card className="p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhuma venda encontrada</p>
          </Card>
        )}
      </div>
    </div>
  );
}

