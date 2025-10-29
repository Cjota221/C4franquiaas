/**
 * Botão de Compra (CTA Principal)
 * Design: Preto, uppercase, largura total
 * Estados: loading, disabled
 */

"use client";

import React from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';

interface BuyButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  text?: string;
  className?: string;
}

export function BuyButton({
  onClick,
  disabled = false,
  loading = false,
  text = 'ADICIONAR AO CARRINHO',
  className = '',
}: BuyButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        w-full py-4 px-6 rounded-lg
        bg-black text-white
        font-bold text-base uppercase tracking-wide
        flex items-center justify-center gap-3
        transition-all duration-200
        hover:bg-gray-800
        disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500
        ${className}
      `}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>PROCESSANDO...</span>
        </>
      ) : (
        <>
          <ShoppingBag className="w-5 h-5" />
          <span>{text}</span>
        </>
      )}
    </button>
  );
}
