"use client";

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader2, Copy, RefreshCw } from 'lucide-react';

interface DebugCheck {
  name: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
  fix?: string;
}

export default function MelhorEnvioDebugPage() {
  const [checks, setChecks] = useState<DebugCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const updateCheck = (name: string, status: DebugCheck['status'], message: string, details?: string, fix?: string) => {
    setChecks(prev => {
      const existing = prev.findIndex(c => c.name === name);
      const newCheck = { name, status, message, details, fix };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newCheck;
        return updated;
      }
      return [...prev, newCheck];
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para área de transferência!');
  };

  const runDiagnostics = async () => {
    setIsLoading(true);
    setChecks([]);

    // 1. Verificar variáveis de ambiente
    updateCheck('env-vars', 'checking', 'Verificando variáveis de ambiente...');
    
    const clientId = process.env.NEXT_PUBLIC_MELHORENVIO_CLIENT_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const isSandbox = process.env.NEXT_PUBLIC_MELHORENVIO_SANDBOX === 'true';

    if (!clientId) {
      updateCheck('env-vars', 'error', 'NEXT_PUBLIC_MELHORENVIO_CLIENT_ID não configurado', 
        'Variável de ambiente ausente',
        'Adicione NEXT_PUBLIC_MELHORENVIO_CLIENT_ID=20735 nas variáveis de ambiente do Netlify');
    } else if (!baseUrl) {
      updateCheck('env-vars', 'error', 'NEXT_PUBLIC_BASE_URL não configurado',
        'Variável de ambiente ausente',
        'Adicione NEXT_PUBLIC_BASE_URL=https://c4franquiaas.netlify.app nas variáveis de ambiente');
    } else {
      updateCheck('env-vars', 'success', 'Variáveis de ambiente OK', 
        `Client ID: ${clientId}\nBase URL: ${baseUrl}\nSandbox: ${isSandbox}`);
    }

    // 2. Verificar URL de callback
    updateCheck('callback-url', 'checking', 'Verificando URL de callback...');
    
    const expectedCallbackUrl = `${baseUrl}/admin/configuracoes/melhorenvio/callback`;
    const callbackUrlEncoded = encodeURIComponent(expectedCallbackUrl);
    
    updateCheck('callback-url', 'success', 'URL de callback configurada', 
      `URL: ${expectedCallbackUrl}\nEncoded: ${callbackUrlEncoded}`,
      `Confirme no painel Melhor Envio que esta URL está cadastrada:\n${expectedCallbackUrl}`);

    // 3. Testar rota de callback
    updateCheck('callback-route', 'checking', 'Testando rota de callback...');
    
    try {
      const response = await fetch('/admin/configuracoes/melhorenvio/callback?code=test_debug');
      
      if (response.status === 404) {
        updateCheck('callback-route', 'error', 'Rota de callback retorna 404',
          `Status: ${response.status}`,
          'A página callback não foi encontrada. Verifique se o arquivo existe em: app/admin/configuracoes/melhorenvio/callback/page.tsx');
      } else if (response.ok) {
        updateCheck('callback-route', 'success', 'Rota de callback acessível',
          `Status: ${response.status}`);
      } else {
        updateCheck('callback-route', 'warning', 'Rota de callback retornou status inesperado',
          `Status: ${response.status}`);
      }
    } catch (error) {
      updateCheck('callback-route', 'error', 'Erro ao testar rota de callback',
        error instanceof Error ? error.message : 'Erro desconhecido');
    }

    // 4. Testar API de autorização
    updateCheck('authorize-api', 'checking', 'Testando API de autorização...');
    
    try {
      const response = await fetch('/api/admin/melhorenvio/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'test_debug_code' })
      });
      
      const data = await response.json();
      
      if (response.status === 404) {
        updateCheck('authorize-api', 'error', 'API de autorização não encontrada (404)',
          JSON.stringify(data, null, 2),
          'Verifique se existe o arquivo: app/api/admin/melhorenvio/authorize/route.ts');
      } else {
        updateCheck('authorize-api', 'success', 'API de autorização acessível',
          `Status: ${response.status}\nResposta: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      updateCheck('authorize-api', 'error', 'Erro ao testar API de autorização',
        error instanceof Error ? error.message : 'Erro desconhecido');
    }

    // 5. Verificar status de autorização atual
    updateCheck('auth-status', 'checking', 'Verificando status de autorização...');
    
    try {
      const response = await fetch('/api/admin/melhorenvio/status');
      const data = await response.json();
      
      if (data.authorized) {
        updateCheck('auth-status', 'success', 'Token de acesso já configurado',
          `Token expira em: ${data.expires_at || 'N/A'}\nScopes: ${data.scopes || 'N/A'}`);
      } else {
        updateCheck('auth-status', 'warning', 'Ainda não autorizado',
          'Nenhum token de acesso encontrado no banco',
          'Clique em "Autorizar Melhor Envio" na página principal para iniciar o processo OAuth');
      }
    } catch (error) {
      updateCheck('auth-status', 'error', 'Erro ao verificar status',
        error instanceof Error ? error.message : 'Erro desconhecido');
    }

    // 6. Testar conectividade com Melhor Envio
    updateCheck('melhorenvio-api', 'checking', 'Testando conexão com API Melhor Envio...');
    
    const melhorEnvioBaseUrl = isSandbox 
      ? 'https://sandbox.melhorenvio.com.br'
      : 'https://melhorenvio.com.br';
    
    try {
      // Teste básico de conectividade (não requer autenticação)
      const response = await fetch(`${melhorEnvioBaseUrl}/api/v2/me/shipment/services`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (response.status === 401) {
        updateCheck('melhorenvio-api', 'success', 'API Melhor Envio acessível (401 esperado sem token)',
          `URL: ${melhorEnvioBaseUrl}\nStatus: ${response.status}`);
      } else if (response.ok) {
        updateCheck('melhorenvio-api', 'success', 'API Melhor Envio acessível',
          `URL: ${melhorEnvioBaseUrl}\nStatus: ${response.status}`);
      } else {
        updateCheck('melhorenvio-api', 'warning', 'API Melhor Envio retornou status inesperado',
          `URL: ${melhorEnvioBaseUrl}\nStatus: ${response.status}`);
      }
    } catch (error) {
      updateCheck('melhorenvio-api', 'error', 'Erro ao conectar com Melhor Envio',
        error instanceof Error ? error.message : 'Erro desconhecido',
        'Verifique sua conexão com a internet e se o Melhor Envio está online');
    }

    // 7. Verificar estrutura de pastas
    updateCheck('file-structure', 'checking', 'Verificando estrutura de arquivos...');
    
    const requiredFiles = [
      '/admin/configuracoes/melhorenvio',
      '/admin/configuracoes/melhorenvio/callback',
      '/api/admin/melhorenvio/authorize',
      '/api/admin/melhorenvio/status'
    ];
    
    const fileTests = await Promise.all(
      requiredFiles.map(async (path) => {
        try {
          const response = await fetch(path);
          return { path, status: response.status, ok: response.status !== 404 };
        } catch {
          return { path, status: 0, ok: false };
        }
      })
    );
    
    const missingFiles = fileTests.filter(f => !f.ok);
    
    if (missingFiles.length > 0) {
      updateCheck('file-structure', 'error', 'Arquivos faltando ou inacessíveis',
        missingFiles.map(f => `${f.path} (${f.status})`).join('\n'),
        'Verifique se todos os arquivos foram deployados corretamente no Netlify');
    } else {
      updateCheck('file-structure', 'success', 'Todos os arquivos necessários presentes',
        fileTests.map(f => `${f.path} (${f.status})`).join('\n'));
    }

    // 8. Gerar URL de autorização para teste
    updateCheck('auth-url', 'checking', 'Gerando URL de autorização...');
    
    const scope = 'cart-read cart-write companies-read companies-write coupons-read coupons-write notifications-read orders-read shipping-calculate shipping-cancel shipping-checkout shipping-companies shipping-generate shipping-preview shipping-print shipping-share shipping-tracking ecommerce-shipping transactions-read';
    const state = Math.random().toString(36).substring(7);
    const redirectUri = encodeURIComponent(expectedCallbackUrl);
    const authUrl = `${melhorEnvioBaseUrl}/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
    
    updateCheck('auth-url', 'success', 'URL de autorização gerada',
      authUrl,
      'Clique no botão "Copiar URL de Teste" e cole no navegador para testar manualmente');

    setIsLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusIcon = (status: DebugCheck['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: DebugCheck['status']) => {
    switch (status) {
      case 'checking':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const authUrlCheck = checks.find(c => c.name === 'auth-url');

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔍 Debug - Melhor Envio OAuth
        </h1>
        <p className="text-gray-600">
          Diagnóstico completo da integração OAuth com Melhor Envio
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <button
          onClick={runDiagnostics}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Executar Diagnóstico
        </button>

        {authUrlCheck?.details && (
          <button
            onClick={() => copyToClipboard(authUrlCheck.details!)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Copy className="w-4 h-4" />
            Copiar URL de Teste
          </button>
        )}
      </div>

      <div className="space-y-4">
        {checks.map((check, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getStatusColor(check.status)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">{getStatusIcon(check.status)}</div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {check.message}
                </h3>
                
                {check.details && (
                  <pre className="text-xs bg-white bg-opacity-50 p-3 rounded mt-2 overflow-x-auto border">
                    {check.details}
                  </pre>
                )}
                
                {check.fix && (
                  <div className="mt-3 p-3 bg-white bg-opacity-70 rounded border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      💡 Como corrigir:
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {check.fix}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && checks.length > 0 && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">📊 Resumo:</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {checks.filter(c => c.status === 'success').length}
              </div>
              <div className="text-sm text-gray-600">Sucesso</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {checks.filter(c => c.status === 'warning').length}
              </div>
              <div className="text-sm text-gray-600">Avisos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {checks.filter(c => c.status === 'error').length}
              </div>
              <div className="text-sm text-gray-600">Erros</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {checks.filter(c => c.status === 'checking').length}
              </div>
              <div className="text-sm text-gray-600">Verificando</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
