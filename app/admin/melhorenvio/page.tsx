"use client";

import { useState, useEffect } from 'react';
import { Package, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function MelhorEnvioPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const response = await fetch('/api/admin/melhorenvio/status');
      const data = await response.json();
      setIsAuthorized(data.authorized);
    } catch (err) {
      console.error('Erro ao verificar autorização:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = () => {
    // Redirecionar para OAuth do Melhor Envio
    const clientId = '7341';
    const redirectUri = encodeURIComponent('https://c4franquiaas.netlify.app/admin/melhorenvio/callback');
    const scope = 'cart-read cart-write companies-read companies-write coupons-read coupons-write notifications-read orders-read products-read products-write purchases-read shipping-calculate shipping-cancel shipping-checkout shipping-companies shipping-generate shipping-preview shipping-print shipping-share shipping-tracking ecommerce-shipping transactions-read';
    const state = Math.random().toString(36).substring(7);
    
    const authUrl = `https://sandbox.melhorenvio.com.br/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
    
    window.location.href = authUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Integração Melhor Envio
        </h1>
        <p className="text-gray-600">
          Configure a integração com o Melhor Envio para cotação e envio de fretes
        </p>
      </div>

      {/* Status da Integração */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Status da Integração</h2>
              <p className="text-sm text-gray-600">
                {isAuthorized ? 'Conectado e autorizado' : 'Não autorizado'}
              </p>
            </div>
          </div>
          <div>
            {isAuthorized ? (
              <CheckCircle className="w-10 h-10 text-green-500" />
            ) : (
              <XCircle className="w-10 h-10 text-red-500" />
            )}
          </div>
        </div>
      </div>

      {/* Card de Autorização */}
      {!isAuthorized && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Autorizar Acesso</h3>
          <p className="text-gray-600 mb-6">
            Para usar o Melhor Envio, você precisa autorizar o aplicativo a acessar sua conta.
            Clique no botão abaixo para ser redirecionado para a página de autorização.
          </p>
          
          <button
            onClick={handleAuthorize}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Autorizar Melhor Envio
          </button>
        </div>
      )}

      {/* Informações da Integração */}
      {isAuthorized && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">✅ Integração Ativa</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Cotação de frete em tempo real</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Múltiplas transportadoras (PAC, SEDEX, Jadlog, etc)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Geração automática de etiquetas</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Rastreamento de pedidos</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
