/**
 * Calculadora de Frete
 * Design: Campo CEP + Botão OK + Resultados
 * Integração com API de frete
 */

"use client";

import React, { useState } from 'react';
import { Truck, Loader2, MapPin } from 'lucide-react';
import { useParams } from 'next/navigation';

interface FreteOpcao {
  nome: string;
  valor: number;
  prazo: string;
  codigo: string;
  transportadora: string;
  servico_id?: string;
}

interface MelhorEnvioCotacao {
  id: number;
  name: string;
  price: number;
  delivery_time: number;
  company: {
    id: number;
    name: string;
    picture: string;
  };
}

interface ShippingCalculatorProps {
  produtoId?: string;
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
  const params = useParams();
  const dominio = params.dominio as string;
  
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
      console.log('[ShippingCalculator] 🚀 Calculando frete:', { cep: cepNumeros, dominio });

      // Usar nova API do Melhor Envio com validação de CEP
      const response = await fetch(`/api/shipping/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: {
            postal_code: cepNumeros,
          },
          from: {
            postal_code: '13560340', // CEP padrão de origem
          },
          package: {
            height: 10, // cm
            width: 15,  // cm
            length: 20, // cm
            weight: 0.5 // kg
          },
          options: {
            insurance_value: 50,
            receipt: false,
            own_hand: false
          }
        }),
      });

      console.log('[ShippingCalculator] 📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[ShippingCalculator] ❌ Erro na API:', errorData);
        throw new Error(errorData.error || 'Erro ao calcular frete');
      }

      const data = await response.json();
      console.log('[ShippingCalculator] ✅ Dados recebidos:', data);

      // Verificar se a resposta tem o formato esperado
      if (!data.success || !data.quotes || !Array.isArray(data.quotes)) {
        console.error('[ShippingCalculator] ❌ Formato de resposta inválido:', data);
        throw new Error(data.error || 'Formato de resposta inválido');
      }

      console.log('[ShippingCalculator] 📦 Total de cotações:', data.quotes.length);

      // Converter formato da API nova para o formato esperado
      const opcoesFormatadas = data.quotes.map((cotacao: MelhorEnvioCotacao) => ({
        nome: cotacao.name,
        valor: cotacao.price,
        prazo: `${cotacao.delivery_time} dias úteis`,
        codigo: cotacao.id.toString(),
        transportadora: cotacao.company.name,
        servico_id: cotacao.id.toString()
      }));

      console.log('[ShippingCalculator] ✅ Opções formatadas:', opcoesFormatadas.length);

      setOpcoes(opcoesFormatadas);
      onFreteCalculado?.(opcoesFormatadas);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Não foi possível calcular o frete. Tente novamente.';
      setError(errorMessage);
      console.error('[ShippingCalculator] ❌ Erro ao calcular frete:', err);
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
                <p className="font-semibold text-gray-900">
                  {opcao.nome}
                  {opcao.transportadora && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({opcao.transportadora})
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  {opcao.prazo}
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
