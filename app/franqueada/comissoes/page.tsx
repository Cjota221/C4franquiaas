'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ResumoComissoes } from '@/components/franqueada/ResumoComissoes';
import { TabelaMinhasVendas } from '@/components/franqueada/TabelaMinhasVendas';
import type { VendaComComissao } from '@/types/financeiro';
import { Wallet, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

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
        setErro('UsuÃ¡rio nÃ£o autenticado');
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-8 h-8 text-pink-600" />
          <h1 className="text-3xl font-bold text-gray-900">Minhas ComissÃµes</h1>
        </div>
        <p className="text-gray-600">
          Acompanhe suas vendas e comissÃµes a receber.
        </p>
      </div>

      {/* Alerta: Cadastrar Dados PIX */}
      {!temDadosPix && !loading && (
        <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                Cadastre seus dados de recebimento
              </h3>
              <p className="text-sm text-yellow-800 mb-3">
                Para receber suas comissÃµes, vocÃª precisa cadastrar sua chave PIX.
              </p>
              <a
                href="/franqueada/perfil"
                className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                Cadastrar Chave PIX
              </a>
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

      {/* Resumo de ComissÃµes */}
      {!loading && !erro && (
        <ResumoComissoes
          totalPendente={totalPendente}
          totalPago={totalPago}
          quantidadeVendasPendentes={quantidadeVendasPendentes}
        />
      )}

      {/* Tabela de Vendas */}
      <TabelaMinhasVendas vendas={vendas} loading={loading} />
    </div>
  );
}
