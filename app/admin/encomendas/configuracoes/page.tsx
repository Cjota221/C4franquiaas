"use client";

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

export default function ConfiguracoesEncomendasPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    site_ativo: true,
    pedido_minimo_grades: 2,
    prazo_producao_min: 15,
    prazo_producao_max: 20,
    mensagem_topo: '🚀 Pedido mínimo: 2 grades | 📦 Produção: 15-20 dias úteis',
    whatsapp_numero: '',
    cores_padrao: ['Preto', 'Branco', 'Rosa', 'Azul', 'Vermelho'],
    numeracoes_padrao: ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42'],
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/grade-fechada/configuracoes');
      const data = await response.json();
      
      if (response.ok) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/admin/grade-fechada/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Configurações salvas com sucesso');
      } else {
        toast.error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Configurações - Grade Fechada">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Configurações - Grade Fechada">
      <div className="p-6 max-w-4xl mx-auto">
        <PageHeader
          title="Configurações do Site de Encomendas"
          subtitle="Configure as regras e parâmetros do sistema"
        />

        <div className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Configurações Gerais</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.site_ativo}
                  onChange={(e) => setConfig(prev => ({ ...prev, site_ativo: e.target.checked }))}
                  className="w-5 h-5"
                />
                <label className="font-medium">Site de encomendas ativo</label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Pedido Mínimo (grades)
                </label>
                <input
                  type="number"
                  value={config.pedido_minimo_grades}
                  onChange={(e) => setConfig(prev => ({ ...prev, pedido_minimo_grades: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prazo Produção Mín. (dias úteis)
                  </label>
                  <input
                    type="number"
                    value={config.prazo_producao_min}
                    onChange={(e) => setConfig(prev => ({ ...prev, prazo_producao_min: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prazo Produção Máx. (dias úteis)
                  </label>
                  <input
                    type="number"
                    value={config.prazo_producao_max}
                    onChange={(e) => setConfig(prev => ({ ...prev, prazo_producao_max: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Mensagem do Topo do Site
                </label>
                <input
                  type="text"
                  value={config.mensagem_topo}
                  onChange={(e) => setConfig(prev => ({ ...prev, mensagem_topo: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Número WhatsApp (com DDI)
                </label>
                <input
                  type="text"
                  value={config.whatsapp_numero}
                  onChange={(e) => setConfig(prev => ({ ...prev, whatsapp_numero: e.target.value }))}
                  placeholder="5511999999999"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
