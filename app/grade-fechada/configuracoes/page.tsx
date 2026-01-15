"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  Settings,
  Save,
  AlertCircle,
  Package,
  Clock,
  DollarSign,
  MessageSquare,
  Palette,
  Globe,
  Upload,
  Eye,
  X,
} from 'lucide-react';

export default function ConfiguracoesGradeFechadaPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [config, setConfig] = useState({
    // Personalização do Site
    slug_site: '',
    logo_url: '',
    cor_primaria: '#8B5CF6',
    cor_secundaria: '#EC4899',
    site_ativo: true,
    titulo_site: '',
    descricao_site: '',
    
    // Regras de Pedido
    pedido_minimo_grades: 2,
    prazo_producao_min: 15,
    prazo_producao_max: 20,
    permite_pagamento_online: false,
    
    // Notificações
    mensagem_whatsapp_template: '',
    email_notificacao: '',
    whatsapp_numero: '',
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

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload');
      }

      const data = await response.json();
      setConfig({ ...config, logo_url: data.url });
      toast.success('Logo enviado com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao fazer upload do logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    setConfig({ ...config, logo_url: '' });
  };

  const visualizarSite = () => {
    if (!config.slug_site) {
      toast.error('Defina um slug para o site primeiro');
      return;
    }
    window.open(`/loja-grade/${config.slug_site}`, '_blank');
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
        {/* Personalização do Site */}
        <Card className="p-6 border-2 border-purple-200 bg-purple-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Site Público</h2>
            </div>
            {config.slug_site && (
              <Button
                onClick={visualizarSite}
                variant="outline"
                size="sm"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar Site
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* Status do Site */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200">
              <input
                type="checkbox"
                id="site_ativo"
                checked={config.site_ativo}
                onChange={(e) => setConfig({ ...config, site_ativo: e.target.checked })}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="site_ativo" className="text-sm font-medium text-gray-700">
                Site Público Ativo
              </label>
              <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${
                config.site_ativo 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {config.site_ativo ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Slug do Site */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug do Site * 
                  <span className="text-xs text-gray-500 font-normal ml-1">(URL única)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">/loja-grade/</span>
                  <input
                    type="text"
                    value={config.slug_site}
                    onChange={(e) => {
                      const slug = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '-')
                        .replace(/-+/g, '-');
                      setConfig({ ...config, slug_site: slug });
                    }}
                    placeholder="minha-loja"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                {config.slug_site && (
                  <p className="text-xs text-purple-600 mt-1">
                    URL: <strong>/loja-grade/{config.slug_site}</strong>
                  </p>
                )}
              </div>

              {/* Título do Site */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Site
                </label>
                <input
                  type="text"
                  value={config.titulo_site}
                  onChange={(e) => setConfig({ ...config, titulo_site: e.target.value })}
                  placeholder="Minha Loja de Calçados"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Descrição do Site */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={config.descricao_site}
                onChange={(e) => setConfig({ ...config, descricao_site: e.target.value })}
                rows={2}
                placeholder="Calçados de qualidade para revenda..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp de Contato
              </label>
              <input
                type="tel"
                value={config.whatsapp_numero}
                onChange={(e) => setConfig({ ...config, whatsapp_numero: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Para receber pedidos e dúvidas dos clientes
              </p>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo do Site
              </label>
              {config.logo_url ? (
                <div className="relative inline-block">
                  <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300">
                    <Image
                      src={config.logo_url}
                      alt="Logo"
                      width={192}
                      height={192}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
                      <Upload className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {uploadingLogo ? 'Enviando...' : 'Escolher Logo'}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogo}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-gray-500">
                    PNG, JPG ou WebP (máx 2MB)
                  </span>
                </div>
              )}
            </div>

            {/* Paleta de Cores */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor Primária
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.cor_primaria || '#8B5CF6'}
                    onChange={(e) => setConfig({ ...config, cor_primaria: e.target.value })}
                    className="h-10 w-20 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={config.cor_primaria || '#8B5CF6'}
                    onChange={(e) => {
                      const valor = e.target.value;
                      if (valor.match(/^#[0-9A-Fa-f]{0,6}$/) || valor === '') {
                        setConfig({ ...config, cor_primaria: valor || '#8B5CF6' });
                      }
                    }}
                    placeholder="#8B5CF6"
                    maxLength={7}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor Secundária
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.cor_secundaria || '#EC4899'}
                    onChange={(e) => setConfig({ ...config, cor_secundaria: e.target.value })}
                    className="h-10 w-20 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={config.cor_secundaria || '#EC4899'}
                    onChange={(e) => {
                      const valor = e.target.value;
                      if (valor.match(/^#[0-9A-Fa-f]{0,6}$/) || valor === '') {
                        setConfig({ ...config, cor_secundaria: valor || '#EC4899' });
                      }
                    }}
                    placeholder="#EC4899"
                    maxLength={7}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Preview das Cores */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <Palette className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">Preview:</span>
              <button
                style={{ backgroundColor: config.cor_primaria }}
                className="px-4 py-2 rounded-lg text-white font-medium text-sm"
              >
                Botão Primário
              </button>
              <button
                style={{ backgroundColor: config.cor_secundaria }}
                className="px-4 py-2 rounded-lg text-white font-medium text-sm"
              >
                Botão Secundário
              </button>
            </div>
          </div>
        </Card>

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
