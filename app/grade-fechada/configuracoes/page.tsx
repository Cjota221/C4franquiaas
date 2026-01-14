"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Settings,
  Save,
  AlertCircle,
  Package,
  Clock,
  DollarSign,
  MessageSquare,
} from 'lucide-react';

export default function ConfiguracoesGradeFechadaPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    pedido_minimo_grades: 2,
    prazo_producao_min: 15,
    prazo_producao_max: 20,
    permite_pagamento_online: false,
    mensagem_whatsapp_template: '',
    email_notificacao: '',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/grade-fechada/configuracoes');
      const data = await response.json();

      if (response.ok && data.data) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/grade-fechada/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Configurações salvas com sucesso!');
      } else {
        toast.error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao conectar com servidor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configurações - Grade Fechada
          </h1>
          <p className="text-gray-600">
            Configure as regras e parâmetros do sistema de encomendas
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gray-600 hover:bg-gray-700"
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Alerta */}
      <Card className="p-4 mb-6 border-blue-200 bg-blue-50">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <strong>Importante:</strong> Estas configurações afetam todas as encomendas e
            são exibidas no site para os clientes.
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {/* Regras de Pedido */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-6 w-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Regras de Pedido</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pedido Mínimo (grades do mesmo modelo)
              </label>
              <input
                type="number"
                value={config.pedido_minimo_grades}
                onChange={(e) =>
                  setConfig({ ...config, pedido_minimo_grades: parseInt(e.target.value) })
                }
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Quantidade mínima de grades que o cliente precisa comprar
              </p>
            </div>
          </div>
        </Card>

        {/* Prazos */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-6 w-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Prazos de Produção</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prazo Mínimo (dias úteis)
              </label>
              <input
                type="number"
                value={config.prazo_producao_min}
                onChange={(e) =>
                  setConfig({ ...config, prazo_producao_min: parseInt(e.target.value) })
                }
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prazo Máximo (dias úteis)
              </label>
              <input
                type="number"
                value={config.prazo_producao_max}
                onChange={(e) =>
                  setConfig({ ...config, prazo_producao_max: parseInt(e.target.value) })
                }
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Prazo contado após confirmação do pagamento
          </p>
        </Card>

        {/* Pagamento */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="h-6 w-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Opções de Pagamento</h2>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="pagamento_online"
              checked={config.permite_pagamento_online}
              onChange={(e) =>
                setConfig({ ...config, permite_pagamento_online: e.target.checked })
              }
              className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="pagamento_online" className="text-sm text-gray-700">
              Permitir pagamento online no site
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Quando desabilitado, pagamento deve ser combinado via WhatsApp
          </p>
        </Card>

        {/* Notificações */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="h-6 w-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Notificações</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail para Notificações
              </label>
              <input
                type="email"
                value={config.email_notificacao}
                onChange={(e) => setConfig({ ...config, email_notificacao: e.target.value })}
                placeholder="seu@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Receba notificações de novos pedidos
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem WhatsApp (Template)
              </label>
              <textarea
                value={config.mensagem_whatsapp_template}
                onChange={(e) =>
                  setConfig({ ...config, mensagem_whatsapp_template: e.target.value })
                }
                rows={4}
                placeholder="Olá! Vi seu carrinho com {produtos}..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Template usado ao enviar mensagem para carrinhos abandonados
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Botão de Salvar Fixo */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gray-600 hover:bg-gray-700"
          size="lg"
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Todas as Configurações'}
        </Button>
      </div>
    </div>
  );
}
