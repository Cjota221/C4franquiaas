/**
 * Título do Produto com Hierarquia Clara
 * Linha 1: Nome Principal (bold, grande)
 * Linha 2: Variante/Subtítulo (menor, normal)
 */

"use client";

import React from 'react';

interface ProductTitleProps {
  nome: string;
  variante?: string;
  className?: string;
}

export function ProductTitle({ nome, variante, className = '' }: ProductTitleProps) {
  return (
    <div className={`text-left ${className}`}>
      {/* Linha 1: Nome Principal */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
        {nome}
      </h1>
      
      {/* Linha 2: Variante/Subtítulo */}
      {variante && (
        <p className="text-base md:text-lg text-gray-600 mt-1 font-normal">
          {variante}
        </p>
      )}
    </div>
  );
}
