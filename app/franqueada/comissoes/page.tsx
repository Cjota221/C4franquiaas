'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ResumoComissoes } from '@/components/franqueada/ResumoComissoes';
import { TabelaMinhasVendas } from '@/components/franqueada/TabelaMinhasVendas';
import type { VendaComComissao } from '@/types/financeiro';
import { Wallet, AlertCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import Link from 'next/link';

export default function MinhasComissoesPage() {
  const supabase = createClient();
  
  const [vendas, setVendas] = useState<VendaComComissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [temDadosPix, setTemDadosPix] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErro('Usuario nao autenticado');
        return;
      }

      // Carregar vendas da franqueada
      const { data: vendasData, error: vendasError } = await supabase
        .from('vendas')
        .select('*')
        .eq('franqueada_id', user.id)
        .order('created_at', { ascending: false });

      if (vendasError) {
        console.error('Erro ao carregar vendas:', vendasError);
        setErro('Erro ao carregar vendas. Tente novamente.');
        return;
      }

      setVendas(vendasData || []);

      // Verificar se franqueada tem dados PIX cadastrados
      const { data: dadosPix } = await supabase
        .from('franqueadas_dados_pagamento')
        .select('id')
        .eq('franqueada_id', user.id)
        .single();

      setTemDadosPix(!!dadosPix);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErro('Erro inesperado ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Calcular totais
  const totalPendente = vendas
    .filter(v => v.status_comissao === 'pendente' && v.status_pagamento === 'approved')
    .reduce((sum, v) => sum + Number(v.comissao_franqueada), 0);

  const totalPago = vendas
    .filter(v => v.status_comissao === 'paga')
    .reduce((sum, v) => sum + Number(v.comissao_franqueada), 0);

  const quantidadeVendasPendentes = vendas.filter(
    v => v.status_comissao === 'pendente' && v.status_pagamento === 'approved'
  ).length;

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <LoadingState message="Carregando comissoes..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <PageHeader
        title="Comissoes"
        subtitle="Acompanhe suas vendas e comissoes a receber"
        icon={Wallet}
      />

      {/* Alerta: Cadastrar Dados PIX */}
      {!temDadosPix && (
        <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">
                Cadastre seus dados de recebimento
              </h3>
              <p className="text-sm text-amber-800 mb-3">
                Para receber suas comissoes, voce precisa cadastrar sua chave PIX.
              </p>
              <Link href="/franqueada/perfil">
                <Button variant="outline" size="sm" className="border-amber-600 text-amber-700 hover:bg-amber-100">
                  Cadastrar Chave PIX
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Erro */}
      {erro && (
        <Card className="p-6 mb-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Erro ao carregar dados</p>
              <p className="text-sm text-red-700">{erro}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Resumo de Comissoes */}
      {!erro && (
        <ResumoComissoes
          totalPendente={totalPendente}
          totalPago={totalPago}
          quantidadeVendasPendentes={quantidadeVendasPendentes}
        />
      )}

      {/* Tabela de Vendas */}
      <TabelaMinhasVendas vendas={vendas} loading={false} />
    </div>
  );
}
