"use client";

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Package, Truck, DollarSign, RefreshCw } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  company: {
    id: number;
    name: string;
    picture: string;
  };
  price: string;
  delivery_time: number;
  currency: string;
}

interface Company {
  id: number;
  name: string;
  picture: string;
}

export default function MelhorEnvioTestPage() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dados para teste de cálculo de frete
  const [testCEP, setTestCEP] = useState('01310-100'); // Av. Paulista, SP
  const [testResult, setTestResult] = useState<Service[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Verificar autorização
  const checkAuthorization = async () => {
    try {
      const response = await fetch('/api/admin/melhorenvio/status');
      const data = await response.json();
      setIsAuthorized(data.authorized);
      
      if (!data.authorized) {
        setError('Não autorizado. Clique em "Autorizar Melhor Envio" primeiro.');
      }
    } catch (err) {
      setError('Erro ao verificar autorização');
      setIsAuthorized(false);
    }
  };

  // Buscar transportadoras
  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/melhorenvio/companies');
      const data = await response.json();
      
      if (data.success && data.companies) {
        setCompanies(data.companies);
      } else {
        setError(data.error || 'Erro ao buscar transportadoras');
      }
    } catch (err) {
      setError('Erro ao buscar transportadoras');
    }
  };

  // Buscar serviços disponíveis
  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/melhorenvio/services');
      const data = await response.json();
      
      if (data.success && data.services) {
        setServices(data.services);
      } else {
        setError(data.error || 'Erro ao buscar serviços');
      }
    } catch (err) {
      setError('Erro ao buscar serviços');
    }
  };

  // Testar cálculo de frete
  const testShippingCalculation = async () => {
    if (!testCEP) {
      alert('Digite um CEP para teste');
      return;
    }

    setIsCalculating(true);
    setTestResult([]);

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: {
            postal_code: testCEP.replace(/\D/g, '')
          },
          from: {
            postal_code: '13560340' // CEP de origem padrão (altere conforme sua loja)
          },
          package: {
            weight: 1, // 1kg
            width: 20,
            height: 10,
            length: 30
          }
        })
      });

      const data = await response.json();
      
      if (data.success && data.quotes) {
        setTestResult(data.quotes);
      } else {
        alert(data.error || 'Erro ao calcular frete');
      }
    } catch (err) {
      alert('Erro ao calcular frete');
    } finally {
      setIsCalculating(false);
    }
  };

  // Carregar tudo ao montar
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await checkAuthorization();
      await fetchCompanies();
      await fetchServices();
      setIsLoading(false);
    };
    
    loadAll();
     
  }, []);

  const reload = () => {
    setIsLoading(true);
    setError('');
    checkAuthorization();
    fetchCompanies();
    fetchServices();
    setIsLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Testes - Melhor Envio
          </h1>
          <p className="text-gray-600">
            Verifique a integração e veja as transportadoras disponíveis
          </p>
        </div>

        <button
          onClick={reload}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Recarregar
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          ❌ {error}
        </div>
      )}

      {/* Status de Autorização */}
      <div className="mb-6 p-6 bg-white rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Status da Autorização
        </h2>
        
        {isAuthorized === null ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            Verificando...
          </div>
        ) : isAuthorized ? (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <CheckCircle className="w-5 h-5" />
            ✅ Autorizado e conectado com Melhor Envio
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-600 font-medium">
            <XCircle className="w-5 h-5" />
            ❌ Não autorizado
          </div>
        )}
      </div>

      {/* Transportadoras Disponíveis */}
      <div className="mb-6 p-6 bg-white rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Transportadoras Disponíveis ({companies.length})
        </h2>

        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            Carregando transportadoras...
          </div>
        ) : companies.length === 0 ? (
          <p className="text-gray-500">Nenhuma transportadora encontrada.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex flex-col items-center p-4 border rounded-lg hover:shadow-lg transition-shadow"
              >
                <img
                  src={company.picture}
                  alt={company.name}
                  className="w-16 h-16 object-contain mb-2"
                />
                <span className="text-sm font-medium text-center">
                  {company.name}
                </span>
                <span className="text-xs text-gray-500">ID: {company.id}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Serviços Disponíveis */}
      <div className="mb-6 p-6 bg-white rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Serviços de Envio ({services.length})
        </h2>

        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            Carregando serviços...
          </div>
        ) : services.length === 0 ? (
          <p className="text-gray-500">Nenhum serviço encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Serviço</th>
                  <th className="px-4 py-2 text-left">Transportadora</th>
                  <th className="px-4 py-2 text-left">Logo</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{service.id}</td>
                    <td className="px-4 py-2 font-medium">{service.name}</td>
                    <td className="px-4 py-2">{service.company.name}</td>
                    <td className="px-4 py-2">
                      <img
                        src={service.company.picture}
                        alt={service.company.name}
                        className="w-12 h-12 object-contain"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Teste de Cálculo de Frete */}
      <div className="p-6 bg-white rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Testar Cálculo de Frete
        </h2>

        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={testCEP}
            onChange={(e) => setTestCEP(e.target.value)}
            placeholder="CEP de destino (ex: 01310-100)"
            className="flex-1 px-4 py-2 border rounded-lg"
            maxLength={9}
          />
          <button
            onClick={testShippingCalculation}
            disabled={isCalculating}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Calculando...
              </>
            ) : (
              'Calcular Frete'
            )}
          </button>
        </div>

        {testResult.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Resultados:</h3>
            <div className="space-y-2">
              {testResult.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <img
                      src={quote.company.picture}
                      alt={quote.company.name}
                      className="w-12 h-12 object-contain"
                    />
                    <div>
                      <p className="font-medium">{quote.name}</p>
                      <p className="text-sm text-gray-500">{quote.company.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      R$ {quote.price}
                    </p>
                    <p className="text-sm text-gray-500">
                      {quote.delivery_time} dias úteis
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
