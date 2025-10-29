/**
 * Bloco de Preço com Hierarquia Visual
 * - Preço à vista em destaque (grande, bold)
 * - Preço parcelado secundário (menor)
 * - Layout limpo e claro
 */

"use client";

import React from 'react';

interface PriceBlockProps {
  precoVista: number;
  parcelamento?: {
    parcelas: number;
    valor: number;
    total?: number;
  };
  className?: string;
}

export function PriceBlock({ precoVista, parcelamento, className = '' }: PriceBlockProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Preço Principal (À Vista) */}
      <div className="flex items-baseline gap-2">
        <span className="text-4xl md:text-5xl font-bold text-gray-900">
          {formatPrice(precoVista)}
        </span>
        <span className="text-lg text-gray-600 font-normal">
          à vista
        </span>
      </div>

      {/* Preço Parcelado (Secundário) */}
      {parcelamento && parcelamento.parcelas > 1 && (
        <p className="text-base text-gray-600">
          ou{' '}
          <span className="font-semibold text-gray-900">
            {parcelamento.parcelas}x
          </span>
          {' '}de{' '}
          <span className="font-semibold text-gray-900">
            {formatPrice(parcelamento.valor)}
          </span>
        </p>
      )}
    </div>
  );
}
