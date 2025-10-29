/**
 * Modal de Rastreamento de Pedido
 * Exibe histórico completo de movimentações do envio
 */

"use client";

import React, { useEffect } from 'react';
import { useRastreamento } from '@/hooks/useEnvioecom';
import type { EventoRastreio } from '@/types/envioecom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RastreamentoModalProps {
  codigoRastreio: string;
  onClose: () => void;
}

export function RastreamentoModal({ codigoRastreio, onClose }: RastreamentoModalProps) {
  const { rastrear, rastreio, isLoading, isError, error } = useRastreamento();

  useEffect(() => {
    if (codigoRastreio) {
      rastrear(codigoRastreio);
    }
  }, [codigoRastreio, rastrear]);

  const formatDateTime = (data: string, hora: string) => {
    return `${data} às ${hora}`;
  };

  const getStatusColor = (entregue: boolean, status: string) => {
    if (entregue) return 'bg-green-100 text-green-800 border-green-300';
    if (status.toLowerCase().includes('transporte')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (status.toLowerCase().includes('aguardando')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <Card className="border-0 shadow-none">
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Rastreamento de Pedido</CardTitle>
                <CardDescription className="mt-1">
                  Código: {codigoRastreio}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <svg
                  className="animate-spin h-10 w-10 text-pink-600"
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
                <p className="mt-4 text-gray-600">Buscando informações...</p>
              </div>
            )}

            {isError && error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                <p className="font-semibold">Erro ao rastrear pedido:</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {rastreio && (
              <div className="space-y-6">
                {/* Status Atual */}
                <div
                  className={`p-4 rounded-lg border-2 ${getStatusColor(
                    rastreio.entregue,
                    rastreio.status_atual
                  )}`}
                >
                  <div className="flex items-center gap-3">
                    {rastreio.entregue ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                        />
                      </svg>
                    )}
                    <div>
                      <p className="font-bold text-lg">{rastreio.status_atual}</p>
                      <p className="text-sm opacity-80">
                        Atualizado em {rastreio.ultima_atualizacao}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Histórico de Eventos */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Histórico de Movimentação</h3>

                  <div className="relative">
                    {/* Linha vertical */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                    {/* Eventos */}
                    <div className="space-y-6">
                      {rastreio.eventos.map((evento: EventoRastreio, index: number) => (
                        <div key={index} className="relative pl-10">
                          {/* Bolinha na linha */}
                          <div
                            className={`absolute left-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${
                              index === 0 ? 'bg-pink-600' : 'bg-gray-400'
                            }`}
                          >
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>

                          {/* Conteúdo do evento */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="font-semibold text-gray-900">{evento.status}</p>
                            <p className="text-sm text-gray-600 mt-1">{evento.descricao}</p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                              <span>{formatDateTime(evento.data, evento.hora)}</span>
                              {evento.local && <span>• {evento.local}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
