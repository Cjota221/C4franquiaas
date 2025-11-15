"use client";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function CustomizacoesHeader() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    menu_tipo: 'horizontal',
    logo_posicao: 'centro',
    logo_formato: 'horizontal',
    topo_flutuante: true,
    mostrar_icones_menu: true,
    barra_topo_texto: '',
    barra_topo_ativa: true,
    barra_topo_cor: '#000000',
    barra_topo_texto_cor: '#ffffff',
    barra_topo_font_size: 14,
    barra_topo_speed: 50,
    mensagens_regua: ['Frete grÃ¡tis acima de R$ 150', 'Parcele em atÃ© 6x sem juros'],
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
          menu_tipo: loja.menu_tipo || 'horizontal',
          logo_posicao: loja.logo_posicao || 'centro',
          logo_formato: loja.logo_formato || 'horizontal',
          topo_flutuante: loja.topo_flutuante ?? true,
          mostrar_icones_menu: loja.mostrar_icones_menu ?? true,
          barra_topo_texto: loja.barra_topo_texto || '',
          barra_topo_ativa: loja.barra_topo_ativa ?? true,
          barra_topo_cor: loja.barra_topo_cor || '#000000',
          barra_topo_texto_cor: loja.barra_topo_texto_cor || '#ffffff',
          barra_topo_font_size: loja.barra_topo_font_size ?? 14,
          barra_topo_speed: loja.barra_topo_speed ?? 50,
          mensagens_regua: loja.mensagens_regua || [],
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
      {/* RÃ©gua de AnÃºncios */}
      <Card>
        <CardHeader>
          <CardTitle>RÃ©gua de AnÃºncios Deslizante</CardTitle>
          <CardDescription>
            Mensagens rotativas no topo do site (passam automaticamente a cada 4 segundos)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mensagens (uma por linha)</Label>
            <Textarea
              value={config.mensagens_regua.join('\n')}
              onChange={(e) => setConfig({ ...config, mensagens_regua: e.target.value.split('\n').filter(m => m.trim()) })}
              placeholder="Frete grÃ¡tis acima de R$ 150&#10;Parcele em atÃ© 6x sem juros&#10;Cupom BEMVINDO10 - 10% OFF"
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              ðŸ’¡ {config.mensagens_regua.length} mensagem(ns) configurada(s). 
              {config.mensagens_regua.length > 1 ? ' DeslizarÃ£o automaticamente.' : config.mensagens_regua.length === 1 ? ' Adicione mais para ativar o slider.' : ' Adicione mensagens para exibir.'}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <Label>Cor de Fundo</Label>
                <Input type="color" value={config.barra_topo_cor} onChange={(e) => setConfig({ ...config, barra_topo_cor: e.target.value })} />
              </div>
              <div>
                <Label>Cor do Texto</Label>
                <Input type="color" value={config.barra_topo_texto_cor} onChange={(e) => setConfig({ ...config, barra_topo_texto_cor: e.target.value })} />
              </div>
              <div>
                <Label>Tamanho da Fonte (px)</Label>
                <Input type="number" value={String(config.barra_topo_font_size)} onChange={(e) => setConfig({ ...config, barra_topo_font_size: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Velocidade (1-200)</Label>
                <Input type="number" value={String(config.barra_topo_speed)} onChange={(e) => setConfig({ ...config, barra_topo_speed: Number(e.target.value) })} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>ConfiguraÃ§Ãµes de exibiÃ§Ã£o da logo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>PosiÃ§Ã£o</Label>
              <Select value={config.logo_posicao} onValueChange={(value) => setConfig({ ...config, logo_posicao: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="centro">Centro</SelectItem>
                  <SelectItem value="esquerda">Esquerda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={config.logo_formato} onValueChange={(value) => setConfig({ ...config, logo_formato: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="quadrada">Quadrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu */}
      <Card>
        <CardHeader>
          <CardTitle>Menu de NavegaÃ§Ã£o</CardTitle>
          <CardDescription>ConfiguraÃ§Ãµes do menu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Menu</Label>
            <Select value={config.menu_tipo} onValueChange={(value) => setConfig({ ...config, menu_tipo: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">Horizontal</SelectItem>
                <SelectItem value="vertical">Vertical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Topo Flutuante (Mobile)</Label>
              <p className="text-sm text-gray-500">Header fixo ao rolar a pÃ¡gina</p>
            </div>
            <Switch checked={config.topo_flutuante} onCheckedChange={(checked) => setConfig({ ...config, topo_flutuante: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Ãcones no Menu</Label>
              <p className="text-sm text-gray-500">Exibir Ã­cones ao lado dos nomes das categorias</p>
            </div>
            <Switch checked={config.mostrar_icones_menu} onCheckedChange={(checked) => setConfig({ ...config, mostrar_icones_menu: checked })} />
          </div>
        </CardContent>
      </Card>

      {/* Barra do Topo */}
      <Card>
        <CardHeader>
          <CardTitle>Barra do Topo</CardTitle>
          <CardDescription>Texto fixo acima da rÃ©gua de anÃºncios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativar Barra do Topo</Label>
            <Switch checked={config.barra_topo_ativa} onCheckedChange={(checked) => setConfig({ ...config, barra_topo_ativa: checked })} />
          </div>

          {config.barra_topo_ativa && (
            <div className="space-y-2">
              <Label>Texto</Label>
              <Input
                value={config.barra_topo_texto}
                onChange={(e) => setConfig({ ...config, barra_topo_texto: e.target.value })}
                placeholder="Ex: Loja Oficial - Produtos Originais"
              />
            </div>
          )}
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
