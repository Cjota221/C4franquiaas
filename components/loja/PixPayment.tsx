/**
 * Componente: Pagamento PIX
 * 
 * Mostra QR Code, código copia-e-cola, timer e faz polling do status
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, Clock, QrCode as QrCodeIcon } from 'lucide-react';

interface PixPaymentData {
  qrCode: string; // Código do QR
  qrCodeBase64: string; // Imagem base64
  copyPasteCode: string; // Código copia-e-cola
  expirationDate: string; // Data de expiração
  paymentId: string; // ID do pagamento para polling
  external_reference: string;
}

interface PixPaymentProps {
  pixData: PixPaymentData;
  onPaymentConfirmed: () => void;
  onPaymentExpired: () => void;
}

export default function PixPayment({ 
  pixData, 
  onPaymentConfirmed,
  onPaymentExpired 
}: PixPaymentProps) {
  
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isChecking, setIsChecking] = useState(false);

  // Calcular tempo restante
  useEffect(() => {
    const expirationTime = new Date(pixData.expirationDate).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, expirationTime - now);
      
      setTimeRemaining(Math.floor(remaining / 1000)); // Em segundos
      
      if (remaining <= 0) {
        clearInterval(interval);
        onPaymentExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pixData.expirationDate, onPaymentExpired]);

  // Polling do status do pagamento
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (isChecking) return;

      setIsChecking(true);
      
      try {
        const response = await fetch(`/api/mp-payment-status?paymentId=${pixData.paymentId}`);
        const data = await response.json();
        
        if (data.status === 'approved') {
          clearInterval(pollInterval);
          onPaymentConfirmed();
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      } finally {
        setIsChecking(false);
      }
    }, 3000); // Verifica a cada 3 segundos

    return () => clearInterval(pollInterval);
  }, [pixData.paymentId, onPaymentConfirmed, isChecking]);

  // Copiar código PIX
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pixData.copyPasteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
      alert('Erro ao copiar código. Tente selecionar e copiar manualmente.');
    }
  };

  // Formatar tempo (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      
      {/* Cabeçalho */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
          <QrCodeIcon className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          Pague com PIX
        </h3>
        <p className="text-sm text-gray-600">
          Escaneie o QR Code ou copie o código abaixo
        </p>
      </div>

      {/* Timer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            Tempo restante para pagar:
          </span>
        </div>
        <span className="text-lg font-mono font-bold text-blue-600">
          {formatTime(timeRemaining)}
        </span>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
          {pixData.qrCodeBase64 ? (
            <img 
              src={`data:image/png;base64,${pixData.qrCodeBase64}`}
              alt="QR Code PIX"
              className="w-64 h-64"
            />
          ) : (
            <div className="w-64 h-64 bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500">Gerando QR Code...</p>
            </div>
          )}
        </div>
      </div>

      {/* Código Copia-e-Cola */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Ou copie o código PIX:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={pixData.copyPasteCode}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
          />
          <button
            onClick={handleCopyCode}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2
              ${copied 
                ? 'bg-green-600 text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h4 className="font-semibold text-gray-900 text-sm">Como pagar:</h4>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>Abra o app do seu banco</li>
          <li>Escolha pagar com PIX</li>
          <li>Escaneie o QR Code ou cole o código</li>
          <li>Confirme o pagamento</li>
        </ol>
        <p className="text-xs text-gray-500 mt-3">
          ⚡ A confirmação é automática e instantânea
        </p>
      </div>

      {/* Status */}
      {isChecking && (
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 text-sm text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Verificando pagamento...
          </div>
        </div>
      )}
    </div>
  );
}
