"use client";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function CustomizacoesAvancado() {
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    scripts_personalizados: '',
    meta_title: '',
    meta_description: '',
    google_analytics_id: '',
    facebook_pixel_id: '',
    alerta_cookies_ativo: true,
    loja_em_manutencao: false,
    manutencao_mensagem: '',
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
          scripts_personalizados: loja.scripts_personalizados || '',
          meta_title: loja.meta_title || '',
          meta_description: loja.meta_description || '',
          google_analytics_id: loja.google_analytics_id || '',
          facebook_pixel_id: loja.facebook_pixel_id || '',
          alerta_cookies_ativo: loja.alerta_cookies_ativo ?? true,
          loja_em_manutencao: loja.loja_em_manutencao ?? false,
          manutencao_mensagem: loja.manutencao_mensagem || '',
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
      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle>SEO (Otimização para Buscadores)</CardTitle>
          <CardDescription>Configurações de meta tags</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Meta Title</Label>
            <Input
              value={config.meta_title}
              onChange={(e) => setConfig({ ...config, meta_title: e.target.value })}
              placeholder="Título que aparece no Google"
            />
          </div>

          <div className="space-y-2">
            <Label>Meta Description</Label>
            <Textarea
              value={config.meta_description}
              onChange={(e) => setConfig({ ...config, meta_description: e.target.value })}
              placeholder="Descrição que aparece no Google"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics e Rastreamento</CardTitle>
          <CardDescription>Ferramentas de análise de tráfego</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Google Analytics ID</Label>
            <Input
              value={config.google_analytics_id}
              onChange={(e) => setConfig({ ...config, google_analytics_id: e.target.value })}
              placeholder="G-XXXXXXXXXX"
            />
          </div>

          <div className="space-y-2">
            <Label>Facebook Pixel ID</Label>
            <Input
              value={config.facebook_pixel_id}
              onChange={(e) => setConfig({ ...config, facebook_pixel_id: e.target.value })}
              placeholder="000000000000000"
            />
          </div>
        </CardContent>
      </Card>

      {/* Scripts Personalizados */}
      <Card>
        <CardHeader>
          <CardTitle>Scripts Personalizados</CardTitle>
          <CardDescription>Código HTML/JavaScript customizado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Scripts (avançado)</Label>
            <Textarea
              value={config.scripts_personalizados}
              onChange={(e) => setConfig({ ...config, scripts_personalizados: e.target.value })}
              placeholder="<script>...</script>"
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-sm text-gray-500">⚠️ Apenas para usuários avançados. Scripts incorretos podem quebrar o site.</p>
          </div>
        </CardContent>
      </Card>

      {/* Avisos */}
      <Card>
        <CardHeader>
          <CardTitle>Avisos e Alertas</CardTitle>
          <CardDescription>Notificações para os visitantes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alerta de Cookies (LGPD)</Label>
              <p className="text-sm text-gray-500">Banner informando sobre uso de cookies</p>
            </div>
            <Switch checked={config.alerta_cookies_ativo} onCheckedChange={(checked) => setConfig({ ...config, alerta_cookies_ativo: checked })} />
          </div>
        </CardContent>
      </Card>

      {/* Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle>Modo Manutenção</CardTitle>
          <CardDescription>Desativar temporariamente a loja</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Loja em Manutenção</Label>
              <p className="text-sm text-gray-500">⚠️ Visitantes verão apenas uma página de manutenção</p>
            </div>
            <Switch checked={config.loja_em_manutencao} onCheckedChange={(checked) => setConfig({ ...config, loja_em_manutencao: checked })} />
          </div>

          {config.loja_em_manutencao && (
            <div className="space-y-2">
              <Label>Mensagem de Manutenção</Label>
              <Textarea
                value={config.manutencao_mensagem}
                onChange={(e) => setConfig({ ...config, manutencao_mensagem: e.target.value })}
                placeholder="Estamos em manutenção. Voltaremos em breve!"
                rows={3}
              />
            </div>
          )}
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
