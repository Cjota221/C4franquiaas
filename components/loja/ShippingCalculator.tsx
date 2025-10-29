/**
 * Calculadora de Frete
 * Design: Campo CEP + Botão OK + Resultados
 * Integração com API de frete
 */

"use client";

import React, { useState } from 'react';
import { Truck, Loader2, MapPin } from 'lucide-react';

interface FreteOpcao {
  servico: string;
  prazo: string;
  valor: number;
}

interface ShippingCalculatorProps {
  produtoId: string;
  onFreteCalculado?: (opcoes: FreteOpcao[]) => void;
  className?: string;
  corPrimaria?: string;
}

export function ShippingCalculator({
  produtoId,
  onFreteCalculado,
  className = '',
  corPrimaria = '#DB1472',
}: ShippingCalculatorProps) {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [opcoes, setOpcoes] = useState<FreteOpcao[]>([]);
  const [error, setError] = useState('');

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCep(formatted);
    setError('');
  };

  const handleCalcularFrete = async () => {
    // Validar CEP
    const cepNumeros = cep.replace(/\D/g, '');
    if (cepNumeros.length !== 8) {
      setError('CEP inválido. Digite 8 dígitos.');
      return;
    }

    setLoading(true);
    setError('');
    setOpcoes([]);

    try {
      // TODO: Integrar com API real de frete (Envioecom, Correios, etc)
      const response = await fetch(`/api/calcular-frete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep: cepNumeros,
          produtoId,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao calcular frete');
      }

      const data = await response.json();
      setOpcoes(data.opcoes || []);
      onFreteCalculado?.(data.opcoes || []);
    } catch (err) {
      setError('Não foi possível calcular o frete. Tente novamente.');
      console.error('Erro ao calcular frete:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className={`border-2 border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-5 h-5" style={{ color: corPrimaria }} />
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Calcular Frete
        </h3>
      </div>

      {/* Input CEP + Botão */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={cep}
            onChange={handleCEPChange}
            placeholder="00000-000"
            maxLength={9}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-full focus:outline-none transition-colors"
            style={{
              borderColor: cep ? corPrimaria : undefined,
            }}
          />
        </div>
        <button
          onClick={handleCalcularFrete}
          disabled={loading || cep.replace(/\D/g, '').length !== 8}
          className="px-6 py-3 text-white font-semibold rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          style={{
            backgroundColor: loading || cep.replace(/\D/g, '').length !== 8 ? undefined : corPrimaria,
          }}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'OK'
          )}
        </button>
      </div>

      {/* Erro */}
      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}

      {/* Resultados */}
      {opcoes.length > 0 && (
        <div className="space-y-2">
          {opcoes.map((opcao, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-semibold text-gray-900">{opcao.servico}</p>
                <p className="text-sm text-gray-600">
                  Entrega em até {opcao.prazo}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  {opcao.valor === 0 ? 'GRÁTIS' : formatPrice(opcao.valor)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link "Não sei meu CEP" */}
      <a
        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 text-sm text-gray-600 hover:text-black underline inline-block"
      >
        Não sei meu CEP
      </a>
    </div>
  );
}
