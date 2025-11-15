/**
 * PÃ¡gina: ConfiguraÃ§Ãµes de Envio (EnvioEcom)
 * Rota: /admin/configuracoes/envio
 * 
 * Permite configurar credenciais e parÃ¢metros da integraÃ§Ã£o EnvioEcom
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, Package, Truck } from 'lucide-react';

interface ConfigEnvioEcom {
  id?: string;
  slug: string;
  etoken: string;
  cep_origem: string;
  endereco_origem: {
    nome: string;
    telefone: string;
    email: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  dimensoes_padrao: {
    peso: number;
    altura: number;
    largura: number;
    comprimento: number;
  };
  ativo: boolean;
  geracao_automatica: boolean;
  servico_padrao_id: string;
}

export default function ConfiguracoesEnvioPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [config, setConfig] = useState<ConfigEnvioEcom>({
    slug: '',
    etoken: '',
    cep_origem: '',
    endereco_origem: {
      nome: '',
      telefone: '',
      email: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
    },
    dimensoes_padrao: {
      peso: 500,
      altura: 10,
      largura: 15,
      comprimento: 20,
    },
    ativo: true,
    geracao_automatica: false,
    servico_padrao_id: '',
  });

  // Carregar configuraÃ§Ã£o existente
    const carregarConfig = useCallback(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('config_envioecom')
          .select('*')
          .single();
  
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
  
        if (data) {
          setConfig(prev => ({
            ...prev,
            id: data.id,
            slug: data.slug || '',
            etoken: data.etoken || '',
            cep_origem: data.cep_origem || prev.cep_origem || '',
            endereco_origem: data.endereco_origem || prev.endereco_origem,
            dimensoes_padrao: data.dimensoes_padrao || prev.dimensoes_padrao,
            ativo: data.ativo ?? true,
            geracao_automatica: data.geracao_automatica ?? false,
            servico_padrao_id: data.servico_padrao_id || prev.servico_padrao_id || '',
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar configuraÃ§Ã£o:', error);
        toast.error('Erro ao carregar configuraÃ§Ãµes');
      } finally {
        setLoading(false);
      }
    }, [supabase]);
  
    useEffect(() => {
      carregarConfig();
    }, [carregarConfig]);

  const salvarConfig = async () => {
    setSaving(true);
    try {
      // ValidaÃ§Ãµes
      if (!config.slug || !config.etoken) {
        toast.error('SLUG e E-TOKEN sÃ£o obrigatÃ³rios');
        return;
      }

      if (!config.cep_origem) {
        toast.error('CEP de origem Ã© obrigatÃ³rio');
        return;
      }

      const dataToSave = {
        slug: config.slug,
        etoken: config.etoken,
        cep_origem: config.cep_origem,
        endereco_origem: config.endereco_origem,
        dimensoes_padrao: config.dimensoes_padrao,
        ativo: config.ativo,
        geracao_automatica: config.geracao_automatica,
        servico_padrao_id: config.servico_padrao_id || null,
      };

      let error;

      if (config.id) {
        // Atualizar existente
        ({ error } = await supabase
          .from('config_envioecom')
          .update(dataToSave)
          .eq('id', config.id));
      } else {
        // Inserir novo
        const { data, error: insertError } = await supabase
          .from('config_envioecom')
          .insert(dataToSave)
          .select()
          .single();

        error = insertError;
        if (data) {
          setConfig({ ...config, id: data.id });
        }
      }

      if (error) throw error;

      toast.success('ConfiguraÃ§Ãµes salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configuraÃ§Ãµes');
    } finally {
      setSaving(false);
    }
  };

  const testarIntegracao = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Validar credenciais
      if (!config.slug || !config.etoken) {
        setTestResult({
          success: false,
          message: 'Configure SLUG e E-TOKEN antes de testar',
        });
        return;
      }

      // Fazer requisiÃ§Ã£o de teste Ã  API EnvioEcom
      const response = await fetch('https://api.envioecom.com.br/v1/cotacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.etoken}`,
          'X-User-Slug': config.slug,
        },
        body: JSON.stringify({
          origem: { cep: config.cep_origem || '01310100' },
          destino: { cep: '01310100' }, // CEP de teste
          pacotes: [
            {
              peso: 500,
              altura: 10,
              largura: 15,
              comprimento: 20,
              valor_declarado: 100,
            },
          ],
        }),
      });

      const data = await response.json();

      if (data.sucesso) {
        setTestResult({
          success: true,
          message: `âœ… ConexÃ£o bem-sucedida! Encontrados ${data.servicos?.length || 0} serviÃ§os de frete disponÃ­veis.`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.mensagem || data.erro || 'Erro ao conectar com EnvioEcom',
        });
      }
    } catch (error) {
      console.error('Erro ao testar:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao testar conexÃ£o',
      });
    } finally {
      setTesting(false);
    }
  };

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setConfig({
          ...config,
          cep_origem: cepLimpo,
          endereco_origem: {
            ...config.endereco_origem,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
            cep: cepLimpo,
          },
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-8 h-8" />
          ConfiguraÃ§Ãµes de Envio
        </h1>
        <p className="text-gray-600 mt-2">
          Configure a integraÃ§Ã£o com EnvioEcom para cotaÃ§Ã£o e geraÃ§Ã£o de etiquetas
        </p>
      </div>

      {/* Credenciais EnvioEcom */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Credenciais EnvioEcom</CardTitle>
          <CardDescription>
            Obtenha em: <a href="https://painel.envioecom.com.br/" target="_blank" rel="noopener" className="text-blue-600 hover:underline">painel.envioecom.com.br</a> â†’ ConfiguraÃ§Ãµes â†’ API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>SLUG *</Label>
              <Input
                type="text"
                value={config.slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, slug: e.target.value })}
                placeholder="seu-slug-aqui"
              />
            </div>
            <div>
              <Label>E-TOKEN *</Label>
              <Input
                type="password"
                value={config.etoken}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, etoken: e.target.value })}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={testarIntegracao}
              disabled={testing || !config.slug || !config.etoken}
              variant="outline"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Testar ConexÃ£o
                </>
              )}
            </Button>
          </div>

          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* EndereÃ§o de Origem */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>EndereÃ§o de Origem (Remetente)</CardTitle>
          <CardDescription>
            EndereÃ§o de onde os produtos serÃ£o enviados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>CEP *</Label>
              <Input
                type="text"
                value={config.cep_origem}
                onChange={(e) => {
                  const cep = e.target.value.replace(/\D/g, '');
                  setConfig({ ...config, cep_origem: cep });
                }}
                onBlur={(e) => buscarCep(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome/RazÃ£o Social *</Label>
              <Input
                type="text"
                value={config.endereco_origem.nome}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    endereco_origem: { ...config.endereco_origem, nome: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>Telefone *</Label>
              <Input
                type="tel"
                value={config.endereco_origem.telefone}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    endereco_origem: { ...config.endereco_origem, telefone: e.target.value },
                  })
                }
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={config.endereco_origem.email}
              onChange={(e) =>
                setConfig({
                  ...config,
                  endereco_origem: { ...config.endereco_origem, email: e.target.value },
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>EndereÃ§o *</Label>
              <Input
                type="text"
                value={config.endereco_origem.endereco}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    endereco_origem: { ...config.endereco_origem, endereco: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>NÃºmero *</Label>
              <Input
                type="text"
                value={config.endereco_origem.numero}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    endereco_origem: { ...config.endereco_origem, numero: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Complemento</Label>
              <Input
                type="text"
                value={config.endereco_origem.complemento}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    endereco_origem: { ...config.endereco_origem, complemento: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>Bairro *</Label>
              <Input
                type="text"
                value={config.endereco_origem.bairro}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    endereco_origem: { ...config.endereco_origem, bairro: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Cidade *</Label>
              <Input
                type="text"
                value={config.endereco_origem.cidade}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    endereco_origem: { ...config.endereco_origem, cidade: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>Estado *</Label>
              <Input
                type="text"
                value={config.endereco_origem.estado}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    endereco_origem: {
                      ...config.endereco_origem,
                      estado: e.target.value.toUpperCase(),
                    },
                  })
                }
                maxLength={2}
                placeholder="SP"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DimensÃµes PadrÃ£o */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            DimensÃµes PadrÃ£o do Pacote
          </CardTitle>
          <CardDescription>
            Usado como base para cotaÃ§Ãµes de frete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Peso (g)</Label>
              <Input
                type="number"
                value={config.dimensoes_padrao.peso}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    dimensoes_padrao: {
                      ...config.dimensoes_padrao,
                      peso: parseInt(e.target.value) || 0,
                    },
                  })
                }
                min={0}
              />
            </div>
            <div>
              <Label>Altura (cm)</Label>
              <Input
                type="number"
                value={config.dimensoes_padrao.altura}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    dimensoes_padrao: {
                      ...config.dimensoes_padrao,
                      altura: parseInt(e.target.value) || 0,
                    },
                  })
                }
                min={0}
              />
            </div>
            <div>
              <Label>Largura (cm)</Label>
              <Input
                type="number"
                value={config.dimensoes_padrao.largura}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    dimensoes_padrao: {
                      ...config.dimensoes_padrao,
                      largura: parseInt(e.target.value) || 0,
                    },
                  })
                }
                min={0}
              />
            </div>
            <div>
              <Label>Comprimento (cm)</Label>
              <Input
                type="number"
                value={config.dimensoes_padrao.comprimento}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    dimensoes_padrao: {
                      ...config.dimensoes_padrao,
                      comprimento: parseInt(e.target.value) || 0,
                    },
                  })
                }
                min={0}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ConfiguraÃ§Ãµes AvanÃ§adas */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ConfiguraÃ§Ãµes AvanÃ§adas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>IntegraÃ§Ã£o Ativa</Label>
              <p className="text-sm text-gray-500">
                Desabilitar para pausar todas as operaÃ§Ãµes
              </p>
            </div>
            <Switch
              checked={config.ativo}
              onCheckedChange={(checked) => setConfig({ ...config, ativo: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>GeraÃ§Ã£o AutomÃ¡tica de Etiquetas</Label>
              <p className="text-sm text-gray-500">
                Gerar etiqueta automaticamente apÃ³s pagamento aprovado
              </p>
            </div>
            <Switch
              checked={config.geracao_automatica}
              onCheckedChange={(checked) => setConfig({ ...config, geracao_automatica: checked })}
            />
          </div>

          {config.geracao_automatica && (
            <div>
              <Label>ID do ServiÃ§o PadrÃ£o</Label>
              <Input
                type="text"
                value={config.servico_padrao_id}
                onChange={(e) => setConfig({ ...config, servico_padrao_id: e.target.value })}
                placeholder="Ex: pac, sedex, jadlog-package"
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe em branco para escolher manualmente
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BotÃ£o Salvar */}
      <div className="flex justify-end">
        <Button onClick={salvarConfig} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar ConfiguraÃ§Ãµes'
          )}
        </Button>
      </div>
    </div>
  );
}
