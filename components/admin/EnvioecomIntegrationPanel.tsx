/**
 * Painel de Integração Envioecom
 * Interface completa para cotação de frete, geração de etiquetas e rastreamento
 */

"use client";

import React, { useState } from 'react';
import { useCotacaoFrete } from '@/hooks/useEnvioecom';
import type { CotacaoRequest, ServicoCotacao } from '@/types/envioecom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EnvioecomIntegrationPanelProps {
  onSelectServico?: (servico: ServicoCotacao) => void;
  cepDestino?: string;
  valorDeclarado?: number;
}

export function EnvioecomIntegrationPanel({
  onSelectServico,
  cepDestino: cepDestinoProp,
  valorDeclarado: valorDeclaradoProp,
}: EnvioecomIntegrationPanelProps) {
  // Estados do formulário
  const [cepOrigem, setCepOrigem] = useState('');
  const [cepDestino, setCepDestino] = useState(cepDestinoProp || '');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [largura, setLargura] = useState('');
  const [comprimento, setComprimento] = useState('');
  const [valorDeclarado, setValorDeclarado] = useState(
    valorDeclaradoProp ? String(valorDeclaradoProp) : ''
  );

  // Hook de cotação
  const { cotar, cotacoes, limparCotacoes, isLoading, isError, error } = useCotacaoFrete();

  // Handler de submit
  const handleCotarFrete = async (e: React.FormEvent) => {
    e.preventDefault();

    const request: CotacaoRequest = {
      origem: { cep: cepOrigem.replace(/\D/g, '') },
      destino: { cep: cepDestino.replace(/\D/g, '') },
      pacotes: [
        {
          peso: parseFloat(peso),
          altura: parseFloat(altura),
          largura: parseFloat(largura),
          comprimento: parseFloat(comprimento),
          valor_declarado: parseFloat(valorDeclarado),
        },
      ],
    };

    try {
      await cotar(request);
    } catch (err) {
      console.error('Erro ao cotar frete:', err);
    }
  };

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cotação de Frete - Envioecom</CardTitle>
        <CardDescription>
          Calcule o frete em tempo real com as principais transportadoras
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Formulário de Cotação */}
        <form onSubmit={handleCotarFrete} className="space-y-6">
          {/* CEPs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cep-origem">CEP de Origem *</Label>
              <Input
                id="cep-origem"
                type="text"
                placeholder="00000-000"
                value={cepOrigem}
                onChange={(e) => setCepOrigem(e.target.value)}
                required
                maxLength={9}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep-destino">CEP de Destino *</Label>
              <Input
                id="cep-destino"
                type="text"
                placeholder="00000-000"
                value={cepDestino}
                onChange={(e) => setCepDestino(e.target.value)}
                required
                maxLength={9}
              />
            </div>
          </div>

          {/* Dimensões */}
          <div className="space-y-2">
            <Label>Dimensões do Pacote (cm) *</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Input
                  type="number"
                  placeholder="Altura"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  required
                  min="1"
                  step="0.1"
                />
                <span className="text-xs text-gray-500">Altura</span>
              </div>
              <div className="space-y-1">
                <Input
                  type="number"
                  placeholder="Largura"
                  value={largura}
                  onChange={(e) => setLargura(e.target.value)}
                  required
                  min="1"
                  step="0.1"
                />
                <span className="text-xs text-gray-500">Largura</span>
              </div>
              <div className="space-y-1">
                <Input
                  type="number"
                  placeholder="Comprimento"
                  value={comprimento}
                  onChange={(e) => setComprimento(e.target.value)}
                  required
                  min="1"
                  step="0.1"
                />
                <span className="text-xs text-gray-500">Comprimento</span>
              </div>
            </div>
          </div>

          {/* Peso e Valor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="peso">Peso (gramas) *</Label>
              <Input
                id="peso"
                type="number"
                placeholder="Ex: 500"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                required
                min="1"
                step="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor-declarado">Valor Declarado (R$) *</Label>
              <Input
                id="valor-declarado"
                type="number"
                placeholder="Ex: 150.00"
                value={valorDeclarado}
                onChange={(e) => setValorDeclarado(e.target.value)}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Cotando...
                </>
              ) : (
                'Cotar Frete'
              )}
            </Button>

            {cotacoes && (
              <Button
                type="button"
                variant="outline"
                onClick={limparCotacoes}
              >
                Limpar
              </Button>
            )}
          </div>

          {/* Mensagem de Erro */}
          {isError && error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">Erro ao cotar frete:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </form>

        {/* Resultados da Cotação */}
        {cotacoes && cotacoes.servicos && cotacoes.servicos.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">
              Opções de Frete Disponíveis ({cotacoes.servicos.length})
            </h3>

            <div className="space-y-3">
              {cotacoes.servicos.map((servico) => (
                <div
                  key={servico.servico_id}
                  className="border rounded-lg p-4 hover:border-pink-500 transition-colors cursor-pointer"
                  onClick={() => onSelectServico?.(servico)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {servico.nome}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {servico.transportadora}
                      </p>
                      {servico.descricao && (
                        <p className="text-xs text-gray-500 mt-1">
                          {servico.descricao}
                        </p>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-pink-600">
                        {formatCurrency(servico.preco)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {servico.prazo_entrega}{' '}
                        {servico.prazo_entrega === 1 ? 'dia útil' : 'dias úteis'}
                      </p>
                    </div>
                  </div>

                  {onSelectServico && (
                    <div className="mt-3 pt-3 border-t">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectServico(servico);
                        }}
                      >
                        Selecionar este serviço
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nenhum serviço encontrado */}
        {cotacoes && cotacoes.servicos && cotacoes.servicos.length === 0 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
            <p className="font-semibold">Nenhum serviço disponível</p>
            <p className="text-sm">
              Não foi possível encontrar opções de frete para este endereço.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
