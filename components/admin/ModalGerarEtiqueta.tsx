/**
 * Modal: Geração de Etiqueta EnvioEcom
 * Permite cotar frete e gerar etiqueta para um pedido específico
 */

"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Loader2,
  Package,
  Truck,
  Clock,
  DollarSign,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { CotacaoRequest, ServicoCotacao, EtiquetaRequest } from '@/types/envioecom';

interface ConfigEnvioEcom {
  id: string;
  slug: string;
  etoken: string;
  cep_origem: string;
  endereco_origem: {
    nome: string;
    telefone: string;
    email: string;
    documento?: string;
    endereco: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  dimensoes_padrao: {
    peso: number;
    altura: number;
    largura: number;
    comprimento: number;
  };
  ativo: boolean;
}

interface ModalGerarEtiquetaProps {
  open: boolean;
  onClose: () => void;
  pedido: {
    id: string;
    cliente_nome: string;
    cliente_cpf: string;
    cliente_telefone: string;
    cliente_email: string;
    endereco_completo: {
      cep: string;
      rua: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      estado: string;
    };
    items: Array<{
      id: string;
      nome: string;
      quantidade: number;
      preco: number;
    }>;
    valor_total: number;
    status_pagamento: string;
  };
  onEtiquetaGerada?: () => void;
}

export default function ModalGerarEtiqueta({
  open,
  onClose,
  pedido,
  onEtiquetaGerada,
}: ModalGerarEtiquetaProps) {
  const supabase = createBrowserClient();
  const [step, setStep] = useState<'loading' | 'cotacao' | 'gerando' | 'sucesso' | 'erro'>('loading');
  const [servicos, setServicos] = useState<ServicoCotacao[]>([]);
  const [servicoSelecionado, setServicoSelecionado] = useState<ServicoCotacao | null>(null);
  const [config, setConfig] = useState<ConfigEnvioEcom | null>(null);
  const [etiquetaUrl, setEtiquetaUrl] = useState<string>('');
  const [codigoRastreio, setCodigoRastreio] = useState<string>('');
  const [erro, setErro] = useState<string>('');

  useEffect(() => {
    if (open) {
      carregarConfigECotar();
    } else {
      // Reset ao fechar
      setStep('loading');
      setServicos([]);
      setServicoSelecionado(null);
      setEtiquetaUrl('');
      setCodigoRastreio('');
      setErro('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const carregarConfigECotar = async () => {
    setStep('loading');
    try {
      // 1. Carregar configuração do EnvioEcom
      const { data: configData, error: configError } = await supabase
        .from('config_envioecom')
        .select('*')
        .eq('ativo', true)
        .single();

      if (configError) {
        throw new Error('Configuração EnvioEcom não encontrada. Configure em Admin → Configurações → Envio');
      }

      setConfig(configData);

      // 2. Fazer cotação de frete
      const cotacaoRequest: CotacaoRequest = {
        origem: {
          cep: configData.cep_origem,
        },
        destino: {
          cep: pedido.endereco_completo.cep.replace(/\D/g, ''),
        },
        pacotes: [
          {
            peso: configData.dimensoes_padrao.peso || 500,
            altura: configData.dimensoes_padrao.altura || 10,
            largura: configData.dimensoes_padrao.largura || 15,
            comprimento: configData.dimensoes_padrao.comprimento || 20,
            valor_declarado: pedido.valor_total,
          },
        ],
      };

      const response = await fetch('https://api.envioecom.com.br/v1/cotacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${configData.etoken}`,
          'X-User-Slug': configData.slug,
        },
        body: JSON.stringify(cotacaoRequest),
      });

      const cotacaoData = await response.json();

      if (!cotacaoData.sucesso || !cotacaoData.servicos || cotacaoData.servicos.length === 0) {
        throw new Error(cotacaoData.mensagem || 'Nenhum serviço de frete disponível');
      }

      // Ordenar por preço (mais barato primeiro)
      const servicosOrdenados = cotacaoData.servicos.sort((a: ServicoCotacao, b: ServicoCotacao) => a.preco - b.preco);
      setServicos(servicosOrdenados);
      setStep('cotacao');
    } catch (error) {
      console.error('Erro ao cotar frete:', error);
      setErro(error instanceof Error ? error.message : 'Erro ao carregar serviços de frete');
      setStep('erro');
    }
  };

  const gerarEtiqueta = async () => {
    if (!servicoSelecionado || !config) return;

    setStep('gerando');
    try {
      // Preparar dados da etiqueta
      const etiquetaRequest: EtiquetaRequest = {
        servico_id: servicoSelecionado.servico_id,
        remetente: {
          nome: config.endereco_origem.nome,
          telefone: config.endereco_origem.telefone,
          email: config.endereco_origem.email,
          documento: config.endereco_origem.documento || '',
          endereco: config.endereco_origem.endereco,
          numero: config.endereco_origem.numero,
          complemento: config.endereco_origem.complemento || '',
          bairro: config.endereco_origem.bairro,
          cidade: config.endereco_origem.cidade,
          estado: config.endereco_origem.estado,
          cep: config.endereco_origem.cep,
        },
        destinatario: {
          nome: pedido.cliente_nome,
          telefone: pedido.cliente_telefone,
          email: pedido.cliente_email,
          documento: pedido.cliente_cpf,
          endereco: pedido.endereco_completo.rua,
          numero: pedido.endereco_completo.numero,
          complemento: pedido.endereco_completo.complemento || '',
          bairro: pedido.endereco_completo.bairro,
          cidade: pedido.endereco_completo.cidade,
          estado: pedido.endereco_completo.estado,
          cep: pedido.endereco_completo.cep.replace(/\D/g, ''),
        },
        pacotes: [
          {
            peso: config.dimensoes_padrao.peso || 500,
            altura: config.dimensoes_padrao.altura || 10,
            largura: config.dimensoes_padrao.largura || 15,
            comprimento: config.dimensoes_padrao.comprimento || 20,
            valor_declarado: pedido.valor_total,
          },
        ],
        produtos: pedido.items.map((item) => ({
          nome: item.nome,
          quantidade: item.quantidade,
          valor_unitario: item.preco,
        })),
        numero_pedido: pedido.id,
      };

      // Chamar API EnvioEcom
      const response = await fetch('https://api.envioecom.com.br/v1/etiqueta/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.etoken}`,
          'X-User-Slug': config.slug,
        },
        body: JSON.stringify(etiquetaRequest),
      });

      const etiquetaData = await response.json();

      if (!etiquetaData.sucesso) {
        throw new Error(etiquetaData.mensagem || etiquetaData.erro || 'Erro ao gerar etiqueta');
      }

      // Salvar dados no banco
      const { error: updateError } = await supabase
        .from('vendas')
        .update({
          codigo_rastreio: etiquetaData.codigo_rastreio,
          url_etiqueta: etiquetaData.url_etiqueta,
          servico_envioecom_id: servicoSelecionado.servico_id,
          transportadora: servicoSelecionado.transportadora,
          prazo_entrega_dias: servicoSelecionado.prazo_entrega,
          status_envio: 'ENVIADO',
        })
        .eq('id', pedido.id);

      if (updateError) {
        console.error('Erro ao salvar no banco:', updateError);
        throw updateError;
      }

      setEtiquetaUrl(etiquetaData.url_etiqueta);
      setCodigoRastreio(etiquetaData.codigo_rastreio);
      setStep('sucesso');

      toast.success('Etiqueta gerada com sucesso!');
      
      if (onEtiquetaGerada) {
        onEtiquetaGerada();
      }
    } catch (error) {
      console.error('Erro ao gerar etiqueta:', error);
      setErro(error instanceof Error ? error.message : 'Erro ao gerar etiqueta');
      setStep('erro');
    }
  };

  const baixarEtiqueta = () => {
    if (etiquetaUrl) {
      window.open(etiquetaUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Gerar Etiqueta de Envio
          </DialogTitle>
          <DialogDescription>
            Pedido #{pedido.id} - {pedido.cliente_nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-gray-400 mb-4" />
              <p className="text-gray-600">Consultando serviços de frete...</p>
            </div>
          )}

          {/* Cotação */}
          {step === 'cotacao' && (
            <>
              <Alert>
                <Package className="h-4 w-4" />
                <AlertDescription>
                  Selecione o serviço de frete desejado para gerar a etiqueta
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {servicos.map((servico) => (
                  <div
                    key={servico.servico_id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-500 ${
                      servicoSelecionado?.servico_id === servico.servico_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                    onClick={() => setServicoSelecionado(servico)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{servico.nome}</h4>
                          <Badge variant="outline">{servico.transportadora}</Badge>
                        </div>
                        {servico.descricao && (
                          <p className="text-sm text-gray-600">{servico.descricao}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {servico.prazo_entrega} dias úteis
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-2xl font-bold text-gray-900">
                          <DollarSign className="w-5 h-5" />
                          {servico.preco.toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={gerarEtiqueta}
                  disabled={!servicoSelecionado}
                  className="flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  Gerar Etiqueta
                </Button>
              </div>
            </>
          )}

          {/* Gerando */}
          {step === 'gerando' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Gerando etiqueta...</p>
              <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
            </div>
          )}

          {/* Sucesso */}
          {step === 'sucesso' && (
            <>
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Etiqueta gerada com sucesso!
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Código de Rastreio</p>
                      <p className="font-mono font-semibold text-gray-900">{codigoRastreio}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Transportadora</p>
                      <p className="font-semibold text-gray-900">{servicoSelecionado?.transportadora}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Prazo de Entrega</p>
                      <p className="font-semibold text-gray-900">
                        {servicoSelecionado?.prazo_entrega} dias úteis
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Custo do Frete</p>
                      <p className="font-semibold text-gray-900">
                        R$ {servicoSelecionado?.preco.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={onClose}>
                    Fechar
                  </Button>
                  <Button onClick={baixarEtiqueta} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Baixar Etiqueta (PDF)
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Erro */}
          {step === 'erro' && (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{erro}</AlertDescription>
              </Alert>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
                <Button onClick={carregarConfigECotar}>
                  Tentar Novamente
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
