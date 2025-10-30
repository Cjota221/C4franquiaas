"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface MercadoPagoConfig {
  mp_ativado: boolean;
  mp_modo_producao: boolean;
}

interface MercadoPagoConfigFormProps {
  lojaId: string;
  initialConfig?: MercadoPagoConfig;
  onSave?: () => void;
}

export default function MercadoPagoConfigForm({
  lojaId,
  initialConfig,
  onSave,
}: MercadoPagoConfigFormProps) {
  const [config, setConfig] = useState<MercadoPagoConfig>(
    initialConfig || {
      mp_ativado: false,
      mp_modo_producao: false,
    }
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [showTokens, setShowTokens] = useState(false);

  // Credenciais (lidas do .env - apenas para visualização)
  const publicKeyProd = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_PROD || 'Não configurada';
  const publicKeyTest = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_TEST || 'Não configurada';

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/mercadopago/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lojaId,
          ...config,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar configurações');
      }

      setMessage({
        type: 'success',
        text: 'Configurações salvas com sucesso!',
      });

      if (onSave) onSave();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao salvar',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-50 rounded-lg">
          <CreditCard className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Configuração do Mercado Pago
          </h2>
          <p className="text-sm text-gray-600">
            Configure a integração de pagamentos da sua loja
          </p>
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Formulário */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Switch: Ativar Integração */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="ativar" className="text-base font-semibold">
                Ativar Integração
              </Label>
              <p className="text-sm text-gray-600">
                Habilita o Mercado Pago como método de pagamento
              </p>
            </div>
            <Switch
              id="ativar"
              checked={config.mp_ativado}
              onCheckedChange={(checked) =>
                setConfig({ ...config, mp_ativado: checked })
              }
            />
          </div>

          {/* Switch: Modo Produção */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="producao" className="text-base font-semibold">
                Modo Produção
              </Label>
              <p className="text-sm text-gray-600">
                {config.mp_modo_producao
                  ? '🔴 Produção (pagamentos reais)'
                  : '🟡 Teste/Sandbox (sem cobranças reais)'}
              </p>
            </div>
            <Switch
              id="producao"
              checked={config.mp_modo_producao}
              onCheckedChange={(checked) =>
                setConfig({ ...config, mp_modo_producao: checked })
              }
              disabled={!config.mp_ativado}
            />
          </div>

          {/* Divisor */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Credenciais Configuradas</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTokens(!showTokens)}
              >
                {showTokens ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Mostrar
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              {/* Public Key - Produção */}
              <div className="space-y-2">
                <Label htmlFor="public-key-prod">
                  Public Key - Produção
                  <span className="ml-2 text-xs text-green-600 font-semibold">
                    (Frontend)
                  </span>
                </Label>
                <Input
                  id="public-key-prod"
                  type={showTokens ? 'text' : 'password'}
                  value={publicKeyProd}
                  readOnly
                  className="font-mono text-sm bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Configurada em: NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_PROD
                </p>
              </div>

              {/* Public Key - Teste */}
              <div className="space-y-2">
                <Label htmlFor="public-key-test">
                  Public Key - Teste
                  <span className="ml-2 text-xs text-yellow-600 font-semibold">
                    (Frontend)
                  </span>
                </Label>
                <Input
                  id="public-key-test"
                  type={showTokens ? 'text' : 'password'}
                  value={publicKeyTest}
                  readOnly
                  className="font-mono text-sm bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Configurada em: NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_TEST
                </p>
              </div>

              {/* Access Tokens - Apenas informativo */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Access Tokens</strong> (PROD e TEST) são mantidos
                  seguros no servidor e nunca expostos ao frontend.
                  Configurados em variáveis de ambiente privadas.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={loading}
              size="lg"
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Documentação */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">
          📚 Como obter as credenciais?
        </h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Acesse <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="underline">Mercado Pago Developers</a></li>
          <li>Vá em <strong>Suas Integrações → Credenciais</strong></li>
          <li>Copie a <strong>Public Key</strong> e o <strong>Access Token</strong></li>
          <li>Configure nas variáveis de ambiente do Netlify</li>
        </ol>
      </Card>
    </div>
  );
}
