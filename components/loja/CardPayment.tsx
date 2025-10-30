/**
 * Componente: Pagamento com Cartão de Crédito
 * 
 * Formulário seguro com tokenização do Mercado Pago
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Lock } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface CardPaymentProps {
  amount: number;
  publicKey: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  corPrimaria?: string; // Cor da franqueada
  payerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    docType: string;
    docNumber: string;
  };
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
  }>;
}

export default function CardPayment({
  amount,
  publicKey,
  onPaymentSuccess,
  onPaymentError,
  corPrimaria = '#DB1472', // Cor padrão
  payerInfo,
  items,
}: CardPaymentProps) {
  
  const [mpInstance, setMpInstance] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardBrand, setCardBrand] = useState<string>('');
  const [installments, setInstallments] = useState(1);
  const [availableInstallments, setAvailableInstallments] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expirationMonth: '',
    expirationYear: '',
    securityCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar Mercado Pago SDK
  useEffect(() => {
    if (!publicKey) {
      console.error('Public Key do Mercado Pago não configurada');
      return;
    }

    // Carregar SDK se ainda não estiver carregado
    if (!window.MercadoPago) {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => {
        const mp = new window.MercadoPago(publicKey);
        setMpInstance(mp);
        console.log('✅ Mercado Pago SDK inicializado');
      };
      document.body.appendChild(script);
    } else {
      const mp = new window.MercadoPago(publicKey);
      setMpInstance(mp);
    }
  }, [publicKey]);

  // Buscar opções de parcelamento
  const fetchInstallments = useCallback(async (bin: string, amount: number, paymentMethodId: string) => {
    if (!mpInstance) return;

    try {
      const response = await mpInstance.getInstallments({
        amount: amount.toString(),
        bin,
        paymentMethodId,
      });

      if (response && response[0]?.payer_costs) {
        setAvailableInstallments(response[0].payer_costs);
      }
    } catch (error) {
      console.error('Erro ao buscar parcelamento:', error);
    }
  }, [mpInstance]);

  // Identificar bandeira do cartão
  useEffect(() => {
    if (!mpInstance || formData.cardNumber.length < 6) {
      setCardBrand('');
      return;
    }

    const bin = formData.cardNumber.replace(/\s/g, '').substring(0, 6);
    
    mpInstance.getPaymentMethods({ bin })
      .then((response: any) => {
        if (response.results && response.results.length > 0) {
          const paymentMethod = response.results[0];
          setCardBrand(paymentMethod.id);
          
          // Buscar opções de parcelamento
          fetchInstallments(bin, amount, paymentMethod.id);
        }
      })
      .catch((error: any) => {
        console.error('Erro ao identificar bandeira:', error);
      });
  }, [formData.cardNumber, mpInstance, amount, fetchInstallments]);

  // Validar campos
  const validateFields = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 13) {
      newErrors.cardNumber = 'Número do cartão inválido';
    }

    if (!formData.cardholderName || formData.cardholderName.length < 3) {
      newErrors.cardholderName = 'Nome do titular é obrigatório';
    }

    if (!formData.expirationMonth || !formData.expirationYear) {
      newErrors.expiration = 'Data de validade inválida';
    }

    if (!formData.securityCode || formData.securityCode.length < 3) {
      newErrors.securityCode = 'CVV inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Processar pagamento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFields() || !mpInstance) {
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Criar token do cartão
      const cardToken = await mpInstance.createCardToken({
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        cardholderName: formData.cardholderName,
        cardExpirationMonth: formData.expirationMonth,
        cardExpirationYear: formData.expirationYear,
        securityCode: formData.securityCode,
        identificationType: payerInfo.docType,
        identificationNumber: payerInfo.docNumber,
      });

      console.log('✅ Token do cartão criado:', cardToken.id);

      // 2. Enviar para o backend processar pagamento
      const response = await fetch('/api/mp-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'credit_card',
          amount,
          description: `Compra - ${items.map(i => i.title).join(', ')}`,
          token: cardToken.id,
          installments,
          payer: {
            email: payerInfo.email,
            firstName: payerInfo.firstName,
            lastName: payerInfo.lastName,
            identification: {
              type: payerInfo.docType,
              number: payerInfo.docNumber,
            },
          },
          items,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Erro ao processar pagamento');
      }

      if (result.status === 'approved') {
        onPaymentSuccess(result.paymentId);
      } else if (result.status === 'rejected') {
        onPaymentError(result.message || 'Pagamento recusado');
      } else {
        onPaymentError('Pagamento pendente de aprovação');
      }

    } catch (error) {
      console.error('❌ Erro no pagamento:', error);
      onPaymentError(error instanceof Error ? error.message : 'Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  // Formatar número do cartão
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16) {
      setFormData({ ...formData, cardNumber: formatCardNumber(value) });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${corPrimaria}20` }}
        >
          <CreditCard className="w-6 h-6" style={{ color: corPrimaria }} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Cartão de Crédito</h3>
          <p className="text-sm text-gray-600">Pagamento seguro via Mercado Pago</p>
        </div>
      </div>

      {/* Número do Cartão */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número do Cartão
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.cardNumber}
            onChange={handleCardNumberChange}
            placeholder="0000 0000 0000 0000"
            className={`
              w-full px-4 py-3 border rounded-lg pr-12
              ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'}
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
            `}
          />
          {cardBrand && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="text-xs font-semibold text-gray-600 uppercase">
                {cardBrand}
              </span>
            </div>
          )}
        </div>
        {errors.cardNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
        )}
      </div>

      {/* Nome do Titular */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Titular
        </label>
        <input
          type="text"
          value={formData.cardholderName}
          onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value.toUpperCase() })}
          placeholder="COMO ESTÁ NO CARTÃO"
          className={`
            w-full px-4 py-3 border rounded-lg
            ${errors.cardholderName ? 'border-red-500' : 'border-gray-300'}
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
          `}
        />
        {errors.cardholderName && (
          <p className="mt-1 text-sm text-red-600">{errors.cardholderName}</p>
        )}
      </div>

      {/* Validade e CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Validade
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.expirationMonth}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 2) setFormData({ ...formData, expirationMonth: val });
              }}
              placeholder="MM"
              maxLength={2}
              className={`
                w-full px-4 py-3 border rounded-lg text-center
                ${errors.expiration ? 'border-red-500' : 'border-gray-300'}
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
              `}
            />
            <span className="text-2xl text-gray-400">/</span>
            <input
              type="text"
              value={formData.expirationYear}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 2) setFormData({ ...formData, expirationYear: val });
              }}
              placeholder="AA"
              maxLength={2}
              className={`
                w-full px-4 py-3 border rounded-lg text-center
                ${errors.expiration ? 'border-red-500' : 'border-gray-300'}
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
              `}
            />
          </div>
          {errors.expiration && (
            <p className="mt-1 text-sm text-red-600">{errors.expiration}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CVV
          </label>
          <input
            type="text"
            value={formData.securityCode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              if (val.length <= 4) setFormData({ ...formData, securityCode: val });
            }}
            placeholder="123"
            maxLength={4}
            className={`
              w-full px-4 py-3 border rounded-lg text-center
              ${errors.securityCode ? 'border-red-500' : 'border-gray-300'}
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
            `}
          />
          {errors.securityCode && (
            <p className="mt-1 text-sm text-red-600">{errors.securityCode}</p>
          )}
        </div>
      </div>

      {/* Parcelamento */}
      {availableInstallments.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parcelamento
          </label>
          <select
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {availableInstallments.map((option) => (
              <option key={option.installments} value={option.installments}>
                {option.recommended_message}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Aviso de Segurança */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-green-800">
          <p className="font-semibold mb-1">Pagamento 100% seguro</p>
          <p className="text-green-700">
            Seus dados são criptografados e processados pelo Mercado Pago
          </p>
        </div>
      </div>

      {/* Botão de Pagamento */}
      <button
        type="submit"
        disabled={isProcessing}
        className="w-full py-4 rounded-lg font-bold text-white transition-all"
        style={{ 
          backgroundColor: isProcessing ? '#9ca3af' : corPrimaria,
          cursor: isProcessing ? 'not-allowed' : 'pointer'
        }}
        onMouseEnter={(e) => {
          if (!isProcessing) {
            e.currentTarget.style.backgroundColor = `${corPrimaria}dd`;
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isProcessing) {
            e.currentTarget.style.backgroundColor = corPrimaria;
            e.currentTarget.style.boxShadow = '';
          }
        }}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processando...
          </span>
        ) : (
          `Pagar R$ ${amount.toFixed(2).replace('.', ',')}`
        )}
      </button>
    </form>
  );
}
