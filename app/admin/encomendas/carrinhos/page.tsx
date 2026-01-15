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
  ShoppingCart,
  MessageCircle,
  DollarSign,
  Eye,
} from 'lucide-react';
import type { GradeFechadaCarrinho } from '@/types/grade-fechada';

export default function CarrinhosAbandonadosPage() {
  const [carrinhos, setCarrinhos] = useState<GradeFechadaCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<'ativo' | 'convertido' | 'expirado'>('ativo');

  useEffect(() => {
    fetchCarrinhos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus]);

  const fetchCarrinhos = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/grade-fechada/carrinhos?status=${filtroStatus}`
      );
      const data = await response.json();

      if (response.ok) {
        setCarrinhos(data.data || []);
      } else {
        toast.error('Erro ao carregar carrinhos');
      }
    } catch (error) {
      console.error('Erro ao carregar carrinhos:', error);
      toast.error('Erro ao carregar carrinhos');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = (carrinho: GradeFechadaCarrinho) => {
    if (!carrinho.cliente_telefone) {
      toast.error('Carrinho não possui telefone cadastrado');
      return;
    }

    const telefone = carrinho.cliente_telefone.replace(/\D/g, '');
    const mensagem = `Olá ${carrinho.cliente_nome || 'cliente'}! Notamos que você montou um carrinho em nosso site. Podemos ajudar a finalizar seu pedido?`;
    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      ativo: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
      convertido: { label: 'Convertido', color: 'bg-blue-100 text-blue-700' },
      expirado: { label: 'Expirado', color: 'bg-gray-100 text-gray-700' },
    };

    const config = statusConfig[status] || statusConfig.ativo;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const calcularTempoDesdeAcao = (data: string) => {
    const agora = new Date();
    const dataCarrinho = new Date(data);
    const diffMs = agora.getTime() - dataCarrinho.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffHoras / 24);

    if (diffDias > 0) {
      return `${diffDias} ${diffDias === 1 ? 'dia' : 'dias'} atrás`;
    } else if (diffHoras > 0) {
      return `${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'} atrás`;
    } else {
      return 'Há poucos minutos';
    }
  };

  return (
    <PageWrapper title="Carrinhos - Grade Fechada">
      <div className="p-6 max-w-7xl mx-auto">
        <PageHeader
          title="Carrinhos Abandonados"
          subtitle="Acompanhe carrinhos não finalizados e faça follow-up"
        />

        {/* Filtros */}
        <div className="flex gap-4 mt-6 mb-6">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as 'ativo' | 'convertido' | 'expirado')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
          >
            <option value="ativo">Ativos</option>
            <option value="convertido">Convertidos</option>
            <option value="expirado">Expirados</option>
          </select>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Carrinhos</p>
                <p className="text-3xl font-bold text-gray-900">{carrinhos.length}</p>
              </div>
              <ShoppingCart className="w-12 h-12 text-gray-300" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-3xl font-bold text-pink-600">
                  R${' '}
                  {carrinhos
                    .reduce((sum, c) => sum + c.valor_total, 0)
                    .toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-pink-300" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Com Contato</p>
                <p className="text-3xl font-bold text-green-600">
                  {carrinhos.filter((c) => c.cliente_telefone).length}
                </p>
              </div>
              <MessageCircle className="w-12 h-12 text-green-300" />
            </div>
          </Card>
        </div>

        {/* Lista de carrinhos */}
        {loading ? (
          <LoadingState message="Carregando carrinhos..." />
        ) : carrinhos.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Nenhum carrinho encontrado"
            description={`Não há carrinhos ${filtroStatus}s no momento`}
          />
        ) : (
          <div className="space-y-4">
            {carrinhos.map((carrinho) => (
              <Card key={carrinho.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Informações */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {carrinho.cliente_nome || 'Cliente Anônimo'}
                        </h3>
                        {getStatusBadge(carrinho.status)}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-pink-600">
                          R$ {carrinho.valor_total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      {carrinho.cliente_telefone && (
                        <p>📱 {carrinho.cliente_telefone}</p>
                      )}
                      {carrinho.cliente_email && (
                        <p>📧 {carrinho.cliente_email}</p>
                      )}
                      <p>
                        🕐 Criado {calcularTempoDesdeAcao(carrinho.criado_em)}
                      </p>
                      {carrinho.status === 'convertido' && carrinho.data_conversao && (
                        <p className="text-green-600 font-medium">
                          ✅ Convertido {calcularTempoDesdeAcao(carrinho.data_conversao)}
                        </p>
                      )}
                    </div>

                    {/* Itens */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Itens no Carrinho:
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {carrinho.itens.map((item, index) => (
                          <li key={index} className="flex justify-between">
                            <span>
                              {item.produto_nome} -{' '}
                              {item.tipo_grade === 'meia'
                                ? 'Meia Grade'
                                : 'Grade Completa'}{' '}
                              ({item.quantidade_grades}x)
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
                    {carrinho.cliente_telefone && carrinho.status === 'ativo' && (
                      <Button
                        size="sm"
                        onClick={() => handleWhatsApp(carrinho)}
                        className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Contatar
                      </Button>
                    )}

                    {carrinho.status === 'convertido' &&
                      carrinho.convertido_em_pedido_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(
                              `/admin/encomendas/pedidos`,
                              '_blank'
                            )
                          }
                          className="flex-1 md:flex-none"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Pedido
                        </Button>
                      )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Dicas */}
        {filtroStatus === 'ativo' && carrinhos.length > 0 && (
          <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
            <h3 className="font-bold text-blue-900 mb-3">💡 Dicas de Follow-up</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Entre em contato nas primeiras 24 horas para maior taxa de conversão</li>
              <li>• Ofereça ajuda para completar a montagem da grade</li>
              <li>• Informe sobre promoções ou condições especiais</li>
              <li>• Pergunte se há dúvidas sobre o produto ou processo</li>
            </ul>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}
