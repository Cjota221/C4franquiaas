"use client";

import { useState } from 'react';
import { Truck, Loader2, MapPin, AlertCircle } from 'lucide-react';


interface FreteOpcao {
  id: number;
  nome: string;
  preco: number;
  prazo: number;
  logo: string;
  servico_id: string;
}

interface QuoteData {
  id: number;
  name: string;
  price: string | number;
  delivery_time: number;
  company?: {
    picture?: string;
  };
}

interface CheckoutShippingSelectorProps {
  onSelectShipping: (opcao: FreteOpcao | null) => void;
  selectedShipping: FreteOpcao | null;
  corPrimaria?: string;
}

export default function CheckoutShippingSelector({ 
  onSelectShipping, 
  selectedShipping,
  corPrimaria = '#DB1472'
}: CheckoutShippingSelectorProps) {
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
    // Limpar seleção se mudar CEP
    if (selectedShipping) {
      onSelectShipping(null);
      setOpcoes([]);
    }
  };

  const handleCalcularFrete = async () => {
    const cepNumeros = cep.replace(/\D/g, '');
    if (cepNumeros.length !== 8) {
      setError('CEP inválido. Digite 8 dígitos.');
      return;
    }

    setLoading(true);
    setError('');
    setOpcoes([]);
    onSelectShipping(null);

    try {
      const response = await fetch(`/api/shipping/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: { postal_code: cepNumeros },
          from: { postal_code: '13560340' },
          package: {
            height: 10,
            width: 15,
            length: 20,
            weight: 0.5
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao calcular frete');
      }

      const data = await response.json();

      if (!data.success || !Array.isArray(data.quotes)) {
        throw new Error('Formato de resposta inválido');
      }

      const opcoesFormatadas: FreteOpcao[] = data.quotes.map((cotacao: QuoteData) => ({
        id: cotacao.id,
        nome: cotacao.name,
        preco: typeof cotacao.price === 'string' ? parseFloat(cotacao.price) : cotacao.price,
        prazo: cotacao.delivery_time,
        logo: cotacao.company?.picture || '',
        servico_id: cotacao.id.toString()
      }));

      setOpcoes(opcoesFormatadas);

      // Auto-selecionar a opção mais barata
      if (opcoesFormatadas.length > 0) {
        const maisBarata = opcoesFormatadas.reduce((prev, current) => 
          prev.preco < current.preco ? prev : current
        );
        onSelectShipping(maisBarata);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Não foi possível calcular o frete. Tente novamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <Truck className="w-6 h-6" style={{ color: corPrimaria }} />
        <h3 className="text-lg font-semibold text-gray-900">Frete e Entrega</h3>
      </div>

      {/* Campo de CEP */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          CEP de Entrega
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={cep}
            onChange={handleCEPChange}
            onKeyPress={(e) => e.key === 'Enter' && handleCalcularFrete()}
            placeholder="00000-000"
            maxLength={9}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all text-lg"
            style={{ 
              borderColor: error ? '#EF4444' : undefined
            }}
          />
          <button
            type="button"
            onClick={handleCalcularFrete}
            disabled={loading}
            className="px-6 py-3 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: corPrimaria }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Calcular'
            )}
          </button>
        </div>
        {error && (
          <div className="mt-2 flex items-start gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Opções de Frete */}
      {opcoes.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">
            Selecione a forma de entrega:
          </p>
          {opcoes.map((opcao) => (
            <label
              key={opcao.id}
              className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedShipping?.id === opcao.id
                  ? 'border-current shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{
                borderColor: selectedShipping?.id === opcao.id ? corPrimaria : undefined,
                backgroundColor: selectedShipping?.id === opcao.id ? `${corPrimaria}10` : 'white'
              }}
            >
              <input
                type="radio"
                name="shipping"
                checked={selectedShipping?.id === opcao.id}
                onChange={() => onSelectShipping(opcao)}
                className="sr-only"
              />
              <div className="flex items-center gap-3 flex-1">
                {opcao.logo && (
                  <img src={opcao.logo} alt={opcao.nome} className="w-12 h-12 object-contain" />
                )}
                <div>
                  <p className="font-semibold text-gray-900">{opcao.nome}</p>
                  <p className="text-sm text-gray-600">
                    Entrega em {opcao.prazo} {opcao.prazo === 1 ? 'dia útil' : 'dias úteis'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: corPrimaria }}>
                  R$ {opcao.preco.toFixed(2)}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Mensagem quando não há opções */}
      {!loading && opcoes.length === 0 && !error && cep.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Digite seu CEP para calcular o frete</p>
        </div>
      )}
    </div>
  );
}

