'use client';

import { useState, useEffect, useCallback } from 'react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: unknown;
}

interface Company {
  name: string;
  id?: number;
}

interface Service {
  name: string;
  company: Company;
}

interface ShippingQuote {
  company: Company;
  name: string;
  price: string;
  delivery_time: number;
}

export default function DiagnosticoCompleto() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  const runAllTests = useCallback(async () => {
    setLoading(true);
    const tests: TestResult[] = [];

    // 1. Verificar configuração do banco
    tests.push(await testDatabaseConfig());

    // 2. Verificar variáveis de ambiente
    tests.push(await testEnvironmentVariables());

    // 3. Testar autenticação Melhor Envio
    tests.push(await testMelhorEnvioAuth());

    // 4. Testar API de carriers
    tests.push(await testCarriersAPI());

    // 5. Testar API de serviços
    tests.push(await testServicesAPI());

    // 6. Testar cálculo de frete
    tests.push(await testShippingCalculation());

    setResults(tests);
    setLoading(false);
  }, []);

  useEffect(() => {
    runAllTests();
  }, [runAllTests]);

  const testDatabaseConfig = async (): Promise<TestResult> => {
    try {
      const response = await fetch('/api/admin/melhorenvio/config');
      const data = await response.json();

      if (response.ok && data.config) {
        return {
          name: '1. Configuração no Banco de Dados',
          status: 'success',
          message: `Token encontrado (criado em ${new Date(data.config.created_at).toLocaleString('pt-BR')})`,
          details: {
            token_type: data.config.token_type,
            has_access_token: !!data.config.access_token,
            token_preview: data.config.access_token?.substring(0, 30) + '...'
          }
        };
      } else {
        return {
          name: '1. Configuração no Banco de Dados',
          status: 'error',
          message: data.error || 'Configuração não encontrada',
          details: data
        };
      }
    } catch (error: unknown) {
      return {
        name: '1. Configuração no Banco de Dados',
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  };

  const testEnvironmentVariables = async (): Promise<TestResult> => {
    const vars = {
      NEXT_PUBLIC_MELHORENVIO_CLIENT_ID: process.env.NEXT_PUBLIC_MELHORENVIO_CLIENT_ID,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_MELHORENVIO_SANDBOX: process.env.NEXT_PUBLIC_MELHORENVIO_SANDBOX,
    };

    const missing = Object.entries(vars).filter(([, value]) => !value);

    if (missing.length === 0) {
      return {
        name: '2. Variáveis de Ambiente',
        status: 'success',
        message: 'Todas as variáveis configuradas',
        details: vars
      };
    } else {
      return {
        name: '2. Variáveis de Ambiente',
        status: 'error',
        message: `${missing.length} variável(is) faltando: ${missing.map(([k]) => k).join(', ')}`,
        details: vars
      };
    }
  };

  const testMelhorEnvioAuth = async (): Promise<TestResult> => {
    try {
      const response = await fetch('/api/admin/melhorenvio/teste-auth');
      const data = await response.json();

      if (response.ok && data.authenticated) {
        return {
          name: '3. Autenticação Melhor Envio',
          status: 'success',
          message: `Autenticado como ${data.user?.firstname || 'Usuário'}`,
          details: data.user
        };
      } else {
        return {
          name: '3. Autenticação Melhor Envio',
          status: 'error',
          message: data.error || `Erro ${response.status}`,
          details: data
        };
      }
    } catch (error: unknown) {
      return {
        name: '3. Autenticação Melhor Envio',
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  };

  const testCarriersAPI = async (): Promise<TestResult> => {
    try {
      const response = await fetch('/api/admin/melhorenvio/companies');
      const data = await response.json();

      if (response.ok && data.companies) {
        return {
          name: '4. API de Transportadoras',
          status: 'success',
          message: `${data.companies.length} transportadoras disponíveis`,
          details: data.companies.map((c: Company) => c.name)
        };
      } else {
        return {
          name: '4. API de Transportadoras',
          status: 'error',
          message: data.error || `Erro ${response.status}`,
          details: data
        };
      }
    } catch (error: unknown) {
      return {
        name: '4. API de Transportadoras',
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  };

  const testServicesAPI = async (): Promise<TestResult> => {
    try {
      const response = await fetch('/api/admin/melhorenvio/services');
      const data = await response.json();

      if (response.ok && data.services) {
        return {
          name: '5. API de Serviços de Envio',
          status: 'success',
          message: `${data.services.length} serviços disponíveis`,
          details: data.services.map((s: Service) => `${s.name} (${s.company.name})`)
        };
      } else {
        return {
          name: '5. API de Serviços de Envio',
          status: 'error',
          message: data.error || `Erro ${response.status}`,
          details: data
        };
      }
    } catch (error: unknown) {
      return {
        name: '5. API de Serviços de Envio',
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  };

  const testShippingCalculation = async (): Promise<TestResult> => {
    try {
      const testPayload = {
        from: { postal_code: '01310-100' },
        to: { postal_code: '01310-100' },
        package: {
          weight: 0.3,
          width: 20,
          height: 10,
          length: 10
        }
      };

      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          name: '6. Cálculo de Frete',
          status: 'success',
          message: `${data.quotes?.length || 0} opções de frete encontradas`,
          details: data.quotes?.map((q: ShippingQuote) => ({
            company: q.company.name,
            service: q.name,
            price: `R$ ${q.price}`,
            delivery_time: `${q.delivery_time} dias`
          }))
        };
      } else {
        return {
          name: '6. Cálculo de Frete',
          status: 'error',
          message: data.error || `Erro ${response.status}`,
          details: data
        };
      }
    } catch (error: unknown) {
      return {
        name: '6. Cálculo de Frete',
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 border-green-500 text-green-900';
      case 'error': return 'bg-red-100 border-red-500 text-red-900';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      default: return 'bg-gray-100 border-gray-500 text-gray-900';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Diagnóstico Completo do Sistema
          </h1>
          <p className="text-gray-600">
            Acompanhe todos os testes em tempo real
          </p>
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {loading ? '🔄 Executando testes...' : '▶️ Executar Todos os Testes'}
          </button>

          <a
            href="/api/admin/melhorenvio/debug-log"
            target="_blank"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            📋 Ver Logs do Servidor
          </a>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`border-l-4 p-6 rounded-r-lg shadow-sm ${getStatusColor(result.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon(result.status)}</span>
                  <h3 className="font-bold text-lg">{result.name}</h3>
                </div>
                <span className="text-xs uppercase font-semibold px-2 py-1 rounded">
                  {result.status}
                </span>
              </div>

              <p className="text-sm mb-3">{result.message}</p>

              {result.details && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    📊 Ver Detalhes
                  </summary>
                  <pre className="bg-white bg-opacity-50 p-3 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}

          {loading && results.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Executando testes...</p>
            </div>
          )}
        </div>

        {!loading && results.length > 0 && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">📊 Resumo dos Testes</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded">
                <div className="text-3xl font-bold text-green-600">
                  {results.filter(r => r.status === 'success').length}
                </div>
                <div className="text-sm text-green-800">Sucessos</div>
              </div>
              <div className="p-4 bg-red-50 rounded">
                <div className="text-3xl font-bold text-red-600">
                  {results.filter(r => r.status === 'error').length}
                </div>
                <div className="text-sm text-red-800">Erros</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded">
                <div className="text-3xl font-bold text-yellow-600">
                  {results.filter(r => r.status === 'warning').length}
                </div>
                <div className="text-sm text-yellow-800">Avisos</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
