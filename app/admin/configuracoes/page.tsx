"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Check, AlertCircle, Loader2, Truck, Package } from 'lucide-react';
import Link from 'next/link';

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<'pagamento' | 'frete'>('pagamento');
  const [mpAtivado, setMpAtivado] = useState(false);
  const [mpModoProducao, setMpModoProducao] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  async function carregarConfiguracoes() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/configuracoes/mercadopago');
      if (res.ok) {
        const data = await res.json();
        setMpAtivado(data.mp_ativado || false);
        setMpModoProducao(data.mp_modo_producao || false);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  }

  async function salvarConfiguracoes() {
    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch('/api/admin/configuracoes/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mp_ativado: mpAtivado,
          mp_modo_producao: mpModoProducao,
        }),
      });

      if (!res.ok) throw new Error('Erro ao salvar');

      setMessage({
        type: 'success',
        text: '✅ Configurações salvas com sucesso! Todas as lojas estão atualizadas.',
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage({
        type: 'error',
        text: '❌ Erro ao salvar configurações. Tente novamente.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          ⚙️ Configurações Globais
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Configurações que afetam todas as lojas franqueadas
        </p>
      </div>

      {/* Tabs de Navegação */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('pagamento')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'pagamento'
              ? 'border-[#DB1472] text-[#DB1472]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <CreditCard className="inline-block w-5 h-5 mr-2" />
          Pagamento
        </button>
        <button
          onClick={() => setActiveTab('frete')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'frete'
              ? 'border-[#DB1472] text-[#DB1472]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Truck className="inline-block w-5 h-5 mr-2" />
          Frete e Envios
        </button>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Conteúdo da Aba de Pagamento */}
      {activeTab === 'pagamento' && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Mercado Pago - Todas as Lojas</h2>
          </div>

          <div className="space-y-6">
            {/* Ativar/Desativar MP Globalmente */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="mp-ativado" className="text-base font-medium">
                  Mercado Pago Ativo
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Ativa ou desativa o Mercado Pago em <strong>todas as lojas</strong> simultaneamente
                </p>
              </div>
              <Switch
                id="mp-ativado"
                checked={mpAtivado}
                onCheckedChange={setMpAtivado}
                className="ml-4"
              />
            </div>

            {/* Modo de Produção */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="mp-modo-producao" className="text-base font-medium">
                  Modo de Produção
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Quando ativado, usa credenciais de <strong>produção</strong> (pagamentos reais).
                  Quando desativado, usa modo <strong>teste</strong>.
                </p>
              </div>
              <Switch
                id="mp-modo-producao"
                checked={mpModoProducao}
                onCheckedChange={setMpModoProducao}
                className="ml-4"
              />
            </div>

            {/* Informações sobre Credenciais */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Credenciais configuradas no servidor:</strong>
                <br />
                As credenciais do Mercado Pago (Public Key e Access Token) estão configuradas
                nas variáveis de ambiente do Netlify e são compartilhadas por todas as lojas.
              </AlertDescription>
            </Alert>

            {/* Status Atual */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">📊 Status Atual</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Mercado Pago:</strong>{' '}
                  <span className={mpAtivado ? 'text-green-600' : 'text-red-600'}>
                    {mpAtivado ? '✅ Ativo em todas as lojas' : '❌ Desativado em todas as lojas'}
                  </span>
                </p>
                <p>
                  <strong>Modo:</strong>{' '}
                  <span className={mpModoProducao ? 'text-green-600' : 'text-orange-600'}>
                    {mpModoProducao ? '🟢 Produção (pagamentos reais)' : '🟡 Teste (cartões de teste)'}
                  </span>
                </p>
              </div>
            </div>

            {/* Botão Salvar */}
            <Button
              onClick={salvarConfiguracoes}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Salvar Configurações Globais
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Conteúdo da Aba de Frete */}
      {activeTab === 'frete' && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Package className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Configuração de Envios</h2>
          </div>

          <div className="space-y-6">
            {/* Card Melhor Envio */}
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Melhor Envio - Integração Ativa</h3>
                  <p className="text-gray-600 mb-4">
                    Sistema integrado com Melhor Envio para cotação de frete em tempo real.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>✅ Cotação em tempo real</li>
                    <li>✅ Múltiplas transportadoras (PAC, SEDEX, Jadlog, etc)</li>
                    <li>✅ Geração de etiquetas (em breve)</li>
                    <li>✅ Rastreamento integrado (em breve)</li>
                  </ul>
                  <Link href="/admin/melhorenvio">
                    <Button className="bg-[#DB1472] hover:bg-[#DB1472]/90">
                      <Package className="mr-2 h-4 w-4" />
                      Gerenciar Melhor Envio
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Informação */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Precisa autorizar o Melhor Envio?</strong>
                <br />
                Acesse a página de{' '}
                <Link href="/admin/melhorenvio" className="text-blue-600 hover:underline">
                  configuração do Melhor Envio
                </Link>{' '}
                para autorizar o aplicativo e começar a usar cotações reais.
              </AlertDescription>
            </Alert>
          </div>
        </Card>
      )}
    </div>
  );
}
