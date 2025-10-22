"use client";

import React from 'react';

export interface Variacao {
  id: string | null;
  sku: string | null;
  estoque: number;
  codigo_barras: string | null;
}

interface SeletorVariacoesProps {
  variacoes: Variacao[];
  variacaoSelecionada: string | null;
  onSelecionar: (variacaoId: string | null) => void;
}

export default function SeletorVariacoes({
  variacoes,
  variacaoSelecionada,
  onSelecionar
}: SeletorVariacoesProps) {
  // Se não houver variações, não renderizar nada
  if (!variacoes || variacoes.length === 0) {
    return null;
  }

  // Extrair tamanhos dos SKUs ou IDs
  const getTamanho = (variacao: Variacao): string => {
    if (variacao.sku) {
      // Tentar extrair número do SKU (ex: "34", "35", etc)
      const match = variacao.sku.match(/\b(\d{2})\b/);
      if (match) return match[1];
    }
    if (variacao.id) {
      const match = String(variacao.id).match(/\b(\d{2})\b/);
      if (match) return match[1];
    }
    return 'N/A';
  };

  // Ordenar variações por tamanho
  const variacoesOrdenadas = [...variacoes].sort((a, b) => {
    const tamA = parseInt(getTamanho(a));
    const tamB = parseInt(getTamanho(b));
    if (isNaN(tamA)) return 1;
    if (isNaN(tamB)) return -1;
    return tamA - tamB;
  });

  return (
    <div className="mb-6">
      <label className="block text-sm font-bold text-gray-800 mb-3">
        Selecione o Tamanho:
      </label>
      
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {variacoesOrdenadas.map((variacao, index) => {
          const tamanho = getTamanho(variacao);
          const estaDisponivel = variacao.estoque > 0;
          const estaSelecionado = variacao.id === variacaoSelecionada;

          return (
            <button
              key={variacao.id || index}
              onClick={() => {
                if (estaDisponivel) {
                  onSelecionar(estaSelecionado ? null : variacao.id);
                }
              }}
              disabled={!estaDisponivel}
              className={`
                relative py-3 px-2 rounded-lg font-bold text-center transition-all
                ${estaSelecionado 
                  ? 'bg-[#F8B81F] text-white ring-4 ring-[#F8B81F]/50 shadow-lg scale-105' 
                  : estaDisponivel
                    ? 'bg-white text-gray-800 border-2 border-gray-300 hover:border-[#F8B81F] hover:shadow-md'
                    : 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed opacity-60'
                }
              `}
              title={
                !estaDisponivel 
                  ? 'Tamanho esgotado' 
                  : `Tamanho ${tamanho}${variacao.sku ? ` - SKU: ${variacao.sku}` : ''}`
              }
            >
              <div className="text-lg">{tamanho}</div>
              {!estaDisponivel && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-red-500 transform rotate-45"></div>
                  <div className="w-full h-0.5 bg-red-500 transform -rotate-45 absolute"></div>
                </div>
              )}
              {!estaDisponivel && (
                <div className="text-[10px] mt-1 text-red-600 font-semibold">
                  Esgotado
                </div>
              )}
            </button>
          );
        })}
      </div>

      {variacaoSelecionada && (
        <div className="mt-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            ✓ Tamanho selecionado: <span className="font-bold">{getTamanho(variacoesOrdenadas.find(v => v.id === variacaoSelecionada)!)}</span>
          </p>
        </div>
      )}

      {!variacaoSelecionada && (
        <p className="mt-3 text-sm text-gray-600 italic">
          ⚠️ Por favor, selecione um tamanho para adicionar ao carrinho
        </p>
      )}
    </div>
  );
}
