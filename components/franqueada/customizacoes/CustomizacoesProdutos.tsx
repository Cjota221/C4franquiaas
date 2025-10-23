"use client";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function CustomizacoesProdutos() {
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    produtos_por_linha_mobile: 2,
    mostrar_segunda_imagem: true,
    zoom_imagem: true,
    imagem_formato: 'quadrada',
    mostrar_estrelas: true,
    mostrar_selos_vitrine: true,
    botao_whatsapp_vitrine: false,
    botao_comprar_flutuante: true,
    calcular_frete_produto: true,
    mostrar_comentarios: true,
    quickview_ativo: true,
    produtos_relacionados_ativo: true,
    ultimos_visitados_ativo: true,
    compre_junto_ativo: false,
    vitrine_destaques_ativa: true,
    vitrine_lancamentos_ativa: true,
    vitrine_promocoes_ativa: true,
    vitrine_mais_vendidos_ativa: true,
    vitrine_frete_gratis_ativa: false,
    vitrine_tipo: 'carrossel',
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
          produtos_por_linha_mobile: loja.produtos_por_linha_mobile ?? 2,
          mostrar_segunda_imagem: loja.mostrar_segunda_imagem ?? true,
          zoom_imagem: loja.zoom_imagem ?? true,
          imagem_formato: loja.imagem_formato || 'quadrada',
          mostrar_estrelas: loja.mostrar_estrelas ?? true,
          mostrar_selos_vitrine: loja.mostrar_selos_vitrine ?? true,
          botao_whatsapp_vitrine: loja.botao_whatsapp_vitrine ?? false,
          botao_comprar_flutuante: loja.botao_comprar_flutuante ?? true,
          calcular_frete_produto: loja.calcular_frete_produto ?? true,
          mostrar_comentarios: loja.mostrar_comentarios ?? true,
          quickview_ativo: loja.quickview_ativo ?? true,
          produtos_relacionados_ativo: loja.produtos_relacionados_ativo ?? true,
          ultimos_visitados_ativo: loja.ultimos_visitados_ativo ?? true,
          compre_junto_ativo: loja.compre_junto_ativo ?? false,
          vitrine_destaques_ativa: loja.vitrine_destaques_ativa ?? true,
          vitrine_lancamentos_ativa: loja.vitrine_lancamentos_ativa ?? true,
          vitrine_promocoes_ativa: loja.vitrine_promocoes_ativa ?? true,
          vitrine_mais_vendidos_ativa: loja.vitrine_mais_vendidos_ativa ?? true,
          vitrine_frete_gratis_ativa: loja.vitrine_frete_gratis_ativa ?? false,
          vitrine_tipo: loja.vitrine_tipo || 'carrossel',
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
      {/* Exibição de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Exibição de Produtos</CardTitle>
          <CardDescription>Configurações de layout dos produtos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Produtos por linha (Mobile)</Label>
            <Select 
              value={config.produtos_por_linha_mobile.toString()} 
              onValueChange={(value) => setConfig({ ...config, produtos_por_linha_mobile: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 produto</SelectItem>
                <SelectItem value="2">2 produtos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Formato da Imagem</Label>
            <Select value={config.imagem_formato} onValueChange={(value) => setConfig({ ...config, imagem_formato: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quadrada">Quadrada</SelectItem>
                <SelectItem value="horizontal">Horizontal</SelectItem>
                <SelectItem value="vertical">Vertical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Segunda Imagem ao Passar o Mouse</Label>
              <p className="text-sm text-gray-500">Efeito hover com segunda foto do produto</p>
            </div>
            <Switch checked={config.mostrar_segunda_imagem} onCheckedChange={(checked) => setConfig({ ...config, mostrar_segunda_imagem: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Zoom na Imagem</Label>
              <p className="text-sm text-gray-500">Zoom ao passar o mouse sobre a imagem</p>
            </div>
            <Switch checked={config.zoom_imagem} onCheckedChange={(checked) => setConfig({ ...config, zoom_imagem: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Estrelas de Avaliação</Label>
              <p className="text-sm text-gray-500">Exibir avaliações dos produtos</p>
            </div>
            <Switch checked={config.mostrar_estrelas} onCheckedChange={(checked) => setConfig({ ...config, mostrar_estrelas: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Selos nas Vitrines</Label>
              <p className="text-sm text-gray-500">Badges de &quot;Novo&quot;, &quot;Promoção&quot;, etc.</p>
            </div>
            <Switch checked={config.mostrar_selos_vitrine} onCheckedChange={(checked) => setConfig({ ...config, mostrar_selos_vitrine: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Botão WhatsApp na Vitrine</Label>
              <p className="text-sm text-gray-500">Botão para contato direto na vitrine</p>
            </div>
            <Switch checked={config.botao_whatsapp_vitrine} onCheckedChange={(checked) => setConfig({ ...config, botao_whatsapp_vitrine: checked })} />
          </div>
        </CardContent>
      </Card>

      {/* Página do Produto */}
      <Card>
        <CardHeader>
          <CardTitle>Página do Produto</CardTitle>
          <CardDescription>Funcionalidades na página de detalhes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Botão Comprar Flutuante</Label>
              <p className="text-sm text-gray-500">Botão fixo ao rolar a página</p>
            </div>
            <Switch checked={config.botao_comprar_flutuante} onCheckedChange={(checked) => setConfig({ ...config, botao_comprar_flutuante: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Calcular Frete</Label>
              <p className="text-sm text-gray-500">Campo para calcular frete na página</p>
            </div>
            <Switch checked={config.calcular_frete_produto} onCheckedChange={(checked) => setConfig({ ...config, calcular_frete_produto: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Comentários</Label>
              <p className="text-sm text-gray-500">Área de avaliações e comentários</p>
            </div>
            <Switch checked={config.mostrar_comentarios} onCheckedChange={(checked) => setConfig({ ...config, mostrar_comentarios: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Visualização Rápida (Quickview)</Label>
              <p className="text-sm text-gray-500">Modal de detalhes ao clicar no produto</p>
            </div>
            <Switch checked={config.quickview_ativo} onCheckedChange={(checked) => setConfig({ ...config, quickview_ativo: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Produtos Relacionados</Label>
              <p className="text-sm text-gray-500">Sugestões de produtos similares</p>
            </div>
            <Switch checked={config.produtos_relacionados_ativo} onCheckedChange={(checked) => setConfig({ ...config, produtos_relacionados_ativo: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Últimos Produtos Visitados</Label>
              <p className="text-sm text-gray-500">Histórico de navegação do cliente</p>
            </div>
            <Switch checked={config.ultimos_visitados_ativo} onCheckedChange={(checked) => setConfig({ ...config, ultimos_visitados_ativo: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compre Junto</Label>
              <p className="text-sm text-gray-500">Sugestão de combo de produtos</p>
            </div>
            <Switch checked={config.compre_junto_ativo} onCheckedChange={(checked) => setConfig({ ...config, compre_junto_ativo: checked })} />
          </div>
        </CardContent>
      </Card>

      {/* Vitrines */}
      <Card>
        <CardHeader>
          <CardTitle>Vitrines de Produtos</CardTitle>
          <CardDescription>Seções de produtos na página inicial</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Exibição</Label>
            <Select value={config.vitrine_tipo} onValueChange={(value) => setConfig({ ...config, vitrine_tipo: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="carrossel">Carrossel</SelectItem>
                <SelectItem value="grade">Grade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Vitrine de Destaques</Label>
            <Switch checked={config.vitrine_destaques_ativa} onCheckedChange={(checked) => setConfig({ ...config, vitrine_destaques_ativa: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Vitrine de Lançamentos</Label>
            <Switch checked={config.vitrine_lancamentos_ativa} onCheckedChange={(checked) => setConfig({ ...config, vitrine_lancamentos_ativa: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Vitrine de Promoções</Label>
            <Switch checked={config.vitrine_promocoes_ativa} onCheckedChange={(checked) => setConfig({ ...config, vitrine_promocoes_ativa: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Vitrine de Mais Vendidos</Label>
            <Switch checked={config.vitrine_mais_vendidos_ativa} onCheckedChange={(checked) => setConfig({ ...config, vitrine_mais_vendidos_ativa: checked })} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Vitrine de Frete Grátis</Label>
            <Switch checked={config.vitrine_frete_gratis_ativa} onCheckedChange={(checked) => setConfig({ ...config, vitrine_frete_gratis_ativa: checked })} />
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
