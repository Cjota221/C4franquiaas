"use client";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function CustomizacoesPromocoes() {
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    desconto_progressivo_ativo: false,
    contador_regressivo_ativo: false,
    brinde_ativo: false,
    fidelizacao_pontos_ativa: false,
    frete_gratis_valor: 0,
  });

  const carregarConfig = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: franqueada } = await supabase
        .from('franqueadas')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!franqueada) return;

      const { data: loja } = await supabase
        .from('lojas')
        .select('*')
        .eq('franqueada_id', franqueada.id)
        .single();

      if (loja) {
        setConfig({
          desconto_progressivo_ativo: loja.desconto_progressivo_ativo ?? false,
          contador_regressivo_ativo: loja.contador_regressivo_ativo ?? false,
          brinde_ativo: loja.brinde_ativo ?? false,
          fidelizacao_pontos_ativa: loja.fidelizacao_pontos_ativa ?? false,
          frete_gratis_valor: loja.frete_gratis_valor ?? 0,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }, [supabase]);

  useEffect(() => {
    carregarConfig();
  }, [carregarConfig]);

  const salvarConfig = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: franqueada } = await supabase
        .from('franqueadas')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!franqueada) throw new Error('Franqueada não encontrada');

      const { error } = await supabase
        .from('lojas')
        .update(config)
        .eq('franqueada_id', franqueada.id);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Desconto Progressivo */}
      <Card>
        <CardHeader>
          <CardTitle>Desconto Progressivo</CardTitle>
          <CardDescription>Descontos que aumentam conforme o valor da compra</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Desconto Progressivo</Label>
              <p className="text-sm text-gray-500">Ex: 5% acima de R$ 100, 10% acima de R$ 200</p>
            </div>
            <Switch checked={config.desconto_progressivo_ativo} onCheckedChange={(checked) => setConfig({ ...config, desconto_progressivo_ativo: checked })} />
          </div>
        </CardContent>
      </Card>

      {/* Contador Regressivo */}
      <Card>
        <CardHeader>
          <CardTitle>Contador Regressivo</CardTitle>
          <CardDescription>Urgência nas ofertas com timer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Contador Regressivo</Label>
              <p className="text-sm text-gray-500">Timer de contagem regressiva em promoções</p>
            </div>
            <Switch checked={config.contador_regressivo_ativo} onCheckedChange={(checked) => setConfig({ ...config, contador_regressivo_ativo: checked })} />
          </div>
        </CardContent>
      </Card>

      {/* Brindes */}
      <Card>
        <CardHeader>
          <CardTitle>Brindes</CardTitle>
          <CardDescription>Oferecer brindes por produto ou valor mínimo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Sistema de Brindes</Label>
              <p className="text-sm text-gray-500">Brinde automático ao atingir condições</p>
            </div>
            <Switch checked={config.brinde_ativo} onCheckedChange={(checked) => setConfig({ ...config, brinde_ativo: checked })} />
          </div>
        </CardContent>
      </Card>

      {/* Fidelização */}
      <Card>
        <CardHeader>
          <CardTitle>Programa de Fidelidade</CardTitle>
          <CardDescription>Pontos por compras realizadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Programa de Pontos</Label>
              <p className="text-sm text-gray-500">Cliente acumula pontos para trocar por descontos</p>
            </div>
            <Switch checked={config.fidelizacao_pontos_ativa} onCheckedChange={(checked) => setConfig({ ...config, fidelizacao_pontos_ativa: checked })} />
          </div>
        </CardContent>
      </Card>

      {/* Frete Grátis */}
      <Card>
        <CardHeader>
          <CardTitle>Frete Grátis</CardTitle>
          <CardDescription>Valor mínimo para frete gratuito</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Valor Mínimo para Frete Grátis (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={config.frete_gratis_valor}
              onChange={(e) => setConfig({ ...config, frete_gratis_valor: parseFloat(e.target.value) })}
              placeholder="150.00"
            />
            <p className="text-sm text-gray-500">Deixe em 0 para desativar</p>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={salvarConfig} disabled={loading} size="lg">
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}
