"use client";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function CustomizacoesCarrinho() {
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    carrinho_tipo: 'lateral',
    validar_estoque_carrinho: true,
    compra_rapida_completa: true,
    compra_rapida_simples: false,
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
          carrinho_tipo: loja.carrinho_tipo || 'lateral',
          validar_estoque_carrinho: loja.validar_estoque_carrinho ?? true,
          compra_rapida_completa: loja.compra_rapida_completa ?? true,
          compra_rapida_simples: loja.compra_rapida_simples ?? false,
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
      {/* Carrinho */}
      <Card>
        <CardHeader>
          <CardTitle>Carrinho de Compras</CardTitle>
          <CardDescription>Configurações do carrinho</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Carrinho</Label>
            <Select value={config.carrinho_tipo} onValueChange={(value) => setConfig({ ...config, carrinho_tipo: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lateral">Carrinho Lateral (Sidebar)</SelectItem>
                <SelectItem value="pagina">Página Completa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Validar Estoque ao Adicionar</Label>
              <p className="text-sm text-gray-500">Verificar disponibilidade antes de adicionar</p>
            </div>
            <Switch checked={config.validar_estoque_carrinho} onCheckedChange={(checked) => setConfig({ ...config, validar_estoque_carrinho: checked })} />
          </div>
        </CardContent>
      </Card>

      {/* Compra Rápida */}
      <Card>
        <CardHeader>
          <CardTitle>Compra Rápida</CardTitle>
          <CardDescription>Funcionalidades de checkout rápido</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compra Rápida Completa</Label>
              <p className="text-sm text-gray-500">Com seleção de variações e quantidade</p>
            </div>
            <Switch checked={config.compra_rapida_completa} onCheckedChange={(checked) => setConfig({ ...config, compra_rapida_completa: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compra Rápida Simples</Label>
              <p className="text-sm text-gray-500">Apenas para produtos sem variação</p>
            </div>
            <Switch checked={config.compra_rapida_simples} onCheckedChange={(checked) => setConfig({ ...config, compra_rapida_simples: checked })} />
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
