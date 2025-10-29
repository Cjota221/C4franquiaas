/**
 * Seletor de Tamanho Moderno
 * - Grid de botões (não dropdown)
 * - Estado visual do selecionado (borda destacada)
 * - Indicação de disponibilidade
 */

"use client";

import React from 'react';

interface Size {
  value: string;
  label: string;
  disponivel: boolean;
  estoque?: number;
}

interface SizeSelectorProps {
  sizes: Size[];
  selectedSize: string | null;
  onSizeSelect: (size: string) => void;
  className?: string;
  corPrimaria?: string;
}

export function SizeSelector({
  sizes,
  selectedSize,
  onSizeSelect,
  className = '',
  corPrimaria = '#DB1472',
}: SizeSelectorProps) {
  if (!sizes || sizes.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {/* Label */}
      <div className="mb-3">
        <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Escolha o tamanho:
        </span>
        {selectedSize && (
          <span className="ml-2 text-sm text-gray-600">
            {sizes.find(s => s.value === selectedSize)?.label}
          </span>
        )}
      </div>

      {/* Grid de Botões */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
        {sizes.map((size) => {
          const isSelected = size.value === selectedSize;
          return (
            <button
              key={size.value}
              onClick={() => size.disponivel && onSizeSelect(size.value)}
              disabled={!size.disponivel}
              className={`
                relative py-3 px-4 rounded-full border-2 font-semibold transition-all
                ${
                  !size.disponivel
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isSelected
                    ? 'text-white'
                    : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                }
              `}
              style={
                isSelected && size.disponivel
                  ? { borderColor: corPrimaria, backgroundColor: corPrimaria }
                  : undefined
              }
            >
              {size.label}
              
              {/* Indicador de Esgotado */}
              {!size.disponivel && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-gray-400 rotate-45" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Aviso de Seleção */}
      {!selectedSize && (
        <p className="mt-2 text-sm text-gray-500">
          Selecione um tamanho para continuar
        </p>
      )}
    </div>
  );
}
