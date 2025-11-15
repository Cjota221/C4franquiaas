"use client";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function CustomizacoesCarrinho() {
  const supabase = createClient();
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
      console.error('Erro ao carregar configuraÃ§Ãµes:', error);
    }
  }, [supabase]);

  useEffect(() => {
    carregarConfig();
  }, [carregarConfig]);

  const salvarConfig = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('UsuÃ¡rio nÃ£o autenticado');

      const { data: franqueada } = await supabase
        .from('franqueadas')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!franqueada) throw new Error('Franqueada nÃ£o encontrada');

      const { error } = await supabase
        .from('lojas')
        .update(config)
        .eq('franqueada_id', franqueada.id);

      if (error) throw error;

      toast.success('ConfiguraÃ§Ãµes salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configuraÃ§Ãµes');
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
          <CardDescription>ConfiguraÃ§Ãµes do carrinho</CardDescription>
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
                <SelectItem value="pagina">PÃ¡gina Completa</SelectItem>
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

      {/* Compra RÃ¡pida */}
      <Card>
        <CardHeader>
          <CardTitle>Compra RÃ¡pida</CardTitle>
          <CardDescription>Funcionalidades de checkout rÃ¡pido</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compra RÃ¡pida Completa</Label>
              <p className="text-sm text-gray-500">Com seleÃ§Ã£o de variaÃ§Ãµes e quantidade</p>
            </div>
            <Switch checked={config.compra_rapida_completa} onCheckedChange={(checked) => setConfig({ ...config, compra_rapida_completa: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compra RÃ¡pida Simples</Label>
              <p className="text-sm text-gray-500">Apenas para produtos sem variaÃ§Ã£o</p>
            </div>
            <Switch checked={config.compra_rapida_simples} onCheckedChange={(checked) => setConfig({ ...config, compra_rapida_simples: checked })} />
          </div>
        </CardContent>
      </Card>

      {/* BotÃ£o Salvar */}
      <div className="flex justify-end">
        <Button onClick={salvarConfig} disabled={loading} size="lg">
          {loading ? 'Salvando...' : 'Salvar ConfiguraÃ§Ãµes'}
        </Button>
      </div>
    </div>
  );
}
