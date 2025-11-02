"use client";

import { useState, useEffect } from 'react';
import { Package, CheckCircle, XCircle, Loader2, Truck, Settings, DollarSign, Save, AlertCircle } from 'lucide-react';

interface Servico {
  id?: string;
  servico_id: number;
  servico_nome: string;
  company_id: number;
  company_name: string;
  ativo: boolean;
  taxa_adicional: number;
}

interface ConfigGeral {
  taxa_embalagem: number;
  frete_gratis_acima: number | null;
  prazo_adicional: number;
}

interface MelhorEnvioService {
  id: number;
  name: string;
  company: {
    id: number;
    name: string;
    picture: string;
  };
}

export default function MelhorEnvioPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Configurações
  const [configGeral, setConfigGeral] = useState<ConfigGeral>({
    taxa_embalagem: 0,
    frete_gratis_acima: null,
    prazo_adicional: 0,
  });
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicosDisponiveis, setServicosDisponiveis] = useState<MelhorEnvioService[]>([]);

  useEffect(() => {
    checkAuthorization();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadServices();
      loadConfig();
    }
  }, [isAuthorized]);

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

  const loadServices = async () => {
    try {
      const response = await fetch('/api/admin/melhorenvio/services');
      const data = await response.json();
      if (data.success && data.services) {
        console.log('[Melhor Envio Config] Serviços carregados:', data.services.length);
        setServicosDisponiveis(data.services);
      }
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
    }
  };

  const loadConfig = async () => {
    setLoadingConfig(true);
    try {
      const response = await fetch('/api/admin/melhorenvio/transportadoras');
      const data = await response.json();
      
      if (data.success) {
        setConfigGeral(data.configGeral);
        setServicos(data.servicos || []);
        console.log('[Melhor Envio Config] Config carregada:', data.servicos?.length || 0, 'serviços');
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      // Criar lista de serviços mesclando disponíveis com config
      const servicosParaSalvar = servicosDisponiveis.map(service => {
        const existing = servicos.find(s => s.servico_id === service.id);
        return {
          servico_id: service.id,
          servico_nome: service.name,
          company_id: service.company.id,
          company_name: service.company.name,
          ativo: existing?.ativo !== undefined ? existing.ativo : true,
          taxa_adicional: existing?.taxa_adicional || 0,
        };
      });

      const response = await fetch('/api/admin/melhorenvio/transportadoras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configGeral,
          servicos: servicosParaSalvar,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        loadConfig(); // Recarregar
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao salvar' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
      console.error('Erro:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleServico = (servicoId: number) => {
    setServicos(prev => {
      const existing = prev.find(s => s.servico_id === servicoId);
      if (existing) {
        return prev.map(s => 
          s.servico_id === servicoId ? { ...s, ativo: !s.ativo } : s
        );
      } else {
        const service = servicosDisponiveis.find(s => s.id === servicoId);
        if (!service) return prev;
        return [...prev, {
          servico_id: servicoId,
          servico_nome: service.name,
          company_id: service.company.id,
          company_name: service.company.name,
          ativo: false,
          taxa_adicional: 0,
        }];
      }
    });
  };

  const updateTaxaAdicional = (servicoId: number, taxa: number) => {
    setServicos(prev => {
      const existing = prev.find(s => s.servico_id === servicoId);
      if (existing) {
        return prev.map(s => 
          s.servico_id === servicoId ? { ...s, taxa_adicional: taxa } : s
        );
      } else {
        const service = servicosDisponiveis.find(s => s.id === servicoId);
        if (!service) return prev;
        return [...prev, {
          servico_id: servicoId,
          servico_nome: service.name,
          company_id: service.company.id,
          company_name: service.company.name,
          ativo: true,
          taxa_adicional: taxa,
        }];
      }
    });
  };

  const handleAuthorize = () => {
    const clientId = '20735';
    const isSandbox = process.env.NEXT_PUBLIC_MELHORENVIO_SANDBOX === 'true';
    const baseUrl = isSandbox ? 'https://sandbox.melhorenvio.com.br' : 'https://melhorenvio.com.br';
    const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/configuracoes/melhorenvio/callback`);
    const scope = 'cart-read cart-write companies-read companies-write coupons-read coupons-write notifications-read orders-read products-read products-write purchases-read shipping-calculate shipping-cancel shipping-checkout shipping-companies shipping-generate shipping-preview shipping-print shipping-share shipping-tracking ecommerce-shipping transactions-read';
    const state = Math.random().toString(36).substring(7);
    
    const authUrl = `${baseUrl}/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
    
    window.location.href = authUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Agrupar serviços por transportadora
  const servicosAgrupados = servicosDisponiveis.reduce((acc, service) => {
    const companyName = service.company.name;
    if (!acc[companyName]) {
      acc[companyName] = {
        company: service.company,
        services: []
      };
    }
    acc[companyName].services.push(service);
    return acc;
  }, {} as Record<string, { company: { id: number; name: string; picture: string }, services: MelhorEnvioService[] }>);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Configurações Melhor Envio
        </h1>
        <p className="text-gray-600">
          Configure serviços de frete e taxas
        </p>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

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
          </p>
          
          <button
            onClick={handleAuthorize}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Autorizar Melhor Envio
          </button>
        </div>
      )}

      {/* Configurações (só aparece se autorizado) */}
      {isAuthorized && (
        <>
          {/* Configuração Geral */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-gray-700" />
              <h3 className="text-xl font-semibold">Configuração Geral</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Taxa de Embalagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Taxa de Embalagem (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={configGeral.taxa_embalagem}
                  onChange={(e) => setConfigGeral(prev => ({
                    ...prev,
                    taxa_embalagem: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Valor adicionado a TODOS os fretes
                </p>
              </div>

              {/* Frete Grátis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frete Grátis Acima de (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={configGeral.frete_gratis_acima || ''}
                  onChange={(e) => setConfigGeral(prev => ({
                    ...prev,
                    frete_gratis_acima: e.target.value ? parseFloat(e.target.value) : null
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Deixe vazio para desabilitar"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Frete grátis se compra ≥ este valor
                </p>
              </div>

              {/* Prazo Adicional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prazo Adicional (dias)
                </label>
                <input
                  type="number"
                  min="0"
                  value={configGeral.prazo_adicional}
                  onChange={(e) => setConfigGeral(prev => ({
                    ...prev,
                    prazo_adicional: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dias extras no prazo de entrega
                </p>
              </div>
            </div>
          </div>

          {/* Serviços de Frete */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Truck className="w-6 h-6 text-gray-700" />
              <h3 className="text-xl font-semibold">Serviços de Frete</h3>
              <span className="text-sm text-gray-500">
                ({servicosDisponiveis.length} serviços disponíveis)
              </span>
            </div>

            {loadingConfig ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : Object.keys(servicosAgrupados).length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhum serviço disponível
              </p>
            ) : (
              <div className="space-y-6">
                {Object.entries(servicosAgrupados).map(([companyName, { company, services }]) => (
                  <div key={companyName} className="border-2 border-gray-200 rounded-lg p-4">
                    {/* Cabeçalho da Transportadora */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                      <img
                        src={company.picture}
                        alt={company.name}
                        className="w-12 h-12 object-contain"
                      />
                      <h4 className="text-lg font-bold text-gray-900">{company.name}</h4>
                      <span className="text-sm text-gray-500">({services.length} serviços)</span>
                    </div>

                    {/* Lista de Serviços */}
                    <div className="space-y-2">
                      {services.map(service => {
                        const config = servicos.find(s => s.servico_id === service.id);
                        const isAtivo = config?.ativo !== false;
                        const taxaAdicional = config?.taxa_adicional || 0;

                        return (
                          <div
                            key={service.id}
                            className={`border rounded-lg p-3 transition-all ${
                              isAtivo ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              {/* Nome do Serviço */}
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-gray-900 truncate">
                                  {service.name}
                                </h5>
                                <p className="text-xs text-gray-600">
                                  {isAtivo ? '✅ Ativo no site' : '❌ Desativado'}
                                </p>
                              </div>

                              {/* Taxa Adicional */}
                              <div className="w-40">
                                <label className="block text-xs text-gray-600 mb-1">
                                  Taxa Adicional (R$)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={taxaAdicional}
                                  onChange={(e) => updateTaxaAdicional(
                                    service.id,
                                    parseFloat(e.target.value) || 0
                                  )}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  disabled={!isAtivo}
                                />
                              </div>

                              {/* Toggle */}
                              <button
                                onClick={() => toggleServico(service.id)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                                  isAtivo
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                }`}
                              >
                                {isAtivo ? 'Ativo' : 'Desativado'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end gap-4">
            <button
              onClick={loadConfig}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:bg-blue-400"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
