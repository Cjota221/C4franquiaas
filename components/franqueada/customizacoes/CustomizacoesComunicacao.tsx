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

export default function CustomizacoesComunicacao() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    whatsapp_flutuante: true,
    whatsapp_numero: '',
    whatsapp_posicao: 'direita',
    whatsapp_mensagem_padrao: '',
    newsletter_popup_ativo: true,
    newsletter_popup_delay: 5000,
    newsletter_rodape_ativo: true,
    instagram_feed_ativo: false,
    instagram_usuario: '',
    redes_sociais_rodape_ativas: true,
    facebook_url: '',
    instagram_url: '',
    youtube_url: '',
    tiktok_url: '',
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
          whatsapp_flutuante: loja.whatsapp_flutuante ?? true,
          whatsapp_numero: loja.whatsapp_numero || '',
          whatsapp_posicao: loja.whatsapp_posicao || 'direita',
          whatsapp_mensagem_padrao: loja.whatsapp_mensagem_padrao || '',
          newsletter_popup_ativo: loja.newsletter_popup_ativo ?? true,
          newsletter_popup_delay: loja.newsletter_popup_delay ?? 5000,
          newsletter_rodape_ativo: loja.newsletter_rodape_ativo ?? true,
          instagram_feed_ativo: loja.instagram_feed_ativo ?? false,
          instagram_usuario: loja.instagram_usuario || '',
          redes_sociais_rodape_ativas: loja.redes_sociais_rodape_ativas ?? true,
          facebook_url: loja.facebook_url || '',
          instagram_url: loja.instagram_url || '',
          youtube_url: loja.youtube_url || '',
          tiktok_url: loja.tiktok_url || '',
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
      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Flutuante</CardTitle>
          <CardDescription>BotÃ£o de contato fixo na tela</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativar WhatsApp Flutuante</Label>
            <Switch checked={config.whatsapp_flutuante} onCheckedChange={(checked) => setConfig({ ...config, whatsapp_flutuante: checked })} />
          </div>

          {config.whatsapp_flutuante && (
            <>
              <div className="space-y-2">
                <Label>NÃºmero do WhatsApp</Label>
                <Input
                  value={config.whatsapp_numero}
                  onChange={(e) => setConfig({ ...config, whatsapp_numero: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label>PosiÃ§Ã£o</Label>
                <Select value={config.whatsapp_posicao} onValueChange={(value) => setConfig({ ...config, whatsapp_posicao: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direita">Direita</SelectItem>
                    <SelectItem value="esquerda">Esquerda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mensagem PadrÃ£o</Label>
                <Textarea
                  value={config.whatsapp_mensagem_padrao}
                  onChange={(e) => setConfig({ ...config, whatsapp_mensagem_padrao: e.target.value })}
                  placeholder="OlÃ¡! Gostaria de mais informaÃ§Ãµes..."
                  rows={3}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Newsletter */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletter</CardTitle>
          <CardDescription>Captura de e-mails para marketing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Popup de Newsletter</Label>
              <p className="text-sm text-gray-500">Modal que aparece para capturar e-mail</p>
            </div>
            <Switch checked={config.newsletter_popup_ativo} onCheckedChange={(checked) => setConfig({ ...config, newsletter_popup_ativo: checked })} />
          </div>

          {config.newsletter_popup_ativo && (
            <div className="space-y-2">
              <Label>Delay do Popup (milissegundos)</Label>
              <Input
                type="number"
                value={config.newsletter_popup_delay}
                onChange={(e) => setConfig({ ...config, newsletter_popup_delay: parseInt(e.target.value) })}
                placeholder="5000"
              />
              <p className="text-sm text-gray-500">Tempo para aparecer apÃ³s o usuÃ¡rio entrar no site</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Newsletter no RodapÃ©</Label>
              <p className="text-sm text-gray-500">FormulÃ¡rio de cadastro no rodapÃ©</p>
            </div>
            <Switch checked={config.newsletter_rodape_ativo} onCheckedChange={(checked) => setConfig({ ...config, newsletter_rodape_ativo: checked })} />
          </div>
        </CardContent>
      </Card>

      {/* Instagram */}
      <Card>
        <CardHeader>
          <CardTitle>Instagram Feed</CardTitle>
          <CardDescription>Exibir posts do Instagram na loja</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativar Feed do Instagram</Label>
            <Switch checked={config.instagram_feed_ativo} onCheckedChange={(checked) => setConfig({ ...config, instagram_feed_ativo: checked })} />
          </div>

          {config.instagram_feed_ativo && (
            <div className="space-y-2">
              <Label>UsuÃ¡rio do Instagram</Label>
              <Input
                value={config.instagram_usuario}
                onChange={(e) => setConfig({ ...config, instagram_usuario: e.target.value })}
                placeholder="@sualojaoficial"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redes Sociais */}
      <Card>
        <CardHeader>
          <CardTitle>Redes Sociais</CardTitle>
          <CardDescription>Links para redes sociais no rodapÃ©</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Exibir Ãcones no RodapÃ©</Label>
            <Switch checked={config.redes_sociais_rodape_ativas} onCheckedChange={(checked) => setConfig({ ...config, redes_sociais_rodape_ativas: checked })} />
          </div>

          {config.redes_sociais_rodape_ativas && (
            <>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={config.facebook_url}
                  onChange={(e) => setConfig({ ...config, facebook_url: e.target.value })}
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={config.instagram_url}
                  onChange={(e) => setConfig({ ...config, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label>YouTube</Label>
                <Input
                  value={config.youtube_url}
                  onChange={(e) => setConfig({ ...config, youtube_url: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label>TikTok</Label>
                <Input
                  value={config.tiktok_url}
                  onChange={(e) => setConfig({ ...config, tiktok_url: e.target.value })}
                  placeholder="https://tiktok.com/@..."
                />
              </div>
            </>
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
