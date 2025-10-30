/**
 * Componente: Seletor de Método de Pagamento
 * 
 * Permite escolher entre PIX e Cartão de Crédito
 */

'use client';

import React from 'react';
import { CreditCard, QrCode } from 'lucide-react';

export type PaymentMethodType = 'pix' | 'credit_card';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType | null;
  onSelectMethod: (method: PaymentMethodType) => void;
  corPrimaria?: string; // Cor da franqueada
}

export default function PaymentMethodSelector({ 
  selectedMethod, 
  onSelectMethod,
  corPrimaria = '#DB1472' // Cor padrão rosa
}: PaymentMethodSelectorProps) {
  
  const methods = [
    {
      id: 'pix' as PaymentMethodType,
      name: 'PIX',
      icon: QrCode,
      description: 'Pagamento instantâneo',
      badge: 'Aprovação imediata',
    },
    {
      id: 'credit_card' as PaymentMethodType,
      name: 'Cartão de Crédito',
      icon: CreditCard,
      description: 'Parcelamento disponível',
      badge: 'Em até 12x',
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">
        Escolha a forma de pagamento
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          
          return (
            <button
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={`
                relative p-6 rounded-lg border-2 transition-all
                hover:shadow-lg hover:scale-105
                ${isSelected 
                  ? 'shadow-md' 
                  : 'border-gray-200 bg-white'
                }
              `}
              style={isSelected ? {
                borderColor: corPrimaria,
                backgroundColor: `${corPrimaria}10` // 10% opacidade
              } : {}}
            >
              {/* Badge */}
              <div className="absolute top-2 right-2">
                <span 
                  className="text-xs px-2 py-1 rounded-full font-semibold"
                  style={isSelected ? {
                    backgroundColor: corPrimaria,
                    color: 'white'
                  } : {
                    backgroundColor: '#F3F4F6',
                    color: '#6B7280'
                  }}
                >
                  {method.badge}
                </span>
              </div>

              {/* Ícone */}
              <div 
                className="mb-3 flex items-center justify-center w-16 h-16 rounded-full mx-auto"
                style={isSelected ? {
                  backgroundColor: corPrimaria
                } : {
                  backgroundColor: '#F3F4F6'
                }}
              >
                <Icon 
                  className="w-8 h-8"
                  style={{ color: isSelected ? 'white' : '#6B7280' }}
                />
              </div>

              {/* Nome */}
              <h4 className="text-lg font-bold mb-1 text-gray-900">
                {method.name}
              </h4>

              {/* Descrição */}
              <p className="text-sm text-gray-600">
                {method.description}
              </p>

              {/* Indicador de seleção */}
              {isSelected && (
                <div className="mt-4 flex items-center justify-center">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: corPrimaria }}
                  >
                    <svg 
                      className="w-4 h-4 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={3} 
                        d="M5 13l4 4L19 7" 
                      />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
