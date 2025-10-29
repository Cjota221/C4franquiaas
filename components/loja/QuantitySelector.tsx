/**
 * Seletor de Quantidade Moderno
 * Design: Botões (-) e (+) com valor no centro
 */

"use client";

import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
  className = '',
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <button
        onClick={handleDecrease}
        disabled={quantity <= min}
        className="p-3 rounded-l-lg border-2 border-r-0 border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
        aria-label="Diminuir quantidade"
      >
        <Minus className="w-5 h-5 text-gray-700" />
      </button>

      <div className="flex-1 min-w-[60px] text-center py-3 border-2 border-gray-300 bg-white font-semibold text-gray-900">
        {quantity}
      </div>

      <button
        onClick={handleIncrease}
        disabled={quantity >= max}
        className="p-3 rounded-r-lg border-2 border-l-0 border-gray-300 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
        aria-label="Aumentar quantidade"
      >
        <Plus className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  );
}
